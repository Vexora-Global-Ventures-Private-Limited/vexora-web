"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bell, CheckCheck, Mail, MessageCircle, RefreshCw } from "lucide-react"
import { useNav } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { getApiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import {
  useGetNotificationPreferencesQuery,
  useGetUnreadCountQuery,
  useLazyGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useUpdateNotificationPreferencesMutation,
  type ApiNotification,
  type NotificationPreference,
} from "@/store/api/notificationsApi"
import { useCursorList } from "@/components/crm/use-cursor-list"
import { timeAgo } from "@/components/crm/crm-lead"

type ReadFilter = "all" | "unread"

const PAGE_SIZE = 20

/**
 * In-app inbox (GET /notifications — flat `read` filter, real cursor
 * pagination), mark-read (POST /notifications/mark-read with `ids` or
 * `{ all: true}`), and per-event email/WhatsApp preferences built straight
 * from GET /notifications/preferences — never a hardcoded event list.
 */
export function NotificationsTab() {
  const user = useNav((s) => s.user)
  const { data: unreadCount = 0 } = useGetUnreadCountQuery(undefined, { skip: !user?.id })
  const [filter, setFilter] = useState<ReadFilter>("all")
  const [markRead, { isLoading: isMarkingAll }] = useMarkNotificationsReadMutation()
  // Bumped after "mark all read" so the list remounts with fresh read state.
  const [listVersion, setListVersion] = useState(0)
  const [error, setError] = useState<string | null>(null)

  if (!user?.id) {
    return (
      <div className="space-y-5">
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Notifications</h2>
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
          Sign in with your VXP account to see your notifications.
        </div>
      </div>
    )
  }

  const markAllRead = async () => {
    setError(null)
    try {
      await markRead({ all: true }).unwrap()
      setListVersion((v) => v + 1)
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "Couldn't mark notifications as read.")
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-secondary">Notifications</h2>
          <p className="text-sm text-brand-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex border border-brand-border bg-brand-tertiary/40 p-1">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  filter === f ? "bg-card text-brand-secondary shadow-sm" : "text-brand-secondary/55 hover:text-brand-secondary",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={isMarkingAll}
              className="flex items-center gap-1.5 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

      <NotificationList key={`${filter}-${listVersion}`} filter={filter} />

      <PreferencesCard />
    </div>
  )
}

/**
 * Where a notification should take the user, from its eventKey domain (the
 * payload shape varies per event, so only stable fields are read).
 */
function notificationHref(n: ApiNotification): string | null {
  const domain = n.eventKey.split(".")[0]
  const leadId = typeof n.payload?.leadId === "string" ? n.payload.leadId : null
  if (domain === "leads") return leadId ? `${ROUTES.dashboardTab("leads")}&lead=${leadId}` : ROUTES.dashboardTab("leads")
  if (domain === "listing") return ROUTES.dashboardTab("listings")
  if (domain === "membership" || domain === "billing") return ROUTES.membership
  if (domain === "ads") return ROUTES.advertiser
  return null
}

function NotificationList({ filter }: { filter: ReadFilter }) {
  const router = useRouter()
  const [trigger] = useLazyGetNotificationsQuery()
  const [markRead] = useMarkNotificationsReadMutation()
  const { items, setItems, nextCursor, status, loadMoreFailed, loadMore, reload } = useCursorList<ApiNotification>(async (cursor) => {
    const page = await trigger({ read: filter === "unread" ? false : undefined, cursor, limit: PAGE_SIZE }).unwrap()
    return { items: page.notifications, nextCursor: page.nextCursor }
  })

  const open = async (n: ApiNotification) => {
    const href = notificationHref(n)
    if (!n.read) {
      // In the Unread view a read item no longer belongs — drop it (and put
      // it back if marking fails).
      setItems((prev) =>
        filter === "unread" ? prev.filter((x) => x.id !== n.id) : prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      )
      markRead({ ids: [n.id] })
        .unwrap()
        .catch(() => {
          setItems((prev) =>
            filter === "unread"
              ? prev.some((x) => x.id === n.id)
                ? prev
                : [...prev, n].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              : prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)),
          )
        })
    }
    if (href) router.push(href)
  }

  if (status === "loading") {
    return <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">Loading notifications…</div>
  }
  if (status === "error" && items.length === 0) {
    return (
      <div className="card-sheen bg-card p-10 text-center text-sm text-red-500">
        Couldn&apos;t load notifications. <button onClick={reload} className="underline">Retry</button>
      </div>
    )
  }
  if (items.length === 0) {
    return (
      <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
        {filter === "unread" ? "No unread notifications." : "Nothing here yet."}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((n, i) => (
        <motion.button
          key={n.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i, 10) * 0.04 }}
          onClick={() => open(n)}
          aria-label={`${n.read ? "" : "Unread: "}${n.title}`}
          className={
            "flex w-full items-start gap-3 border bg-card p-4 text-left transition-colors " +
            (n.read ? "border-brand-border opacity-70" : "border-brand-primary/40 hover:bg-brand-tertiary/40")
          }
        >
          <div className={"mt-0.5 h-2 w-2 shrink-0 rounded-full " + (n.read ? "bg-brand-secondary/30" : "bg-brand-primary")} />
          <div className="min-w-0 flex-1">
            <div className="break-words text-sm font-bold text-brand-secondary">{n.title}</div>
            <div className="break-words text-xs text-brand-secondary/65">{n.body}</div>
            <div className="mt-1 text-[10px] text-brand-secondary/45">{timeAgo(n.createdAt)}</div>
          </div>
          {!n.read && (
            <span className="shrink-0 text-[10px] font-bold text-brand-primary-dark">
              {notificationHref(n) ? "Open" : "Mark read"}
            </span>
          )}
          {n.read && notificationHref(n) && (
            <span className="shrink-0 text-[10px] font-bold text-brand-secondary/50">Open</span>
          )}
        </motion.button>
      ))}
      {loadMoreFailed && (
        <p className="text-center text-xs font-semibold text-red-500">
          Couldn&apos;t load older notifications.{" "}
          <button type="button" onClick={loadMore} className="underline">Try again</button>
        </p>
      )}
      <div className="flex justify-center gap-3 pt-2">
        {nextCursor && !loadMoreFailed && (
          <button
            type="button"
            onClick={loadMore}
            disabled={status === "loadingMore"}
            className="border border-brand-border bg-card px-5 py-2 text-xs font-bold text-brand-secondary hover:border-brand-primary/50 disabled:opacity-60"
          >
            {status === "loadingMore" ? "Loading…" : "Load older"}
          </button>
        )}
        <button
          type="button"
          onClick={reload}
          className="flex items-center gap-1 px-2 py-2 text-xs font-semibold text-brand-secondary/55 hover:text-brand-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
    </div>
  )
}

