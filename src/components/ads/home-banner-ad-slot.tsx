"use client"

import { ArrowUpRight, Megaphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { myAds } from "@/lib/dashboard-data"
import { projects } from "@/lib/projects-data"
import { ROUTES } from "@/lib/routes"

/**
 * "Home Banner" ad slot — VXP home page, top fold (the flagship placement in
 * the 5-type ad program). Matches the CityAdSlot honesty rule exactly: only
 * ever renders a real, currently-Live Home Banner ad; when there isn't one,
 * it renders nothing at all rather than an empty placeholder strip.
 */
export function HomeBannerAdSlot() {
  const router = useRouter()
  const ad = myAds.find((a) => a.type === "Home Banner" && a.status === "Live")
  if (!ad) return null

  const headlinePrefix = ad.headline.split(" — ")[0].trim()
  const matchedProject = projects.find((p) => p.name.startsWith(headlinePrefix))
  const destination = matchedProject ? ROUTES.projectDetail(matchedProject.id) : ROUTES.projects

  return (
    <section aria-label="Sponsored" className="relative overflow-hidden border-y border-brand-primary/25">
      <button
        onClick={() => router.push(destination)}
        className="group relative mx-auto flex w-full max-w-[90rem] items-center justify-between gap-4 px-6 py-4 text-left sm:px-10 lg:px-16"
      >
        <img
          src={ad.bannerImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary via-brand-secondary/85 to-brand-secondary/40" />
        <div className="relative flex min-w-0 items-center gap-4">
          <span className="flex shrink-0 items-center gap-1.5 bg-brand-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-black">
            <Megaphone className="h-3 w-3" /> Sponsored
          </span>
          <div className="min-w-0">
            <div className="truncate font-serif text-lg font-bold text-white">{ad.headline}</div>
            <div className="text-xs text-white/50">{ad.placement}</div>
          </div>
        </div>
        <span className="relative flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-primary group-hover:text-brand-primary-light">
          Explore <ArrowUpRight className="h-4 w-4" />
        </span>
      </button>
    </section>
  )
}
