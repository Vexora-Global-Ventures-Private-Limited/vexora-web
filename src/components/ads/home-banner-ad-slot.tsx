"use client"

import { ArrowUpRight, Megaphone } from "lucide-react"
import { HOMEPAGE_IMAGES } from "@/lib/homepage-images"
import { adClickHref, useGetHomeBannerQuery, type Ad, type AdCreative } from "@/store/api/adsApi"

/** The served banner may carry its creatives; the image is a hosted URL while Cloudinary is in demo mode. */
export function bannerImage(ad: Ad): string {
  const creative = (ad.creatives as AdCreative[] | undefined)?.[0]
  const src = creative?.cloudinaryPublicId
  return src && /^https?:\/\//.test(src) ? src : HOMEPAGE_IMAGES.heroLaunch
}

/**
 * "Home Banner" ad slot — GET /ad-serving/home-banner (public; picks a
 * city-personalized banner when logged in). Renders nothing when there's no
 * active campaign (`ad: null` is the normal case), never a fake sponsor.
 * Every render here counts as a real impression server-side; the
 * click-through is a 302 from the API, so it's a plain link.
 */
export function HomeBannerAdSlot() {
  const { data: ad } = useGetHomeBannerQuery()
  if (!ad) return null
  return <BannerCard ad={ad} />
}

export function BannerCard({ ad }: { ad: Ad }) {
  return (
    <section aria-label="Sponsored" className="relative overflow-hidden border-y border-brand-primary/25">
      <a
        href={adClickHref(ad._id)}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="group relative mx-auto flex w-full max-w-[90rem] items-center justify-between gap-4 px-6 py-4 text-left sm:px-10 lg:px-16"
      >
        <img src={bannerImage(ad)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary via-brand-secondary/85 to-brand-secondary/40" />
        <div className="relative flex min-w-0 items-center gap-4">
          <span className="flex shrink-0 items-center gap-1.5 bg-brand-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-black">
            <Megaphone className="h-3 w-3" /> Sponsored
          </span>
          {ad.targetCity && <div className="truncate text-xs text-white/60">{ad.targetCity}</div>}
        </div>
        <span className="relative flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-primary group-hover:text-brand-primary-light">
          Explore <ArrowUpRight className="h-4 w-4" />
        </span>
      </a>
    </section>
  )
}
