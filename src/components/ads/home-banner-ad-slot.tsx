"use client"

import { useState, type ReactNode } from "react"
import { ArrowUpRight, Expand, Megaphone } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { recordAdClick, useGetHomeBannerQuery, type ServedAd } from "@/store/api/adsApi"
import { cn } from "@/lib/utils"

/**
 * "Home Banner" ad slot — GET /ad-serving/home-banner (public; picks a
 * banner for the viewer's own profile city, or a nationwide one). Renders
 * nothing when there's no active campaign (`ad: null` is the normal case) or
 * the ad has no image — never a fake sponsor or a stand-in photo. Serving
 * counts the impression server-side.
 */
export function HomeBannerAdSlot() {
  const { data: ad } = useGetHomeBannerQuery()
  if (!ad?.imageUrl) return null
  return (
    <section aria-label="Sponsored" className="bg-brand-secondary px-4 py-6 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[90rem]">
        <BannerCard ad={ad} />
      </div>
    </section>
  )
}

/**
 * The advertiser's banner, shown whole (object-contain on a blurred copy of
 * itself, so any aspect ratio looks intentional), with a "Sponsored" label.
 * Clickable only when the ad has a landing page: the click is counted with
 * POST /ad-serving/{id}/click, then the page opens in a new tab.
 */
export function BannerCard({ ad, className, onNavigate }: { ad: ServedAd; className?: string; onNavigate?: () => void }) {
  const body = (
    <>
      {/* Blurred fill behind the creative so letterboxing never looks empty. */}
      <img src={ad.imageUrl!} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
      <img
        src={ad.imageUrl!}
        alt="Sponsored banner"
        className="relative z-10 mx-auto h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.01]"
      />
      <span className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 bg-ink-black/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-primary backdrop-blur-sm">
        <Megaphone className="h-3 w-3" /> Sponsored{ad.targetCity ? ` · ${ad.targetCity}` : ""}
      </span>
      <span className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 bg-brand-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-black shadow-lg transition group-hover:bg-brand-primary-light">
        {ad.targetUrl ? (
          <>
            Visit <ArrowUpRight className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            View <Expand className="h-3.5 w-3.5" />
          </>
        )}
      </span>
    </>
  )
  const frame = cn(
    "group relative block aspect-[16/5] max-h-[22rem] min-h-[9rem] w-full overflow-hidden bg-ink-black ring-1 ring-brand-primary/30",
    className,
  )

  return ad.targetUrl ? (
    <AdLink ad={ad} className={frame} onNavigate={onNavigate}>
      {body}
    </AdLink>
  ) : (
    <BannerViewer ad={ad} className={frame}>
      {body}
    </BannerViewer>
  )
}

/**
 * Banners created before a link was required have no landing page — the
 * click opens the creative full size instead of doing nothing. (No click is
 * counted: the API only records clicks for ads with a target URL.)
 */
function BannerViewer({ ad, className, children }: { ad: ServedAd; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(className, "cursor-zoom-in text-left")} aria-label="View sponsored banner">
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl gap-0 overflow-hidden border-brand-primary/40 bg-ink-black p-0">
          <DialogTitle className="sr-only">Sponsored banner</DialogTitle>
          <DialogDescription className="sr-only">A sponsored placement currently running on VXP.</DialogDescription>
          <img src={ad.imageUrl!} alt="Sponsored banner" className="max-h-[80vh] w-full object-contain" />
          <div className="flex items-center gap-1.5 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary">
            <Megaphone className="h-3 w-3" /> Sponsored{ad.targetCity ? ` · ${ad.targetCity}` : ""}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** A link to the ad's landing page that records the click first. */
export function AdLink({ ad, className, children, onNavigate }: { ad: ServedAd; className?: string; children: ReactNode; onNavigate?: () => void }) {
  return (
    <a
      href={ad.targetUrl!}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={() => {
        recordAdClick(ad.id)
        onNavigate?.()
      }}
      className={className}
    >
      {children}
    </a>
  )
}
