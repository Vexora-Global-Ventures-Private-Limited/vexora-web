"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Bell, ChevronRight, Lock, CalendarClock, Building2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import type { Tier } from "@/lib/nav-store"
import { cn } from "@/lib/utils"
import { formatPaise } from "@/lib/api-mappers"
import { StatusPill } from "@/components/dashboard/status-pill"
import { useGetMyMembershipQuery } from "@/store/api/membershipsApi"
import { useGetMyListingsQuery, type Listing } from "@/store/api/listingsApi"
import {
  useGetCrmLeadsQuery,
  useGetCrmStagesQuery,
  useGetCrmSummaryQuery,
  type CrmSummary,
} from "@/store/api/leadsApi"
import {
  CHANNEL_LABEL,
  CHANNELS,
  MERCURY_STATUSES,
  MERCURY_STATUS_LABEL,
  MERCURY_STATUS_TONE,
  listingLabel,
  sortStages,
  stageOf,
  stageTone,
  timeAgo,
  toCrmLeadRow,
} from "@/components/crm/crm-lead"

// Shared, API-backed building blocks for the Mercury/Jupiter/Venus overview
// tabs. Each one owns its own query so a tier dashboard just composes them.

/**
 * First name for the welcome banners. A user with no profile name yet has
 * their phone number or email as `name` — greet them generically rather
 * than "Welcome back, +919876…".
 */
export function greetingName(user: { name: string } | null | undefined): string {
  const first = user?.name.trim().split(/\s+/)[0] ?? ""
  return !first || /[@+\d]/.test(first) ? "there" : first
}

export function totalLeads(summary: CrmSummary | undefined): number {
  if (!summary) return 0
  const byStatus = summary.byMercuryStatus.reduce((n, s) => n + s.count, 0)
  const byStage = summary.byStage.reduce((n, s) => n + s.count, 0)
  return Math.max(byStatus, byStage)
}

/** Membership expiry line for the welcome banners — GET /memberships/me. */
export function MembershipExpiry({ className }: { className?: string }) {
  const { data } = useGetMyMembershipQuery()
  if (!data?.expiresAt) return null
  const days = Math.ceil((new Date(data.expiresAt).getTime() - Date.now()) / 86_400_000)
  const date = new Date(data.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  const lapsed = data.status && data.status !== "active"
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <CalendarClock className="h-3.5 w-3.5" />
      {lapsed ? `Membership lapsed on ${date}` : days <= 0 ? `Membership expires today` : `Membership active until ${date} · ${days} day${days === 1 ? "" : "s"} left`}
    </span>
  )
}

/** Per-status (Mercury) or per-stage (Jupiter/Venus) counts from GET /crm/summary. */
export function PipelineCounts({ tier }: { tier: Tier }) {
  const isKanbanTier = tier === "J" || tier === "V"
  const { data: summary, isLoading } = useGetCrmSummaryQuery()
  const { data: rawStages, isError: stagesError } = useGetCrmStagesQuery(undefined, { skip: !isKanbanTier })
  const stages = useMemo(() => sortStages(rawStages ?? []), [rawStages])

  const cells = isKanbanTier
    ? stages.map((s, i) => ({
        key: s._id,
        label: s.name,
        // Leads with no stage yet sit in the first column.
        count:
          (summary?.byStage.find((b) => b.stageId === s._id)?.count ?? 0) +
          (i === 0 ? summary?.byStage.find((b) => !b.stageId)?.count ?? 0 : 0),
      }))
    : MERCURY_STATUSES.map((s) => ({
        key: s,
        label: MERCURY_STATUS_LABEL[s],
        count: summary?.byMercuryStatus.find((b) => b.status === s)?.count ?? 0,
      }))

  return (
    <div className="bg-card p-6 ring-1 ring-brand-border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Lead Pipeline</h3>
          <p className="text-xs text-brand-secondary/55">
            {cells.map((c) => c.label).join(" → ") || (stagesError ? "Couldn't load your pipeline stages." : "Loading stages…")}
          </p>
        </div>
        <span className="rounded-full bg-ink-black px-3 py-1 text-[11px] font-bold text-brand-primary">
          {isLoading ? "…" : `${totalLeads(summary)} lead${totalLeads(summary) === 1 ? "" : "s"}`}
        </span>
      </div>
      <div className={cn("mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4", isKanbanTier ? "lg:grid-cols-7" : "lg:grid-cols-5")}>
        {cells.map((c, i) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border border-brand-border bg-brand-tertiary/40 p-3 text-center"
          >
            <div className="font-serif text-2xl font-bold text-brand-secondary">{c.count}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-secondary/55">{c.label}</div>
          </motion.div>
        ))}
      </div>
      {(summary?.undeliveredCount ?? 0) > 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-red-700 dark:text-red-400">
          <Lock className="h-3.5 w-3.5" /> {summary!.undeliveredCount} enquir{summary!.undeliveredCount === 1 ? "y" : "ies"} waiting — renew to unlock
        </p>
      )}
    </div>
  )
}

