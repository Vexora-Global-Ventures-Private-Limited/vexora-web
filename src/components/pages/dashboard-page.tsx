"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import {
  LayoutDashboard, Building2, Users, BarChart3, FileText, Settings, LogOut,
  Megaphone, Crown, Heart, Send, Bell, Sun, Moon, Gift,
} from "lucide-react"
import { useNav, canSell, type User } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { useNotificationsStore } from "@/lib/notifications-store"
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

export function DashboardPage() {
  const { user, logout } = useNav()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") ?? "overview"
  const unreadCount = useNotificationsStore((s) => s.notifications.filter((n) => !n.read).length)

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
          { id: "leads", label: "Lead Pipeline", icon: Users, badge: 42 } satisfies ShellNavItem,
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
    { id: "settings", label: "Settings", icon: Settings },
  ]

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
        <>Welcome back, {user.name.split(" ")[0]} — you&apos;re on the <b className="text-brand-primary-dark">{user.tierName}</b> plan.</>
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
      {tab === "settings" && <SettingsTab user={user} logout={logout} />}
    </DashboardShell>
  )
}

// ─── Tab sub-components (shared across tiers) ────────────────────────────

function SettingsTab({ user, logout }: { user: User; logout: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Settings</h2>
        <p className="text-sm text-brand-muted-foreground">Manage your account, membership &amp; preferences</p>
      </div>

      <div className="card-sheen bg-card p-6">
        <h3 className="font-serif text-lg font-bold text-brand-secondary">Profile</h3>
        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand-secondary to-ink-deep text-lg font-bold text-brand-primary">
            {user.initials}
          </div>
          <div>
            <div className="font-serif text-xl font-bold text-brand-secondary">{user.name}</div>
            <div className="text-sm text-brand-muted-foreground">{user.email}</div>
            <div className="exclusivity-chip mt-1 inline-flex items-center gap-1 !px-2 !py-0.5 text-[10px]">
              <Crown className="h-3 w-3" /> {user.tierName}
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground">Full name</label>
            <input defaultValue={user.name} className="mt-1.5 w-full border border-brand-border bg-card px-3 py-2 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground">Email</label>
            <input defaultValue={user.email} className="mt-1.5 w-full border border-brand-border bg-card px-3 py-2 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground">Mobile</label>
            <input defaultValue={user.phone ?? "+91 98765 43210"} className="mt-1.5 w-full border border-brand-border bg-card px-3 py-2 text-sm outline-none focus:border-brand-primary" />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground">City</label>
            <input defaultValue="Mumbai" className="mt-1.5 w-full border border-brand-border bg-card px-3 py-2 text-sm outline-none focus:border-brand-primary" />
          </div>
        </div>
        <button className="btn-gold relative mt-4 overflow-hidden px-5 py-2 text-sm font-bold">
          <span className="relative z-10">Save changes</span>
        </button>
      </div>

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
    </div>
  )
}

function AppearanceCard() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
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
