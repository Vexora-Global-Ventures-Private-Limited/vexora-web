"use client"

import { useId, useState, useSyncExternalStore } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutDashboard, Building2, Users, BarChart3, FileText, Settings, LogOut,
  Megaphone, Crown, Heart, Send, Bell, Sun, Moon, Gift, Trash2,
  BadgeCheck,
} from "lucide-react"
import { useNav, canSell, type User } from "@/lib/nav-store"
import { useAuth } from "@/hooks/use-auth"
import { getApiErrorMessage } from "@/lib/api-error"
import { useGetProfileQuery, useDeleteAccountMutation } from "@/store/api/usersApi"
import { ProfileDetailsForm } from "@/components/settings/profile-details-form"
import { ROUTES } from "@/lib/routes"
import { useGetUnreadCountQuery } from "@/store/api/notificationsApi"
import { useGetCrmSummaryQuery, type CrmSummary } from "@/store/api/leadsApi"
import { cn } from "@/lib/utils"
import { DashboardShell, type ShellNavItem } from "@/components/dashboard/dashboard-shell"
import { FreeDashboard } from "@/components/dashboards/free-dashboard"
import { MercuryDashboard } from "@/components/dashboards/mercury-dashboard"
import { JupiterDashboard } from "@/components/dashboards/jupiter-dashboard"
import { VenusDashboard } from "@/components/dashboards/venus-dashboard"
import { ListingsTab } from "@/components/dashboards/tabs/listings-tab"
import { LeadsTab } from "@/components/dashboards/tabs/leads-tab"
import { AnalyticsTab } from "@/components/dashboards/tabs/analytics-tab"
import { ShortlistTab } from "@/components/dashboards/tabs/shortlist-tab"
import { EnquiriesTab } from "@/components/dashboards/tabs/enquiries-tab"
import { NotificationsTab } from "@/components/dashboards/tabs/notifications-tab"
import { ProjectsTab } from "@/components/dashboards/tabs/projects-tab"
import { ReferralsTab } from "@/components/dashboards/tabs/referrals-tab"
import { VerificationTab } from "@/components/dashboards/tabs/verification-tab"
import { BillingHistory } from "@/components/billing/billing-history"
import { greetingName } from "@/components/crm/overview-widgets"

