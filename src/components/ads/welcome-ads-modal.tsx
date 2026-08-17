"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Building2,
  Crown,
  MapPin,
  Megaphone,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { myAds, type Ad } from "@/lib/dashboard-data"
import { adTypes, properties } from "@/lib/vxp-data"
import { projects } from "@/lib/projects-data"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"

const AD_TYPE_ICON: Record<string, typeof Megaphone> = {
  banner: Megaphone,
  "map-pin": MapPin,
  building: Building2,
  play: PlayCircle,
  crown: Crown,
}

/** Package tier → the "richness" badge shown on each slide (Starter/Professional/Enterprise, exactly as sold in the promote wizard). */
function richnessFor(pkg: string) {
  const tier = pkg.split("·")[0].trim()
  if (tier === "Enterprise") {
    return { label: "Elite Placement", icon: Crown, badgeClass: "bg-gradient-to-r from-brand-primary to-brand-primary-light text-ink-black" }
  }
  if (tier === "Professional") {
    return { label: "Premium Placement", icon: Sparkles, badgeClass: "bg-brand-primary/90 text-ink-black" }
  }
  return { label: "Standard Placement", icon: ShieldCheck, badgeClass: "border border-white/20 bg-black/45 text-white" }
}

/** Same real-destination resolution every other ad slot uses — never a fake/dead link. */
function resolveDestination(ad: Ad): string {
  const headlinePrefix = ad.headline.split(" — ")[0].trim()

  if (ad.type === "Featured Developer") {
    const developerProject = projects.find((p) => p.developer === headlinePrefix)
    return developerProject ? ROUTES.projectDetail(developerProject.id) : ROUTES.projects
  }

  const matchedProject = projects.find((p) => p.name.startsWith(headlinePrefix))
  if (matchedProject) return ROUTES.projectDetail(matchedProject.id)

  const matchedProperty = properties.find((p) => p.title.startsWith(headlinePrefix))
  if (matchedProperty) return ROUTES.propertyDetail(matchedProperty.id)

  if (ad.type === "City Advertisement") {
    const city = ad.placement.replace(" search results", "").trim()
    return `${ROUTES.properties}?city=${encodeURIComponent(city)}`
  }

  return ROUTES.properties
}

/**
 * First-screen welcome popup — a large, closable carousel across the
 * actually-Live ads in `myAds`, each badged by its real package tier
 * (Starter/Professional/Enterprise → Standard/Premium/Elite). Same honesty
 * rule as every other ad slot in this app: only shows real currently-Live
 * campaigns, and renders nothing at all when there are none.
 *
 * Shown to every visitor — signed in or not — once per page load. There's
 * deliberately no sessionStorage/localStorage flag: closing it only hides it
 * for the current page instance, and it opens again on the next reload (or
 * the next time this component remounts, e.g. navigating back to "/").
 *
 * Mobile (<sm): a stacked card — image box, then a solid caption panel
 * below it, then dots, then a footer bar. Each piece is its own opaque
 * block in normal document flow.
 *
 * Laptop/desktop (sm+): the ad photo is the single full-bleed background
 * of the whole card. Everything else — header, badges, caption, dots,
 * footer — floats on top of it as a translucent overlay, all lit by one
 * shared bottom-heavy gradient wash baked into the image layer (see the
 * comment above that gradient below) rather than each piece carrying its
 * own separate background.
 */