const EVENT_LABEL: Record<string, string> = {
  "admin.daily_digest": "Daily admin digest",
  "auth.login_new_device": "Sign-in from a new device",
  "leads.new_received": "New enquiry on your listing",
  "listing.expiry_reminder": "Listing about to expire",
  "membership.expiry_reminder": "Membership about to expire",
}

/** "listing.expiry_reminder" → "Listing expiry reminder" for any event without a curated label. */
function eventLabel(eventKey: string) {
  if (EVENT_LABEL[eventKey]) return EVENT_LABEL[eventKey]
  const words = eventKey.replace(/[._]/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function PreferencesCard() {
  const { data: prefs, isLoading, isError, refetch } = useGetNotificationPreferencesQuery()
  const [update] = useUpdateNotificationPreferencesMutation()
  const [error, setError] = useState<string | null>(null)
  // One PATCH per toggle at a time — a fast double click would otherwise send
  // the same flip twice from the same stale state.
  const [pending, setPending] = useState<string[]>([])
  // Admin-only events aren't relevant on the consumer site.
  const visible = (prefs ?? []).filter((p) => p.domain !== "admin")

  const toggle = async (pref: NotificationPreference, channel: "email" | "whatsapp") => {
    const key = `${pref.eventKey}:${channel}`
    if (pending.includes(key)) return
    setError(null)
    setPending((p) => [...p, key])
    try {
      await update({ [pref.eventKey]: { [channel]: !pref.channels[channel] } }).unwrap()
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "Couldn't save that preference — it's been switched back.")
    } finally {
      setPending((p) => p.filter((k) => k !== key))
    }
  }

  return (
    <div className="card-sheen bg-card p-6">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-brand-primary-dark" />
        <h3 className="font-serif text-lg font-bold text-brand-secondary">Delivery preferences</h3>
      </div>
      <p className="mt-1 text-xs text-brand-muted-foreground">
        Choose which updates also reach you by email or WhatsApp. In-app notifications always stay on, and essential
        messages (OTPs, payment confirmations) can&apos;t be turned off.
      </p>

      {isLoading && <p className="mt-4 text-xs text-brand-muted-foreground">Loading preferences…</p>}
      {isError && (
        <p className="mt-4 text-xs font-semibold text-red-500">
          Couldn&apos;t load preferences. <button onClick={() => refetch()} className="underline">Retry</button>
        </p>
      )}
      {error && <p className="mt-3 text-xs font-semibold text-red-500">{error}</p>}

      {visible.length > 0 && (
        <div className="mt-4 divide-y divide-brand-border border border-brand-border">
          {visible.map((pref) => (
            <div key={pref.eventKey} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm font-semibold text-brand-secondary">{eventLabel(pref.eventKey)}</span>
              <div className="flex items-center gap-2">
                {pref.channels.email !== undefined && (
                  <ChannelToggle
                    icon={Mail}
                    label="Email"
                    eventLabel={eventLabel(pref.eventKey)}
                    on={pref.channels.email}
                    busy={pending.includes(`${pref.eventKey}:email`)}
                    onClick={() => toggle(pref, "email")}
                  />
                )}
                {pref.channels.whatsapp !== undefined && (
                  <ChannelToggle
                    icon={MessageCircle}
                    label="WhatsApp"
                    eventLabel={eventLabel(pref.eventKey)}
                    on={pref.channels.whatsapp}
                    busy={pending.includes(`${pref.eventKey}:whatsapp`)}
                    onClick={() => toggle(pref, "whatsapp")}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChannelToggle({
  icon: Icon,
  label,
  eventLabel,
  on,
  busy,
  onClick,
}: {
  icon: typeof Mail
  label: string
  eventLabel: string
  on: boolean
  busy: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={on}
      aria-label={`${label} for ${eventLabel}: ${on ? "on" : "off"}`}
      title={on ? `Turn off ${label}` : `Turn on ${label}`}
      className={cn(
        "flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60",
        on
          ? "border-brand-primary-dark bg-brand-surface text-brand-secondary"
          : "border-brand-border bg-card text-brand-secondary/45 line-through",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  )
}