export function DashboardPage() {
  const { user } = useNav()
  // Real sessions: revokes the refresh token server-side and clears the
  // stored tokens, not just the local nav display state — see the comment
  // on the same fix in UserNavMenu. No-ops safely for demo/mock sessions.
  const { logout: endSession } = useAuth()
  const router = useRouter()
  // Every sign-out from the dashboard lands on the home page. Navigate first:
  // the session is only cleared once POST /auth/logout returns, so by then
  // we've left the portal and its guard can't bounce the visitor to /login.
  const logout = async () => {
    router.replace(ROUTES.home)
    await endSession()
  }
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab") ?? "overview"
  const isRealAccount = !!user?.id
  // Bell badge — polled since there's no real-time push channel yet. Paused
  // while the browser tab is in the background; stops entirely on sign-out
  // (skip) or when the dashboard unmounts.
  const { data: unreadCount = 0 } = useGetUnreadCountQuery(undefined, {
    skip: !isRealAccount,
    pollingInterval: 60_000,
    skipPollingIfUnfocused: true,
  })
  const isSellerTier = !!user && canSell(user)
  const { data: crmSummary } = useGetCrmSummaryQuery(undefined, { skip: !isRealAccount || !isSellerTier })

  // The (portal) layout guard already redirects to /login when there's no
  // session; this just avoids a null-ref flash during that redirect.
  if (!user) return null

  // Seller tools (Listings, Leads, etc.) are gated by tier via canSell(),
  // not persona — Mercury/Jupiter/Venus always have them, since owning
  // listings doesn't stop someone from also being a buyer elsewhere. Buyer
  // tools (Shortlist/Enquiries) are the mirror image: available to everyone
  // except Venus, whose dashboard is the one dedicated developer suite.
  const isSeller = canSell(user)
  const isVenusSeller = user.tier === "V"
  const showBuyerTabs = !isVenusSeller
  // Referral codes belong to any paid membership (Mercury/Jupiter/Venus).
  const isPaidMember = user.tier !== "F"

  const notificationsItem: ShellNavItem = {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    badge: unreadCount > 0 ? unreadCount : undefined,
  }

  const navItems: ShellNavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    ...(isSeller
      ? [
          // Venus's inventory model is Projects (multi-configuration developer
          // listings — Projects → Towers → Units), not flat Listings, so it
          // gets "My Projects" instead of "My Listings" rather than both
          // showing the same kind of property-card grid side by side.
          ...(isVenusSeller
            ? [{ id: "projects", label: "My Projects", icon: Building2 } satisfies ShellNavItem]
            : [{ id: "listings", label: "My Listings", icon: Building2 } satisfies ShellNavItem]),
          {
            id: "leads",
            label: "Lead Pipeline",
            icon: Users,
            // Leads still in the first column ("new") — real count, not decoration.
            badge: newLeadCount(crmSummary, user.tier) || undefined,
          } satisfies ShellNavItem,
          { id: "ads", label: "Advertiser", icon: Megaphone, href: ROUTES.advertiser } satisfies ShellNavItem,
          { id: "analytics", label: "Analytics", icon: BarChart3 } satisfies ShellNavItem,
          { id: "reports", label: "Reports", icon: FileText, href: ROUTES.reports } satisfies ShellNavItem,
        ]
      : []),
    ...(showBuyerTabs
      ? [
          { id: "shortlist", label: "Shortlist", icon: Heart } satisfies ShellNavItem,
          { id: "enquiries", label: "Enquiries", icon: Send } satisfies ShellNavItem,
        ]
      : []),
    ...(isPaidMember ? [{ id: "referrals", label: "Referrals", icon: Gift } satisfies ShellNavItem] : []),
    notificationsItem,
    // KYC → trust badge. Real accounts only (demo accounts have no API session).
    ...(user.id ? [{ id: "verification", label: "Verification", icon: BadgeCheck } satisfies ShellNavItem] : []),
    { id: "settings", label: "Settings", icon: Settings },
  ]

  // Only tabs this account actually has (and that render in-page — Advertiser
  // and Reports are links) are valid; anything else (?tab=typo, a Free user
  // on ?tab=leads) falls back to Overview instead of a blank page.
  const tab = navItems.some((n) => n.id === requestedTab && !n.href) ? requestedTab : "overview"

  const renderOverview = () => {
    if (user.tier === "F") return <FreeDashboard />
    if (user.tier === "M") return <MercuryDashboard />
    if (user.tier === "J") return <JupiterDashboard />
    return <VenusDashboard />
  }

  return (
    <DashboardShell
      navItems={navItems}
      activeId={tab}
      user={user}
      onSignOut={logout}
      unreadNotifications={unreadCount}
      topbarTitle={navItems.find((n) => n.id === tab)?.label ?? "Dashboard"}
      topbarSubtitle={
        <>Welcome back, {greetingName(user)} — you&apos;re on the <b className="text-brand-primary-dark">{user.tierName}</b> plan.</>
      }
    >
      {tab === "overview" && renderOverview()}
      {showBuyerTabs && tab === "shortlist" && <ShortlistTab />}
      {showBuyerTabs && tab === "enquiries" && <EnquiriesTab />}
      {isSeller && !isVenusSeller && tab === "listings" && <ListingsTab tier={user.tier} />}
      {isVenusSeller && tab === "projects" && <ProjectsTab />}
      {isSeller && tab === "leads" && <LeadsTab tier={user.tier} />}
      {isSeller && tab === "analytics" && <AnalyticsTab tier={user.tier} />}
      {isPaidMember && tab === "referrals" && <ReferralsTab user={user} />}
      {tab === "notifications" && <NotificationsTab />}
      {user.id && tab === "verification" && <VerificationTab isPaidMember={isPaidMember} />}
      {tab === "settings" && <SettingsTab user={user} logout={logout} />}
    </DashboardShell>
  )
}

/**
 * Nav badge for Lead Pipeline. Mercury: leads still in status "new".
 * Jupiter/Venus: leads not placed on a Kanban stage yet (the summary's
 * byStage bucket with no stageId) — the board shows those in its first column.
 */
function newLeadCount(summary: CrmSummary | undefined, tier: User["tier"]): number {
  if (!summary) return 0
  if (tier === "M") return summary.byMercuryStatus.find((s) => s.status === "new")?.count ?? 0
  return summary.byStage.find((s) => !s.stageId)?.count ?? 0
}

// ─── Tab sub-components (shared across tiers) ────────────────────────────

function SettingsTab({ user, logout }: { user: User; logout: () => Promise<void> }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Settings</h2>
        <p className="text-sm text-brand-muted-foreground">Manage your account, membership &amp; preferences</p>
      </div>

      <ProfileCard user={user} />

      {user.id && <BillingHistory />}

      <AppearanceCard />

      <div className="border border-red-200 bg-card p-6">
        <h3 className="font-serif text-lg font-bold text-brand-secondary">Sign out</h3>
        <p className="text-sm text-brand-muted-foreground">End your session and return to the landing page.</p>
        <button
          onClick={logout}
          className="mt-4 inline-flex items-center gap-2 border border-red-200 bg-red-50 px-5 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      {user.id && <DeleteAccountCard logout={logout} />}
    </div>
  )
}

const inputClass =
  "mt-1.5 w-full border border-brand-border bg-card px-3 py-2 text-sm outline-none focus:border-brand-primary disabled:bg-brand-tertiary/40 disabled:text-brand-muted-foreground aria-[invalid=true]:border-red-400"
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground"

/**
 * Profile editor backed by GET/PATCH /users/me/profile, via the form shared
 * with the signup step. Mobile/email are account identity, verified inline
 * via OTP rather than saved with the profile.
 */
