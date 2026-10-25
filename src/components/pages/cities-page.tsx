"use client"

import Image from "next/image"
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { popularCities } from "@/lib/vxp-data"
import { formatStartingPrice, useCityStats } from "@/components/property/use-city-stats"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { UserNavMenu } from "@/components/site/user-nav-menu"
import { Reveal, StaggerGroup, staggerItem } from "@/components/motion/reveal"
import { motion } from "framer-motion"

export function CitiesPage() {
  const router = useRouter()
  const user = useNav((s) => s.user)

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(ROUTES.home)}
              className="grid h-10 w-10 place-items-center border border-brand-border-light text-brand-secondary hover:bg-brand-surface"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="grid h-10 w-10 place-items-center bg-gradient-to-br from-brand-primary via-brand-primary to-gold-700 shadow-md">
              <span className="font-serif text-lg font-bold text-brand-secondary">V</span>
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-brand-secondary">Explore by City</h1>
              <p className="text-xs text-brand-secondary/55">{popularCities.length} cities across India</p>
            </div>
          </div>
          {/* Visible on every screen size — this header is the page's only way in or out of a session. */}
          {user ? (
            <UserNavMenu user={user} className="flex text-brand-secondary" />
          ) : (
            <button
              onClick={() => router.push(ROUTES.loginWithReturn(ROUTES.cities))}
              className="shrink-0 border border-brand-border-light px-4 py-2 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
            >
              Log in
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Reveal direction="up">
          <h2 className="font-serif text-3xl font-bold text-brand-secondary sm:text-4xl">
            India&apos;s most-coveted <span className="text-gold-gradient italic">addresses.</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-brand-secondary/65">
            Every city VXP covers today — pick one to see live listings, developer projects and real market entry points.
          </p>
        </Reveal>

        <StaggerGroup className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
          {popularCities.map((c) => {
            return (
              <motion.div key={c.slug} variants={staggerItem}>
                <button
                  onClick={() => router.push(ROUTES.cityDetail(c.slug))}
                  className="group relative block aspect-[4/5] w-full overflow-hidden bg-card text-left ring-1 ring-brand-border-light transition-shadow hover:shadow-2xl hover:shadow-brand-primary/15"
                >
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-black via-ink-black/45 to-transparent" />
                  <div className="absolute inset-x-0 top-5 px-6">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/40 bg-ink-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-primary backdrop-blur-sm">
                      <MapPin className="h-3 w-3" /> India
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="font-serif text-3xl font-bold text-white">{c.name}</h3>
                    <p className="mt-2 max-w-xs text-xs text-white/70">{c.blurb}</p>
                    <div className="mt-4 flex items-end justify-between">
                      <CityStats city={c.name} />
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all group-hover:bg-brand-primary group-hover:text-ink-black">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            )
          })}
        </StaggerGroup>
      </div>
    </div>
  )
}

/**
 * Live listing count + starting price (GET /search). No project count: there's
 * no projects-by-city API, and the old number came from mock data.
 */
function CityStats({ city }: { city: string }) {
  const { count, startingPriceCr, isLoading, isError } = useCityStats(city)
  return (
    <div>
      <div className="text-xs text-white/60">
        {isLoading ? "Loading listings…" : isError ? "\u00a0" : `${count} listing${count === 1 ? "" : "s"}`}
      </div>
      <div className="font-serif text-lg font-bold text-brand-primary">
        {isLoading
          ? "\u00a0"
          : isError
            ? "Explore listings"
            : count === 0
              ? "Coming soon"
              : startingPriceCr !== undefined
                ? formatStartingPrice(startingPriceCr)
                : "Explore listings"}
      </div>
    </div>
  )
}