/** Latest leads from GET /crm/leads — buyer identity only on delivered leads. */
export function RecentLeads({ tier, limit = 5, title = "Recent Leads" }: { tier: Tier; limit?: number; title?: string }) {
  const router = useRouter()
  const isKanbanTier = tier === "J" || tier === "V"
  const { data, isLoading, isError } = useGetCrmLeadsQuery({ limit })
  const { data: rawStages } = useGetCrmStagesQuery(undefined, { skip: !isKanbanTier })
  const stages = useMemo(() => sortStages(rawStages ?? []), [rawStages])
  const rows = (data?.leads ?? []).map(toCrmLeadRow)

  return (
    <div className="bg-card p-6 ring-1 ring-brand-border">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg font-bold text-brand-secondary">{title}</h3>
        <button
          onClick={() => router.push(ROUTES.dashboardTab("leads"))}
          className="text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
        >
          View all →
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {isLoading && <p className="text-xs text-brand-secondary/50">Loading leads…</p>}
        {isError && <p className="text-xs font-semibold text-red-500">Couldn&apos;t load leads.</p>}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="border border-dashed border-brand-border p-6 text-center text-xs text-brand-secondary/50">
            No enquiries yet — they&apos;ll appear here as soon as a buyer contacts one of your listings.
          </div>
        )}
        {rows.map((row) => {
          const delivered = row.delivery === "delivered"
          const stage = stageOf(row, stages)
          return (
            <button
              key={row.id}
              // Opens this exact lead in the pipeline's detail sheet.
              onClick={() => router.push(`${ROUTES.dashboardTab("leads")}&lead=${row.id}`)}
              className={cn(
                "w-full border p-3 text-left",
                delivered ? "border-brand-border bg-card hover:border-brand-primary/40" : "border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/30",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className={cn("flex items-center gap-1.5 text-xs font-bold", delivered ? "text-brand-secondary" : "text-red-700 dark:text-red-400")}>
                  {!delivered && <Lock className="h-3 w-3" />}
                  {delivered ? row.buyerName ?? "Buyer" : "Contact masked"}
                </div>
                {!delivered ? (
                  <StatusPill tone="danger">Undelivered</StatusPill>
                ) : isKanbanTier ? (
                  <StatusPill tone={stageTone(stage, stages)}>{stage?.name ?? "New"}</StatusPill>
                ) : (
                  <StatusPill tone={MERCURY_STATUS_TONE[row.status]}>{MERCURY_STATUS_LABEL[row.status]}</StatusPill>
                )}
              </div>
              <div className="mt-1 truncate text-[11px] text-brand-secondary/55">{listingLabel(row)}</div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-brand-secondary/45">
                <Bell className="h-2.5 w-2.5" /> {timeAgo(row.createdAt)} · {CHANNEL_LABEL[row.channel]}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Channel mix across the seller's most recent leads (no source analytics API exists). */
export function ChannelMix({ sample = 100 }: { sample?: number }) {
  const { data, isLoading } = useGetCrmLeadsQuery({ limit: sample })
  const leads = data?.leads ?? []
  const counts = CHANNELS.map((c) => ({ channel: c, count: leads.filter((l) => l.channel === c).length }))
  const max = Math.max(1, ...counts.map((c) => c.count))

  return (
    <div className="bg-card p-6 ring-1 ring-brand-border">
      <h3 className="font-serif text-base font-bold text-brand-secondary">How buyers reach you</h3>
      <p className="text-[11px] text-brand-secondary/55">
        Contact channel across your {leads.length === sample ? `latest ${sample}` : leads.length} lead{leads.length === 1 ? "" : "s"}
      </p>
      {isLoading ? (
        <p className="mt-4 text-xs text-brand-secondary/50">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="mt-4 text-xs text-brand-secondary/50">No leads yet.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {counts.map((c, i) => (
            <div key={c.channel}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-secondary">{CHANNEL_LABEL[c.channel]}</span>
                <span className="font-bold text-brand-primary-dark">
                  {c.count} · {Math.round((c.count / leads.length) * 100)}%
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(c.count / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const LISTING_STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "In review", tone: "warning" },
  live: { label: "Live", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  expired: { label: "Expired", tone: "danger" },
  removed: { label: "Removed", tone: "danger" },
}

/** Compact "My Listings" block from GET /listings/mine (no photos or view counts in the API). */
export function MyListingsMini({ limit, quotaHint }: { limit: number; quotaHint?: string }) {
  const router = useRouter()
  const { data, isLoading, isError } = useGetMyListingsQuery({ limit })
  const listings = data?.listings ?? []

  const openListing = (l: Listing) =>
    router.push(l.status === "live" ? ROUTES.propertyDetail(l.slug) : ROUTES.dashboardTab("listings"))

  return (
    <div className="bg-card p-6 ring-1 ring-brand-border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg font-bold text-brand-secondary">My Listings</h3>
          {quotaHint && <p className="text-xs text-brand-secondary/55">{quotaHint}</p>}
        </div>
        <button
          onClick={() => router.push(ROUTES.dashboardTab("listings"))}
          className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
        >
          Manage <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isLoading && <p className="text-xs text-brand-secondary/50">Loading listings…</p>}
        {isError && <p className="text-xs font-semibold text-red-500">Couldn&apos;t load your listings.</p>}
        {!isLoading && !isError && listings.length === 0 && (
          <div className="border border-dashed border-brand-border p-6 text-center text-xs text-brand-secondary/50 sm:col-span-2">
            No listings yet.{" "}
            <button onClick={() => router.push(ROUTES.newListing)} className="font-bold text-brand-primary-dark hover:underline">
              Post your first property →
            </button>
          </div>
        )}
        {listings.map((l) => {
          const status = LISTING_STATUS[l.status] ?? { label: l.status, tone: "neutral" as const }
          return (
            <button
              key={l._id}
              onClick={() => openListing(l)}
              className="group flex items-center gap-3 border border-brand-border bg-brand-tertiary/40 p-3 text-left hover:border-brand-primary/40"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-card">
                <Building2 className="h-5 w-5 text-brand-primary-dark" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-brand-secondary">{l.title}</div>
                <div className="truncate text-[11px] text-brand-secondary/55">
                  {[l.locality, l.city].filter(Boolean).join(", ") || "Location not set"}
                  {l.pricePaise ? ` · ${formatPaise(l.pricePaise)}` : ""}
                </div>
                <StatusPill tone={status.tone} className="mt-0.5">{status.label}</StatusPill>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-brand-secondary/40 transition-transform group-hover:translate-x-0.5" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
