"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Bell, Building2, Crown, LogOut, Search } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import type { User } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"

export type ShellNavItem = {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  badge?: string | number
}

type DashboardShellProps = {
  navItems: ShellNavItem[]
  activeId: string
  user: User
  onSignOut: () => void
  brandLabel?: string
  eyebrow?: string
  topbarTitle: string
  topbarSubtitle?: ReactNode
  showUpgradeCard?: boolean
  /** Unread notification count — shows the bell's dot only when > 0. Omit if this shell has no notifications tab. */
  unreadNotifications?: number
  children: ReactNode
}

export function DashboardShell({
  navItems,
  activeId,
  user,
  onSignOut,
  brandLabel = "VXP",
  eyebrow,
  topbarTitle,
  topbarSubtitle,
  showUpgradeCard = true,
  unreadNotifications = 0,
  children,
}: DashboardShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setTab = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", id)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-brand-border">
        <SidebarHeader>
          <Link href={ROUTES.home} className="flex items-center gap-2.5 px-1 py-1">
            <div className="grid h-9 w-9 shrink-0 place-items-center bg-gradient-to-br from-brand-primary via-brand-primary to-brand-primary-dark shadow-[var(--shadow-royal-sm)]">
              <span className="font-serif text-base font-bold text-brand-secondary">V</span>
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="truncate font-serif text-base font-bold text-brand-secondary">{brandLabel}</div>
              <div className="truncate text-[10px] uppercase tracking-[0.18em] text-brand-primary-dark">
                {eyebrow ?? user.tierName}
              </div>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <NavMenu navItems={navItems} activeId={activeId} setTab={setTab} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          {showUpgradeCard && user.tier !== "V" && (
            <div className="bg-gradient-to-br from-brand-secondary to-ink-deep p-4 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-primary-light">
                <Crown className="h-3 w-3" /> {user.tier === "F" ? "Become a partner" : "Upgrade membership"}
              </div>
              <div className="mt-1.5 text-[11px] text-white/70">
                {user.tier === "F" ? "List your first property & start earning." : "Unlock more listings, CRM & analytics."}
              </div>
              <Link
                href={ROUTES.membership}
                className="btn-gold relative mt-3 flex w-full items-center justify-center overflow-hidden py-2 text-[11px] font-bold"
              >
                <span className="relative z-10">View plans →</span>
              </Link>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onSignOut} tooltip="Sign out">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-brand-border bg-card/90 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="text-brand-secondary" />
            <div className="min-w-0">
              <h1 className="truncate font-serif text-lg font-bold capitalize text-brand-secondary sm:text-xl">
                {topbarTitle}
              </h1>
              {topbarSubtitle && (
                <p className="truncate text-xs text-brand-muted-foreground">{topbarSubtitle}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary/40" />
              <input
                placeholder="Search leads, properties..."
                className="w-64 border border-brand-border bg-card py-2 pl-9 pr-3 text-sm text-brand-secondary outline-none focus:border-brand-primary"
              />
            </div>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => setTab("notifications")}
              className="relative grid h-10 w-10 shrink-0 place-items-center border border-brand-border text-brand-secondary/70 hover:bg-brand-tertiary"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-primary" />
              )}
            </button>
            <Link
              href={ROUTES.properties}
              className="btn-gold relative flex shrink-0 items-center gap-1.5 overflow-hidden px-4 py-2.5 text-xs font-bold sm:text-sm"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                <Building2 className="h-4 w-4" /> <span className="hidden sm:inline">Browse Properties</span>
              </span>
            </Link>
          </div>
        </header>

        <div className="p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

/** Rendered inside `SidebarProvider` so it can close the mobile drawer
 *  (a Sheet overlay) the moment a nav item is picked — on desktop the
 *  sidebar is a fixed rail and `setOpenMobile` is a no-op there anyway. */
function NavMenu({
  navItems,
  activeId,
  setTab,
}: {
  navItems: ShellNavItem[]
  activeId: string
  setTab: (id: string) => void
}) {
  const { isMobile, setOpenMobile } = useSidebar()
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.id}>
          {item.href ? (
            <SidebarMenuButton asChild isActive={activeId === item.id} tooltip={item.label}>
              <Link href={item.href} onClick={closeMobile}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton
              isActive={activeId === item.id}
              tooltip={item.label}
              onClick={() => {
                setTab(item.id)
                closeMobile()
              }}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </SidebarMenuButton>
          )}
          {item.badge != null && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
