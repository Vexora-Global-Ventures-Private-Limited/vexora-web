"use client"

import { useGetHomeBannerQuery } from "@/store/api/adsApi"
import { BannerCard } from "@/components/ads/home-banner-ad-slot"

/**
 * City placement. "City Advertisement" isn't its own product on the
 * backend — it's a banner ad with a `targetCity`. There's no per-city
 * serving endpoint, so this reuses the (cached) home-banner pick and only
 * shows it on the page for the city that banner actually targets. Renders
 * nothing otherwise — no invented sponsors.
 */
export function CityAdSlot({ cityName }: { cityName: string }) {
  const { data: ad } = useGetHomeBannerQuery()
  // The serving API doesn't return targetCity today (verified 2026-10-31), so
  // this only renders once it does — never on a guess.
  if (!ad?.imageUrl || !ad.targetCity || ad.targetCity.toLowerCase() !== cityName.toLowerCase()) return null
  return <BannerCard ad={ad} className="aspect-[16/4]" />
}
