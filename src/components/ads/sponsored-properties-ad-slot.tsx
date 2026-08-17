"use client"

import { ArrowUpRight, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { myAds } from "@/lib/dashboard-data"
import { projects } from "@/lib/projects-data"
import { properties } from "@/lib/vxp-data"
import { ROUTES } from "@/lib/routes"

/**
 * "Sponsored Properties" ad slot — placement "Top of listings & search
 * results" per the ad-type program (AD-112 "Sobha Sentosa — Sponsored
 * Boost" is live today). Same honesty rule as every other ad slot: renders
 * nothing when there's no real, currently-Live ad of this type.
 */
export function SponsoredPropertiesAdSlot() {
  const router = useRouter()
  const ad = myAds.find((a) => a.type === "Sponsored Properties" && a.status === "Live")
  if (!ad) return null

  const headlinePrefix = ad.headline.split(" — ")[0].trim()
  const matchedProject = projects.find((p) => p.name.startsWith(headlinePrefix))
  const matchedProperty = properties.find((p) => p.title.startsWith(headlinePrefix))
  const destination = matchedProject
    ? ROUTES.projectDetail(matchedProject.id)
    : matchedProperty
      ? ROUTES.propertyDetail(matchedProperty.id)
      : ROUTES.properties

  return (
    <button
      onClick={() => router.push(destination)}
      className="group flex w-full items-center justify-between gap-4 overflow-hidden border border-brand-primary/30 bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent text-left hover:border-brand-primary/50"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-5">
        <span className="flex shrink-0 items-center gap-1 bg-brand-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-black">
          <Crown className="h-3 w-3" /> Sponsored
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
