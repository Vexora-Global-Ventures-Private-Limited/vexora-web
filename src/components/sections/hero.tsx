"use client"

import { useCallback, useEffect, useId, useState, type CSSProperties } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Search, MapPin, Building, Wallet, ChevronDown, ArrowRight, ArrowDown } from "lucide-react"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import { LinesReveal, MaskReveal } from "@/components/motion/text-reveal"
import { EASE_OUT } from "@/lib/motion-tokens"
import { HOMEPAGE_IMAGES } from "@/lib/homepage-images"
import { scrollToSection } from "@/lib/scroll-to-section"
import { BUDGET_BUCKETS } from "@/lib/vxp-data"
import { ROUTES } from "@/lib/routes"
import { propertyTypeLabel } from "@/lib/api-mappers"
import { useGetPublicConfigQuery } from "@/store/api/searchApi"
import {
  SuggestionList,
  resolveSearchText,
  useCityNames,
  useSearchSuggestions,
  useSuggestionKeys,
} from "@/components/property/search-suggest"
import { cn } from "@/lib/utils"

const ANY_TYPE = "Any residence"
const budgets = ["Any budget", ...BUDGET_BUCKETS.map((b) => b.label)]

// MOCK / SAMPLE DATA — illustrative figures, not live platform numbers.
// Labelled "Sample figures" where they render (see below). Replace with real
// numbers (or remove) before launch — vexora-web UNRESOLVED #46.
const heroStats = [
  { to: 184000, suffix: "+", label: "Verified residences" },
  { to: 12400, suffix: "+", label: "RERA advisors" },
  { to: 25, suffix: "", label: "Indian cities" },
  { to: 92000, prefix: "₹ ", suffix: " Cr", label: "Volume closed" },
]

// SAMPLE PHOTOS — stock imagery for the hero, not listings on VXP. They used
// to carry real developer names and prices (Lodha / Runwal / Hiranandani) for
// projects that aren't on the platform; now they're labelled as samples.
const HERO_SLIDES = [
  {
    image: HOMEPAGE_IMAGES.heroModernEstate,
    title: "Sample photo — modern estate",
    subtitle: "Illustrative image, not a listing on VXP",
    tag: "Sample photo",
  },
  {
    image: HOMEPAGE_IMAGES.heroTwilightVilla,
    title: "Sample photo — twilight villa",
    subtitle: "Illustrative image, not a listing on VXP",
    tag: "Sample photo",
  },
  {
    image: HOMEPAGE_IMAGES.heroPenthouse,
    title: "Sample photo — penthouse",
    subtitle: "Illustrative image, not a listing on VXP",
    tag: "Sample photo",
  },
] as const

const SLIDE_MS = 5000
const CROSSFADE_S = 1.4

function HeroImageCarousel({
  active,
  reduce,
}: {
  active: number
  reduce: boolean | null
}) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {HERO_SLIDES.map((s, i) => {
        const isActive = i === active
        return (
          <motion.div
            key={s.image}
            className="absolute inset-0 will-change-[opacity,transform]"
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 1.07,
            }}
            transition={{
              opacity: {
                duration: reduce ? 0.01 : CROSSFADE_S,
                ease: EASE_OUT,
              },
              scale: isActive
                ? {
                    duration: reduce ? 0.01 : SLIDE_MS / 1000,
                    ease: [0.22, 1, 0.36, 1],
                  }
                : { duration: 0.01 },
            }}
            style={{ zIndex: isActive ? 2 : 1, pointerEvents: "none" }}
          >
            <Image
              src={s.image}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        )
      })}
      <div className="hero-cinema-vignette absolute inset-0 z-[3]" />
    </div>
  )
}

