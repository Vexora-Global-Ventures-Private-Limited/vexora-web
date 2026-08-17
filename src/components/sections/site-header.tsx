"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { UserNavMenu } from "@/components/site/user-nav-menu"
import { HeaderSearch } from "@/components/sections/header-search"
import { useNav } from "@/lib/nav-store"

const navItems = [
  { label: "Residence", href: ROUTES.properties },
  { label: "Commercial", href: ROUTES.commercial },
  { label: "Land & Luxury Villa", href: ROUTES.landLuxuryVilla },
  { label: "Global Properties", href: ROUTES.globalProperties },
  { label: "Smart Pool", href: ROUTES.smartPool },
  { label: "Rent & Earn", href: ROUTES.rentEarn },
  { label: "Cities", href: ROUTES.cities },
  { label: "Membership", href: ROUTES.membership },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [navHidden, setNavHidden] = useState(false)
  const lastScrollY = useRef(0)
  const router = useRouter()
  const user = useNav((s) => s.user)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      // Hides while scrolling down (more reading room) and reappears on scroll
      // up. On mobile that's Row 1 (logo/account) and Row 2 (nav links) —
      // the search bar (Row 3) stays put so it's always reachable. On
      // desktop only Row 2 folds away; Row 1 always stays visible there.
      if (y > lastScrollY.current && y > 140) {
        setNavHidden(true)
      } else if (y < lastScrollY.current) {
        setNavHidden(false)
      }
      lastScrollY.current = y
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
      {/* Row 1: logo — search — account / CTA. Carries the header's own
          opaque background (moved down from the old <header> element) so
          Row 2 below can be genuinely see-through on mobile instead of
          just visually blank on top of an opaque parent. On mobile this
          folds away with Row 2 on scroll-down (lg:max-h-24 lg:opacity-100
          pins it permanently visible at lg+, same as before this change). */}
      <div
        className={cn(
          "relative overflow-hidden transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:max-h-24 lg:opacity-100",
          navHidden ? "max-h-0 opacity-0" : "max-h-24 opacity-100",
          scrolled
            ? "border-b border-brand-border/80 bg-white/94 shadow-[var(--shadow-royal-sm)] lg:bg-white/90 lg:backdrop-blur-xl dark:bg-brand-tertiary/94 dark:lg:bg-brand-tertiary/90"
            : "bg-white/94 backdrop-blur-xl lg:bg-transparent lg:backdrop-blur-none dark:bg-brand-tertiary/94 dark:lg:bg-transparent",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-primary-muted/70 to-transparent transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ opacity: scrolled ? 1 : 0, transform: scrolled ? "scaleX(1)" : "scaleX(0.4)" }}
        />
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-3 px-4 py-3 sm:px-10 lg:px-16">
          <Link href={ROUTES.home} className="group flex shrink-0 items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center border border-brand-primary-muted/35 bg-brand-secondary shadow-[var(--shadow-royal-sm)] transition-transform duration-300 group-hover:scale-[1.03]">
              <span className="font-serif text-xl font-bold text-brand-primary-light">V</span>
            </div>
            <div className="hidden flex-col leading-none sm:flex">
              <span
                className={cn(
                  "font-serif text-2xl font-bold tracking-tight transition-colors duration-500",
                  scrolled ? "text-brand-secondary" : "text-brand-secondary lg:text-paper-ivory",
                )}
              >
                VXP
              </span>
            </div>
          </Link>

          <div className="hidden flex-1 items-center justify-center md:flex">
            <HeaderSearch />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle
              className={cn(
                "grid h-10 w-10",
                scrolled ? "text-brand-secondary hover:bg-brand-surface" : "text-brand-secondary hover:bg-brand-surface lg:text-white/80 lg:hover:bg-white/10 lg:hover:text-white",
              )}
            />
            {user ? (
              <UserNavMenu
                user={user}
                className={cn(
                  "flex transition-colors duration-500",
                  scrolled ? "text-brand-secondary" : "text-brand-secondary lg:text-white",
                )}
              />
            ) : (
              <button
                type="button"
                onClick={() => router.push(ROUTES.login)}
                className={cn(
                  "inline-flex px-3 py-2 text-sm font-semibold transition-colors duration-500",
                  scrolled
                    ? "text-brand-secondary hover:bg-brand-tertiary"
                    : "text-brand-secondary hover:bg-brand-surface lg:text-white/85 lg:hover:bg-white/10 lg:hover:text-white",
                )}
              >
                Log in
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push(user ? ROUTES.dashboard : ROUTES.loginWithReturn(ROUTES.dashboard))}
              className={cn(
                "inline-flex items-center gap-2 rounded-none px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors duration-400 sm:px-6",
                scrolled
                  ? "bg-brand-secondary text-brand-tertiary hover:bg-brand-primary hover:text-ink-black"
                  : "bg-brand-primary text-ink-black hover:bg-brand-primary-light",
              )}
            >
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Start Listing</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: search — mobile only (row 1 hides it under md). Now sits
          above Row 2 in the stack, on its own opaque bg-card so it stays
          readable regardless of what's behind the transparent nav row below. */}
      <div className="flex justify-center border-t border-brand-border-light/70 bg-card/95 px-4 py-2 md:hidden">
        <HeaderSearch />
      </div>

      {/* Row 2: full nav, no hamburger. Hides on scroll-down, reappears on
          scroll-up. Transparent on mobile (sits below the search bar with
          nothing behind it but the page); regains its own solid backdrop
          at lg+ once scrolled, matching Row 1 there, same as before. */}
      <div
        className={cn(
          "overflow-hidden border-t bg-transparent transition-[max-height,opacity,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          navHidden ? "max-h-0 border-transparent opacity-0" : "max-h-14 opacity-100",
          !navHidden && (scrolled ? "border-brand-border-light/70" : "border-white/10 lg:border-white/15"),
          scrolled && "lg:bg-white/90 lg:backdrop-blur-xl dark:lg:bg-brand-tertiary/90",
        )}
      >
        <nav className="no-scrollbar flex items-center gap-0.5 overflow-x-auto px-4 py-1.5 sm:px-10 lg:justify-center lg:px-16">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                // Mobile is always transparent now (see Row 2 above), so
                // links need the light treatment at all times there — the
                // same one desktop only used to use pre-scroll, over the hero.
                "group relative shrink-0 whitespace-nowrap px-3 py-2 text-[13px] font-medium text-white/80 transition-colors duration-500 hover:text-white",
                scrolled
                  ? "lg:text-brand-secondary/75 lg:hover:text-brand-secondary"
                  : "lg:text-white/75 lg:hover:text-white",
              )}
            >
              {item.label}
              <span className="absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-brand-primary-muted transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
