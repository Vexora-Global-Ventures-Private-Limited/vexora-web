"use client"

import { ArrowUpRight, Megaphone } from "lucide-react"
import { adClickHref, useGetHomeBannerQuery } from "@/store/api/adsApi"
import { bannerImage } from "@/components/ads/home-banner-ad-slot"

/**
 * City placement. "City Advertisement" isn't its own product on the
 * backend — it's a banner ad with a `targetCity`. There's no per-city
 * serving endpoint, so this reuses the (cached) home-banner pick and only
 * shows it on the page for the city that banner actually targets. Renders
 * nothing otherwise — no invented sponsors.
 */
export function CityAdSlot({ cityName }: { cityName: string }) {
  const { data: ad } = useGetHomeBannerQuery()
  if (!ad?.targetCity || ad.targetCity.toLowerCase() !== cityName.toLowerCase()) return null

  return (
    <a
      href={adClickHref(ad._id)}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group flex w-full items-center justify-between gap-4 overflow-hidden border border-brand-primary/30 bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent text-left hover:border-brand-primary/50"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-5">
        <span className="flex shrink-0 items-center gap-1 bg-brand-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-black">
          <Megaphone className="h-3 w-3" /> Sponsored
        </span>
        <div className="text-xs text-brand-secondary/55">{cityName}</div>
      </div>
      <span className="hidden shrink-0 items-center gap-1 pr-2 text-xs font-bold text-brand-primary-dark group-hover:text-brand-secondary sm:flex">
        View <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
      <img src={bannerImage(ad)} alt="" className="h-24 w-36 shrink-0 object-cover sm:h-28 sm:w-52" />
    </a>
  )
}