export function Hero() {
  const router = useRouter()
  const [location, setLocation] = useState("")
  const [locationFocused, setLocationFocused] = useState(false)
  const [ptype, setPtype] = useState(ANY_TYPE)
  const [budget, setBudget] = useState(budgets[0])
  const [slide, setSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()
  // Property types are admin-configured — never offer one search can't match.
  const { data: config } = useGetPublicConfigQuery()
  const propertyTypes = [ANY_TYPE, ...(config?.allowedPropertyTypes ?? [])]
  const cities = useCityNames()
  const suggestions = useSearchSuggestions(location)

  const goTo = useCallback((index: number) => {
    setSlide((index + HERO_SLIDES.length) % HERO_SLIDES.length)
  }, [])

  const nextSlide = useCallback(() => {
    setSlide((s) => (s + 1) % HERO_SLIDES.length)
  }, [])

  // Stable interval — do not depend on `slide` or it resets every tick
  useEffect(() => {
    if (paused) return
    const id = window.setInterval(nextSlide, SLIDE_MS)
    return () => window.clearInterval(id)
  }, [paused, nextSlide])

  const handleSearch = (text = location) => {
    // Exact city match (against the Location Master) → the `city` facet;
    // otherwise free-text `q`, so a locality or title still narrows results.
    const { city, q } = resolveSearchText(text, cities)
    const bucket = BUDGET_BUCKETS.find((b) => b.label === budget)
    router.push(
      ROUTES.propertiesSearch({
        city,
        q,
        propertyType: ptype !== ANY_TYPE ? ptype : undefined,
        priceMin: bucket && bucket.min > 0 ? String(bucket.min) : undefined,
        priceMax: bucket && bucket.max !== Infinity ? String(bucket.max) : undefined,
      }),
    )
  }

  const listId = useId()
  const pickSuggestion = (s: string) => {
    setLocation(s)
    handleSearch(s)
  }
  const keys = useSuggestionKeys({ suggestions, onPick: pickSuggestion, onSubmit: () => handleSearch() })
  const showList = locationFocused && keys.open && suggestions.length > 0

  /** Scroll to a homepage section, or go to its full page when the section isn't rendered (e.g. no featured developers yet). */
  const goToSection = (id: string, fallbackHref: string) => {
    if (document.getElementById(id)) scrollToSection(id)
    else router.push(fallbackHref)
  }

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0.01 : 0.8, delay: reduce ? 0 : delay, ease: EASE_OUT },
  })

  return (
    <section className="hero-cinema relative flex min-h-[100svh] flex-col overflow-hidden">
      <HeroImageCarousel active={slide} reduce={reduce} />

      {/* Slide progress — hairline bars (pause auto-advance only while hovering controls) */}
      <div
        className="absolute left-6 top-28 z-20 flex items-center gap-2 sm:left-10 lg:left-16"
        role="tablist"
        aria-label="Hero residences"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false)
        }}
      >
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === slide}
            aria-label={`${s.title} — ${s.subtitle}`}
            onClick={() => goTo(i)}
            className="group flex flex-col gap-1.5 py-2"
          >
            <span
              className={cn(
                "relative block h-px overflow-hidden bg-white/25",
                i === slide ? "w-10" : "w-6",
              )}
            >
              {i === slide ? (
                <span
                  key={slide}
                  className={cn(
                    "hero-slide-progress absolute inset-y-0 left-0 w-full bg-brand-primary",
                    paused && "hero-slide-progress--paused",
                  )}
                  style={{ "--hero-slide-ms": `${SLIDE_MS}ms` } as CSSProperties}
                />
              ) : (
                <span className="block h-full w-full bg-white/30 transition-colors duration-300 group-hover:bg-white/55" />
              )}
            </span>
            <span className="sr-only">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {/* Extra pt- accounts for the header's second (full nav) row added alongside the logo/search/CTA row. */}
      <div className="relative z-10 mx-auto flex w-full max-w-[90rem] flex-1 flex-col justify-between px-6 pb-10 pt-44 sm:px-10 lg:px-16 lg:pt-48">
        <div className="max-w-4xl">
          <MaskReveal immediate delay={0.15}>
            <p className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-primary-light">
              <span className="inline-block h-px w-14 bg-brand-primary/70" aria-hidden />
              Private Indian real estate · Est. 2026
            </p>
          </MaskReveal>

          <LinesReveal
            as="h1"
            immediate
            delay={0.3}
            className="text-display-cinema mt-8 text-paper-ivory"
            lines={[
              <span key="1">Where India&apos;s</span>,
              <span key="2" className="italic text-gold-gradient">finest homes</span>,
              <span key="3">change hands.</span>,
            ]}
          />

          <motion.p
            {...fade(0.85)}
            className="mt-9 max-w-md text-base leading-relaxed text-white/64 sm:text-lg"
          >
            Curated residences across Mumbai, Pune, Bengaluru and Thane —
            field-verified, RERA-documented, presented with discretion.
          </motion.p>

          <motion.div {...fade(1.0)} className="mt-10 flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => goToSection("buy", ROUTES.properties)}
              className="btn-piano rounded-none px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.14em]"
            >
              View the collection
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => goToSection("developers", ROUTES.projects)}
              className="link-editorial text-[13px] font-semibold uppercase tracking-[0.14em] text-white/80 transition-colors hover:text-white"
            >
              Meet the developers
            </button>
          </motion.div>
        </div>

        {/* Search console */}
        <motion.div {...fade(1.05)} className="mt-6 lg:mt-10">
          <div className="border border-white/14 bg-black/38 backdrop-blur-xl">
            <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:divide-x lg:divide-y-0">
              <label className="group relative flex items-center gap-3.5 px-6 py-5">
                <MapPin className="h-4 w-4 shrink-0 text-brand-primary-light/80" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                    Location
                  </span>
                  <input
                    type="text"
                    value={location}
                    placeholder="Mumbai, Thane, Bengaluru…"
                    onChange={(e) => setLocation(e.target.value)}
                    onFocus={() => setLocationFocused(true)}
                    onBlur={() => setLocationFocused(false)}
                    onKeyDown={keys.onKeyDown}
                    className="mt-1 w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/32"
                    aria-label="Search location or keyword"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-activedescendant={showList && keys.active >= 0 ? `${listId}-${keys.active}` : undefined}
                  />
                </div>
                {showList && (
                  <SuggestionList id={listId} suggestions={suggestions} active={keys.active} onPick={pickSuggestion} />
                )}
              </label>

              <div className="flex items-center gap-3.5 px-6 py-5">
                <Building className="h-4 w-4 shrink-0 text-brand-primary-light/80" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                    Residence
                  </span>
                  <div className="relative mt-1">
                    <select
                      value={ptype}
                      onChange={(e) => setPtype(e.target.value)}
                      className="w-full appearance-none bg-transparent text-sm font-medium text-white outline-none [&>option]:text-brand-secondary"
                      aria-label="Property type"
                    >
                      {propertyTypes.map((t) => (
                        <option key={t} value={t}>{t === ANY_TYPE ? t : propertyTypeLabel(t)}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 px-6 py-5">
                <Wallet className="h-4 w-4 shrink-0 text-brand-primary-light/80" strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                    Budget
                  </span>
                  <div className="relative mt-1">
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full appearance-none bg-transparent text-sm font-medium text-white outline-none [&>option]:text-brand-secondary"
                      aria-label="Budget range"
                    >
                      {budgets.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSearch()}
                className="group flex items-center justify-center gap-3 bg-brand-primary px-10 py-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-ink-black transition-colors duration-300 hover:bg-brand-primary-light"
              >
                <Search className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={2.25} />
                Search
              </button>
            </div>
          </div>
        </motion.div>

        {/* Hairline stats */}
        <motion.div {...fade(1.25)} className="mt-8">
          <dl className="grid grid-cols-2 gap-px lg:grid-cols-4">
            {heroStats.map((s, i) => (
              <div
                key={s.label}
                className={
                  "border-t border-white/14 py-5 pr-6 " +
                  (i !== 0 ? "lg:border-l lg:border-white/10 lg:pl-6" : "")
                }
              >
                <dd className="font-serif text-2xl font-semibold text-white sm:text-3xl">
                  <AnimatedCounter to={s.to} prefix={s.prefix} suffix={s.suffix} duration={1.4} />
                </dd>
                <dt className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/44">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
            Sample figures · photos are illustrative
          </p>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.button
        type="button"
        onClick={() => goToSection("buy", ROUTES.properties)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 1.7, duration: 0.8 }}
        className="absolute bottom-8 right-8 z-10 hidden h-12 w-12 items-center justify-center rounded-full border border-white/22 text-white/70 transition-colors hover:border-brand-primary hover:text-brand-primary md:flex"
        aria-label="Scroll to residences"
      >
        <ArrowDown className="scroll-hint-dot h-4 w-4" />
      </motion.button>
    </section>
  )
}