function ProfileCard({ user }: { user: User }) {
  const isRealAccount = !!user.id
  const { data: profile, isLoading, isError, refetch } = useGetProfileQuery(undefined, { skip: !isRealAccount })

  return (
    <div className="card-sheen bg-card p-6">
      <h3 className="font-serif text-lg font-bold text-brand-secondary">Profile</h3>
      <div className="mt-4 flex items-center gap-4">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-secondary to-ink-deep text-lg font-bold text-brand-primary">
            {user.initials}
          </div>
        )}
        <div>
          <div className="font-serif text-xl font-bold text-brand-secondary">{user.name}</div>
          <div className="text-sm text-brand-muted-foreground">{user.email || user.phone}</div>
          <div className="exclusivity-chip mt-1 inline-flex items-center gap-1 !px-2 !py-0.5 text-[10px]">
            <Crown className="h-3 w-3" /> {user.tierName}
          </div>
        </div>
      </div>

      {!isRealAccount && (
        <p className="mt-4 text-sm text-brand-muted-foreground">Sign in with a real account to edit your profile.</p>
      )}

      {isRealAccount && isLoading && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading profile">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 animate-pulse bg-brand-tertiary" />
              <div className="mt-2 h-9 w-full animate-pulse bg-brand-tertiary/60" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-4 text-xs font-semibold text-red-500">
          Couldn&apos;t load your profile.{" "}
          <button onClick={() => refetch()} className="underline">Retry</button>
        </p>
      )}

      {/* Mounted only once the server copy exists, so the form's initial
          state is seeded straight from it. */}
      {profile && (
        <ProfileDetailsForm
          profile={profile}
          user={user}
          inputClass={inputClass}
          labelClass={labelClass}
          submitLabel="Save changes"
          requireEdit
          showAvatar
          missingBanner="always"
        />
      )}
    </div>
  )
}

/**
 * DELETE /users/me — the backend asks for no confirmation, so the "are you
 * sure?" step lives here. On success the session is cleared exactly like a
 * normal logout (the old access token briefly outlives the deletion
 * server-side — KNOWN-ISSUES #35 — nothing for the frontend to do about it).
 */
function DeleteAccountCard({ logout }: { logout: () => Promise<void> }) {
  const [deleteAccount, { isLoading }] = useDeleteAccountMutation()
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState("")
  const [error, setError] = useState<string | null>(null)
  const confirmInputId = useId()
  // Typed confirmation — this can't be undone, so one stray click isn't enough.
  const canDelete = typed.trim() === "DELETE"

  const confirmDelete = async () => {
    if (!canDelete) return
    setError(null)
    try {
      await deleteAccount().unwrap()
      await logout()
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "Couldn't delete your account. Please try again.")
    }
  }

  return (
    <div className="border border-red-200 bg-card p-6">
      <h3 className="font-serif text-lg font-bold text-brand-secondary">Delete account</h3>
      <p className="text-sm text-brand-muted-foreground">
        Permanently deletes your VXP account and signs you out. This can&apos;t be undone.
      </p>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="mt-4 inline-flex items-center gap-2 border border-red-200 bg-red-50 px-5 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" /> Delete my account
        </button>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor={confirmInputId} className="w-full text-sm font-semibold text-red-700">
            Type DELETE to confirm
          </label>
          <input
            id={confirmInputId}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmDelete()}
            autoComplete="off"
            placeholder="DELETE"
            className="w-40 border border-red-200 bg-card px-3 py-2 text-sm outline-none focus:border-red-400"
          />
          <button
            onClick={confirmDelete}
            disabled={isLoading || !canDelete}
            className="inline-flex items-center gap-2 bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" /> {isLoading ? "Deleting…" : "Yes, delete it"}
          </button>
          <button
            onClick={() => {
              setConfirming(false)
              setTyped("")
            }}
            disabled={isLoading}
            className="px-3 py-2 text-sm font-semibold text-brand-secondary/70 hover:text-brand-secondary"
          >
            Cancel
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  )
}

function AppearanceCard() {
  const { resolvedTheme, setTheme } = useTheme()
  // false during SSR/hydration, true once mounted on the client — the theme
  // is only known client-side, so this avoids a hydration mismatch without
  // a setState-in-effect.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <div className="card-sheen bg-card p-6">
      <h3 className="font-serif text-lg font-bold text-brand-secondary">Appearance</h3>
      <p className="mt-1 text-sm text-brand-muted-foreground">Choose how VXP looks on this device.</p>
      <div className="mt-4 inline-flex border border-brand-border bg-brand-tertiary/40 p-1">
        <button
          type="button"
          onClick={() => setTheme("light")}
          aria-pressed={!isDark}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors",
            !isDark ? "bg-card text-brand-secondary shadow-sm" : "text-brand-secondary/55 hover:text-brand-secondary",
          )}
        >
          <Sun className="h-4 w-4" /> Light
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          aria-pressed={isDark}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors",
            isDark ? "bg-card text-brand-secondary shadow-sm" : "text-brand-secondary/55 hover:text-brand-secondary",
          )}
        >
          <Moon className="h-4 w-4" /> Dark
        </button>
      </div>
    </div>
  )
}