export function WelcomeAdsModal() {
  const router = useRouter()
  const user = useNav((s) => s.user)
  const [open, setOpen] = useState(false)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  const liveAds = myAds.filter((a) => a.status === "Live")

  useEffect(() => {
    if (liveAds.length === 0) return
    const timer = setTimeout(() => setOpen(true), 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  useEffect(() => {
    if (!open || !api || liveAds.length < 2) return
    const interval = setInterval(() => api.scrollNext(), 5000)
    return () => clearInterval(interval)
  }, [open, api, liveAds.length])

  if (liveAds.length === 0) return null

  const goToAd = (ad: Ad) => {
    setOpen(false)
    router.push(resolveDestination(ad))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/75 backdrop-blur-sm"
        className="flex max-h-[90svh] w-[94vw] max-w-lg flex-col gap-0 overflow-y-auto border border-brand-primary/40 bg-brand-secondary p-0 shadow-2xl shadow-brand-primary/20 sm:max-h-[92svh] sm:w-[95vw] sm:max-w-3xl sm:overflow-hidden lg:max-w-5xl"
      >
        <DialogTitle className="sr-only">Featured on VXP</DialogTitle>
        <DialogDescription className="sr-only">
          A curated look at the properties and developers currently featured across VXP&apos;s premium placements.
        </DialogDescription>

        {/* Gold spine — the same signature accent stripe used on premium
            surfaces elsewhere in the app, so this reads as VXP's own chrome
            rather than a generic dialog. */}
        <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-brand-primary-dark via-brand-primary to-brand-primary-light sm:absolute sm:inset-x-0 sm:top-0 sm:z-30" />

        {/* Escape-to-close and focus trapping come from Radix Dialog
            itself — no extra wiring needed here. */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-6 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition hover:border-brand-primary/50 hover:bg-black/70 hover:text-brand-primary-light active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary sm:right-4 sm:top-7"
        >
          <X className="h-5 w-5" />
        </button>

        {/* <div className="flex items-center gap-2 border-b border-white/10 bg-black/20 px-5 py-3.5 pr-16 sm:absolute sm:inset-x-0 sm:top-[3px] sm:z-20 sm:border-none sm:bg-transparent sm:px-8 sm:py-4">
          <Megaphone className="h-4 w-4 shrink-0 text-brand-primary" />
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Featured on VXP</span>
        </div> */}

        <Carousel setApi={setApi} opts={{ loop: true }}>
          <CarouselContent className="ml-0">
            {liveAds.map((ad, index) => {
              const typeInfo = adTypes.find((t) => t.name === ad.type)
              const TypeIcon = AD_TYPE_ICON[typeInfo?.icon ?? "banner"]
              const richness = richnessFor(ad.package)
              const RichnessIcon = richness.icon

              return (
                <CarouselItem key={ad.id} className="pl-0">
                  <button
                    onClick={() => goToAd(ad)}
                    className="group relative flex w-full flex-col overflow-hidden text-left active:opacity-90 sm:active:opacity-100"
                  >
                    {/* The photo is the whole card — text lives directly on
                        it at every breakpoint, never on a solid panel.
                        Height is capped by both a rem value (tall screens)
                        and an svh value (short laptop windows), whichever
                        is smaller, so a laptop with limited vertical space
                        shrinks the card instead of forcing it to scroll. */}
                    <div className="relative h-[min(28rem,58svh)] w-full shrink-0 overflow-hidden sm:h-[min(36rem,76svh)] lg:h-[min(44rem,80svh)]">
                      <img
                        src={ad.bannerImage}
                        alt={ad.headline}
                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />

                      {/* One shared, bottom-heavy gradient wash — mild at the
                          top (just enough for the header/badges to stay
                          legible), essentially clear through the middle (so
                          the photo itself isn't flattened), only moderately
                          darker at the bottom — enough for the caption text
                          (helped by its own drop-shadow) to read clearly
                          without ever looking like a solid black block. */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0)_26%,rgba(0,0,0,0.05)_46%,rgba(0,0,0,0.62)_100%)]" />

                      <div className="absolute inset-x-0 top-0 p-4 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5 border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-md sm:px-2.5 sm:text-[10px]">
                            <TypeIcon className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" /> {ad.type}
                          </span>
                          <span className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide backdrop-blur-md sm:px-2.5 sm:text-[10px] ${richness.badgeClass}`}>
                            <RichnessIcon className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" /> {richness.label}
                          </span>
                        </div>
                      </div>

                      {/* Caption — floats directly on the photo, anchored to
                          its bottom edge. Bottom padding on sm+ clears the
                          dots/footer overlay that floats on top of this same
                          image there; on mobile, dots/footer sit in normal
                          flow below the image instead, so less padding is
                          needed. Re-keying on the active index replays the
                          fade/rise-in animation every time this slide
                          becomes current, not just on first mount. */}
                      <div
                        key={current === index ? `${ad.id}-active` : ad.id}
                        className="animate-ad-caption-in absolute inset-x-0 bottom-0 px-5 pb-8 pt-7 sm:px-8 sm:pb-28 sm:pt-6 lg:pb-32"
                      >
                        <span className="mb-3.5 inline-block h-px w-11 bg-brand-primary/70 sm:mb-3 sm:w-9" />
                        <div className="font-serif text-2xl font-bold leading-tight text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.95)] sm:text-2xl lg:text-3xl">{ad.headline}</div>
                        <div className="mt-2 text-sm text-white/75 [text-shadow:0_1px_8px_rgba(0,0,0,0.95)] sm:mt-1.5 sm:text-sm">{ad.placement}</div>
                        {/* A real button, not an underlined link — this is
                            the primary action for the slide, so it should
                            carry more weight than "Advertise With VXP" in
                            the footer. Still just a styled <span>, not a
                            <button>: the whole slide is already a <button>
                            (onClick={() => goToAd(ad)}), and nesting a real
                            button inside one is invalid HTML. */}
                        <span className="btn-gold relative mt-6 inline-flex items-center gap-2 overflow-hidden px-5 py-2.5 text-sm font-bold uppercase tracking-wide sm:mt-5 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-xs">
                          View Listing <ArrowUpRight className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                </CarouselItem>
              )
            })}
          </CarouselContent>

          {liveAds.length > 1 && (
            <>
              {/* Hidden below sm: on a narrow phone the headline can wrap to
                  3 lines and grow tall enough to reach the vertical-center
                  arrows, so mobile relies on swipe + the dots below instead. */}
              <CarouselPrevious
                aria-label="Previous slide"
                className="left-2 hidden h-11 w-11 border-white/20 bg-black/50 text-white opacity-70 backdrop-blur-md transition-all hover:scale-110 hover:border-brand-primary/50 hover:bg-black/70 hover:text-brand-primary-light hover:opacity-100 focus-visible:opacity-100 active:scale-95 sm:flex sm:left-4"
              />
              <CarouselNext
                aria-label="Next slide"
                className="right-2 hidden h-11 w-11 border-white/20 bg-black/50 text-white opacity-70 backdrop-blur-md transition-all hover:scale-110 hover:border-brand-primary/50 hover:bg-black/70 hover:text-brand-primary-light hover:opacity-100 focus-visible:opacity-100 active:scale-95 sm:flex sm:right-4"
              />
            </>
          )}
        </Carousel>

        {liveAds.length > 1 && (
          <div className="flex items-center justify-center gap-1 border-t border-white/10 bg-black/20 py-3 sm:absolute sm:inset-x-0 sm:bottom-14 sm:z-20 sm:gap-0.5 sm:border-none sm:bg-transparent sm:py-2.5">
            {liveAds.map((ad, i) => (
              <button
                key={ad.id}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
                onClick={() => api?.scrollTo(i)}
                className="group/dot grid h-11 w-9 shrink-0 place-items-center sm:w-8"
              >
                <span
                  className={`rounded-full transition-all ${
                    i === current
                      ? "h-2 w-8 bg-brand-primary shadow-[0_0_10px_-1px_var(--brand-primary)] sm:h-1.5 sm:w-7"
                      : "h-2 w-2 bg-white/25 group-hover/dot:bg-white/45 sm:h-1.5 sm:w-1.5"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-white/10 bg-gradient-to-r from-black/25 via-black/10 to-black/25 px-5 py-4 text-center sm:absolute sm:inset-x-0 sm:bottom-0 sm:z-20 sm:justify-between sm:gap-y-1.5 sm:border-none sm:bg-transparent sm:px-8 sm:pb-5 sm:pt-2 sm:text-left">
          <p className="text-sm text-white/50 sm:text-xs">Put your property in front of India&apos;s most discerning buyers.</p>
          <button
            onClick={() => {
              setOpen(false)
              router.push(user ? ROUTES.promote : ROUTES.loginWithReturn(ROUTES.promote))
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 border border-white/25 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-brand-primary-light backdrop-blur-sm transition-colors hover:border-brand-primary/50 hover:bg-white/5 hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-xs"
          >
            Advertise With VXP <ArrowUpRight className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
