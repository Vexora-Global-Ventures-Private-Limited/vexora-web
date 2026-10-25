"use client"

import { ArrowLeft, ArrowUpRight, type LucideIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { UserNavMenu } from "@/components/site/user-nav-menu"
import { Reveal } from "@/components/motion/reveal"

type ComingSoonPageProps = {
  icon: LucideIcon
  title: string
  audience: string
  description: string
}

/**
 * Shared placeholder for nav destinations that exist as real links in the
 * header today but don't have a built-out experience yet (Smart Pool,
 * Rent & Earn). Keeps every nav item clickable and on-brand until each gets
 * built out as its own pass.
 */
export function ComingSoonPage({ icon: Icon, title, audience, description }: ComingSoonPageProps) {
  const router = useRouter()
  const pathname = usePathname() ?? ROUTES.home
  const user = useNav((s) => s.user)

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(ROUTES.home)}
              className="grid h-10 w-10 place-items-center border border-brand-border-light text-brand-secondary hover:bg-brand-surface"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="grid h-10 w-10 place-items-center bg-gradient-to-br from-brand-primary via-brand-primary to-gold-700 shadow-md">
              <span className="font-serif text-lg font-bold text-brand-secondary">V</span>
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-brand-secondary">{title}</h1>
              <p className="text-xs text-brand-secondary/55">{audience}</p>
            </div>
          </div>
          {/* Visible on every screen size — this header is the page's only way in or out of a session. */}
          {user ? (
            <UserNavMenu user={user} className="flex text-brand-secondary" />
          ) : (
            <button
              onClick={() => router.push(ROUTES.loginWithReturn(pathname))}
              className="shrink-0 border border-brand-border-light px-4 py-2 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
            >
              Log in
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <Reveal direction="up">
          <div className="mx-auto grid h-16 w-16 place-items-center border border-brand-primary-muted/35 bg-gradient-to-br from-brand-primary via-brand-primary to-gold-700 shadow-[var(--shadow-royal-sm)]">
            <Icon className="h-7 w-7 text-brand-secondary" />
          </div>
          <h2 className="mt-6 font-serif text-3xl font-bold text-brand-secondary sm:text-4xl">
            {title} <span className="text-gold-gradient italic">is on its way.</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-secondary/65">{description}</p>
          <button
            onClick={() => router.push(ROUTES.properties)}
            className="btn-gold mt-8 inline-flex items-center gap-2 overflow-hidden px-6 py-3 text-sm font-bold"
          >
            <span className="relative z-10 flex items-center gap-2">
              Browse live listings instead <ArrowUpRight className="h-4 w-4" />
            </span>
          </button>
        </Reveal>
      </div>
    </div>
  )
}
