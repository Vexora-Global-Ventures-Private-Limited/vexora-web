"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, Megaphone, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useGetHomeBannerQuery } from "@/store/api/adsApi"
import { AdLink } from "@/components/ads/home-banner-ad-slot"

/**
 * First-screen welcome popup for the currently served home banner
 * (GET /ad-serving/home-banner — the only ad-serving endpoint that exists,
 * shared/cached with HomeBannerAdSlot so it isn't fetched twice). Renders
 * nothing when there's no active campaign — never a mock sponsor.
 *
 * Shown at most once per browser session (sessionStorage), not on every
 * homepage visit. Storage is optional — if it's blocked, it falls back to
 * once per page load.
 */
const SEEN_KEY = "vxp-welcome-ad-seen"

function alreadySeen(adId: string) {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === adId
  } catch {
    return false
  }
}

function markSeen(adId: string) {
  try {
    window.sessionStorage.setItem(SEEN_KEY, adId)
  } catch {
    // Storage blocked — fine.
  }
}
export function WelcomeAdsModal() {
  const { data: ad } = useGetHomeBannerQuery()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!ad?.imageUrl || alreadySeen(ad.id)) return
    const timer = setTimeout(() => {
      markSeen(ad.id)
      setOpen(true)
    }, 600)
    return () => clearTimeout(timer)
  }, [ad])

  if (!ad?.imageUrl) return null

  const art = (
    <>
      <img src={ad.imageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
      <img src={ad.imageUrl} alt="Sponsored banner" className="absolute inset-0 h-full w-full object-contain transition duration-700 group-hover:scale-[1.02]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0)_26%,rgba(0,0,0,0)_70%,rgba(0,0,0,0.5)_100%)]" />
      <div className="absolute inset-x-0 top-0 p-4 sm:p-6">
        <span className="inline-flex items-center gap-1.5 border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
          <Megaphone className="h-3.5 w-3.5" /> Sponsored{ad.targetCity ? ` · ${ad.targetCity}` : ""}
        </span>
      </div>
      {ad.targetUrl && (
        <div className="absolute inset-x-0 bottom-0 flex justify-end p-4 sm:p-6">
          <span className="flex items-center gap-1.5 bg-brand-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-black">
            Visit <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      )}
    </>
  )
  const frame = "group relative block h-[min(28rem,58svh)] w-full overflow-hidden bg-ink-black sm:h-[min(36rem,76svh)]"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/75 backdrop-blur-sm"
        className="flex w-[94vw] max-w-lg flex-col gap-0 overflow-hidden border border-brand-primary/40 bg-brand-secondary p-0 shadow-2xl shadow-brand-primary/20 sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">Featured on VXP</DialogTitle>
        <DialogDescription className="sr-only">A sponsored placement currently running on VXP.</DialogDescription>

        <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-brand-primary-dark via-brand-primary to-brand-primary-light" />

        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-6 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition hover:border-brand-primary/50 hover:bg-black/70 hover:text-brand-primary-light"
        >
          <X className="h-5 w-5" />
        </button>

        {ad.targetUrl ? (
          <AdLink ad={ad} className={frame} onNavigate={() => setOpen(false)}>
            {art}
          </AdLink>
        ) : (
          <div className={frame}>{art}</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
