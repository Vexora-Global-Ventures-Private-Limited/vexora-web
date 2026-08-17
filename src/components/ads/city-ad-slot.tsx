"use client"

import { ArrowUpRight, Megaphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { myAds } from "@/lib/dashboard-data"
import { projects } from "@/lib/projects-data"
import { ROUTES } from "@/lib/routes"

/**
 * "City Advertisement" ad slot — matches the ad type already documented and
 * seeded in this app (myAds in dashboard-data.ts, e.g. AD-102 "Runwal
 * Sanctuary — Mumbai Spotlight" / "Mumbai search results", live today;
 * AD-107 for Bengaluru is Paused). Only ever renders a real, currently-Live
 * ad for this exact city — when there isn't one, it renders nothing at all
 * rather than an empty placeholder box (no fake/invented sponsor content).
 */
export function CityAdSlot({ cityName }: { cityName: string }) {
  const router = useRouter()
  const ad = myAds.find(
    (a) => a.type === "City Advertisement" && a.status === "Live" && a.placement.startsWith(cityName),
  )
  if (!ad) return null

  // Best-effort link to the real project the ad is promoting (e.g. "Runwal
  // Sanctuary — Mumbai Spotlight" → the "Runwal Sanctuary" project), falling
  // back to the city-filtered catalog when no project name matches.
  const headlinePrefix = ad.headline.split(" — ")[0].trim()
  const matchedProject = projects.find((p) => p.name.startsWith(headlinePrefix))
  const destination = matchedProject
    ? ROUTES.projectDetail(matchedProject.id)
    : `${ROUTES.properties}?city=${encodeURIComponent(cityName)}`

  return (
    <button
      onClick={() => router.push(destination)}
      className="group flex w-full items-center justify-between gap-4 overflow-hidden border border-brand-primary/30 bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent text-left hover:border-brand-primary/50"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-5">
        <span className="flex shrink-0 items-center gap-1 bg-brand-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-black">
          <Megaphone className="h-3 w-3" /> Sponsored
        </span>
        <div className="min-w-0">
          <div className="truncate font-serif text-base font-bold text-brand-secondary">{ad.headline}</div>
          <div className="text-xs text-brand-secondary/55">{ad.placement}</div>
        </div>
      </div>
      <span className="hidden shrink-0 items-center gap-1 pr-2 text-xs font-bold text-brand-primary-dark group-hover:text-brand-secondary sm:flex">
        View <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
      <img
        src={ad.bannerImage}
        alt={ad.headline}
        className="h-24 w-36 shrink-0 object-cover sm:h-28 sm:w-52"
      />
    </button>
  )
}
