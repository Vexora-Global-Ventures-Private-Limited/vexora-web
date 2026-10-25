"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, useEffect, useCallback } from "react"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import { ArrowUpRight, MapPin } from "lucide-react"
import { popularCities } from "@/lib/vxp-data"
import { formatStartingPrice, useCityStats } from "@/components/property/use-city-stats"
import { ROUTES } from "@/lib/routes"
import { Reveal, StaggerGroup, staggerItem } from "@/components/motion/reveal"

export function PopularCities() {
  const reduce = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [travel, setTravel] = useState(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  // Measure the actual horizontal travel distance = trackWidth − viewportWidth.
  // This is the only correct way to pin-and-scroll horizontally — percentage
  // transforms are relative to the element's own width and overshoot.
  const measure = useCallback(() => {
    if (!trackRef.current) return
    const trackWidth = trackRef.current.scrollWidth
    const viewportWidth = window.innerWidth
    setTravel(Math.max(0, trackWidth - viewportWidth))
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener("resize", measure)
    // Re-measure after images/fonts settle
    const t1 = setTimeout(measure, 400)
    const t2 = setTimeout(measure, 1200)
    return () => {
      window.removeEventListener("resize", measure)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [measure])

  // Translate the track from 0 → -travel pixels as the user scrolls.
  // Disabled on reduced-motion (cards stay in a static horizontal row).
  const x = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -travel])

  // Section height = (number of cards) × 80vh — gives enough scroll to
  // advance one card per ~80vh without being exhausting.
  const sectionHeight = `${(popularCities.length + 1) * 80}vh`

  return (
    <section
      id="agents"
      ref={sectionRef}
      className="relative bg-ink-black text-white"
    >
      {/* Desktop: pinned horizontal scroll */}
      <div className="hidden lg:block" style={{ height: sectionHeight }}>
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden pt-16 lg:pt-24">
          {/* Heading */}
          <div className="mx-auto mb-10 w-full shrink-0 max-w-[90rem] px-6 sm:px-10 lg:px-16">
            <Reveal direction="left">
              <div className="mb-4 flex items-center gap-4">
                <span className="h-px w-12 bg-brand-primary/60" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-primary-light">
                  The Atlas — scroll to travel
                </span>
              </div>
            </Reveal>
            <Reveal direction="up" delay={0.1}>
              <h2 className="text-display-grand mt-4 text-balance">
                India&apos;s most-coveted <span className="text-gold-gradient italic">addresses.</span>
              </h2>
            </Reveal>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center">
          {/* Horizontal track — measured pixel translation, no rotate */}
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="flex items-center gap-6 pl-[6vw] will-change-transform"
          >
            {popularCities.map((c, i) => (
              <HorizontalCityCard key={c.name} city={c} index={i} />
            ))}
            <TailCard index={popularCities.length} />
          </motion.div>

          {/* Progress bar */}
          <div className="mx-auto mt-8 w-full max-w-7xl px-6">
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className="font-serif text-sm font-bold text-brand-primary">01</span>
              <div className="relative h-px flex-1 bg-white/10">
                <motion.div
                  style={{ scaleX: scrollYProgress }}
                  className="absolute inset-y-0 left-0 w-full origin-left bg-gradient-to-r from-brand-primary to-gold-pale"
                />
              </div>
              <span className="font-serif text-sm font-bold text-brand-primary">
                {String(popularCities.length + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="mt-2 text-center text-[11px] text-white/35">
              Scroll to explore cities
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Mobile / tablet fallback */}
      <div className="lg:hidden">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <Reveal direction="left">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-brand-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-primary">
                Explore by location
              </span>
            </div>
          </Reveal>
          <Reveal direction="up" delay={0.1}>
            <h2 className="font-serif text-balance text-4xl font-bold leading-tight sm:text-5xl">
              India&apos;s most-coveted <span className="text-gold-gradient italic">addresses</span>
            </h2>
          </Reveal>

          <StaggerGroup className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2" stagger={0.05}>
            {popularCities.map((c) => (
                <motion.div key={c.name} variants={staggerItem}>
                  <Link
                    href={ROUTES.cityDetail(c.slug)}
                    className="group relative block aspect-[16/10] overflow-hidden ring-1 ring-white/10"
                  >
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-black via-ink-black/40 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-5">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="font-serif text-2xl font-bold text-white">{c.name}</h3>
                          <CityStatsLine city={c.name} countClass="mt-1 text-xs text-white/70" priceClass="mt-0.5 text-sm font-semibold text-brand-primary" />
                        </div>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all group-hover:bg-brand-primary group-hover:text-ink-black">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  )
}

function HorizontalCityCard({
  city,
  index,
}: {
  city: { slug: string; name: string; image: string; blurb: string }
  index: number
}) {
  const router = useRouter()
  const goToCity = () => router.push(ROUTES.cityDetail(city.slug))

  return (
    <div
      onClick={goToCity}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          goToCity()
        }
      }}
      aria-label={`Explore ${city.name}`}
      className="group relative h-[58vh] w-[42vw] shrink-0 cursor-pointer overflow-hidden ring-1 ring-white/10"
    >
      <Image
        src={city.image}
        alt={city.name}
        fill
        sizes="42vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-black via-ink-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/8 via-transparent to-transparent mix-blend-overlay" />

      {/* Card index */}
      <span className="absolute right-6 top-6 font-serif text-6xl font-bold text-white/10">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* India chip */}
      <div className="absolute inset-x-0 top-6 px-7">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/40 bg-ink-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-primary backdrop-blur-sm">
          <MapPin className="h-3 w-3" /> India
        </span>
      </div>

      {/* Bottom copy */}
      <div className="absolute inset-x-0 bottom-0 p-7">
        <h3 className="font-serif text-4xl font-bold text-white sm:text-5xl">{city.name}</h3>
        <p className="mt-2 max-w-md text-sm text-white/70">{city.blurb}</p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <CityStatsLine city={city.name} countClass="text-xs text-white/60" priceClass="font-serif text-lg font-bold text-brand-primary" />
          </div>
          {/* Visual affordance only — the whole card is the button (no nested interactive element). */}
          <span
            aria-hidden
            className="inline-flex items-center gap-2 border border-white/25 bg-black/25 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-colors duration-300 group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-ink-black"
          >
            Explore <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  )
}

function TailCard({ index }: { index: number }) {
  const router = useRouter()
  return (
    <div className="flex h-[58vh] w-[42vw] shrink-0 flex-col justify-center border border-brand-primary/30 bg-gradient-to-br from-brand-primary/12 via-transparent to-transparent p-10">
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary">
        Concierge · {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="mt-3 font-serif text-4xl font-semibold text-white sm:text-5xl">
        Not sure where to start?
      </h3>
      <p className="mt-4 max-w-md text-white/70">
        Search every live listing by city, budget and type — and save the ones
        that fit to your shortlist.
      </p>
      {/* There's no concierge service/API behind this yet, so it leads to the
          real search instead of a button that did nothing. */}
      <button
        type="button"
        onClick={() => router.push(ROUTES.properties)}
        className="mt-8 inline-flex w-fit items-center gap-2 bg-brand-primary px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-black transition-colors duration-300 hover:bg-brand-primary-light"
      >
        Browse all residences <ArrowUpRight className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Live count + starting price for a city card (GET /search). */
function CityStatsLine({ city, countClass, priceClass }: { city: string; countClass: string; priceClass: string }) {
  const { count, startingPriceCr, isLoading, isError } = useCityStats(city)
  if (isLoading) return <div className={countClass}>Loading listings…</div>
  if (isError) return <div className={priceClass}>Explore listings</div>
  return (
    <>
      <div className={countClass}>
        {count} listing{count === 1 ? "" : "s"}
      </div>
      <div className={priceClass}>
        {count === 0 ? "Coming soon" : startingPriceCr !== undefined ? formatStartingPrice(startingPriceCr) : "Explore listings"}
      </div>
    </>
  )
}
