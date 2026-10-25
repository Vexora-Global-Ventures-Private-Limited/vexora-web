"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowUpRight, ChevronRight, MapPin, Building2, Layers3,
  Crown, Star, Sparkles, TrendingUp, Heart,
} from "lucide-react"
import { popularCities, getCityBySlug, featuredDevelopers, type Property } from "@/lib/vxp-data"
import { formatCr, searchDocToProperty, toShortlistSnapshot } from "@/lib/api-mappers"
import { useCityStats, formatStartingPrice } from "@/components/property/use-city-stats"
import { useSearchQuery } from "@/store/api/searchApi"
import { Skeleton } from "@/components/ui/skeleton"
import { projectsInCity, type Project } from "@/lib/projects-data"
import { ROUTES } from "@/lib/routes"
import { useNav, canSell } from "@/lib/nav-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { UserNavMenu } from "@/components/site/user-nav-menu"
import { Reveal } from "@/components/motion/reveal"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import { Badge } from "@/components/ui/badge"
import { CityAdSlot } from "@/components/ads/city-ad-slot"
import { FeaturedDeveloperAdSlot, findFeaturedDeveloperName } from "@/components/ads/featured-developer-ad-slot"

// Sponsored → Featured → Organic, same bucket order used across the catalog pages.
const PRIORITY_ORDER: Record<string, number> = { Sponsored: 0, Featured: 1, Organic: 2 }
function byPriority<T extends { priority: string }>(a: T, b: T) {
  return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "Sponsored") {
    return (
      <Badge className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-ink-black hover:from-brand-primary hover:to-brand-primary-dark">
        <Crown className="mr-1 h-3 w-3" /> Sponsored
      </Badge>
    )
  }
  if (priority === "Featured") {
    return (
      <Badge className="bg-ink-black text-brand-primary hover:bg-ink-black">
        <Star className="mr-1 h-3 w-3 fill-brand-primary" /> Featured
      </Badge>
    )
  }
  return null
}

// Monogram badge letter for a developer — uses the curated initials from the
// homepage's developer index when available, otherwise derives one from the
// name itself (first letter of each of the first two words). A stand-in
// "logo" since no real developer trademarks are on file.
function developerInitials(name: string): string {
  const known = featuredDevelopers.find((d) => d.name === name)
  if (known) return known.initials
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

// Real developers active in a city, derived from actual listings/projects — not invented.
function topDevelopersIn(listings: Property[], projects: Project[]) {
  const counts = new Map<string, number>()
  for (const l of listings) if (l.developer) counts.set(l.developer, (counts.get(l.developer) ?? 0) + 1)
  for (const p of projects) counts.set(p.developer, (counts.get(p.developer) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
}

// Real localities, parsed from the "Locality, City" location strings already on every listing/project.
function popularAreasIn(listings: Property[], projects: Project[], cityName: string) {
  const counts = new Map<string, number>()
  const addLocality = (location: string) => {
    const locality = location.split(",")[0]?.trim()
    // A listing with no locality on file formats as just the city name — not an "area".
    if (locality && locality !== cityName) counts.set(locality, (counts.get(locality) ?? 0) + 1)
  }
  listings.forEach((l) => addLocality(l.location))
  projects.forEach((p) => addLocality(p.location))
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
}

// "2 BHK from ₹X Cr" style breakdown, grouped by real bedroom counts on actual listings.
function configBreakdownIn(listings: Property[]) {
  const byBeds = new Map<number, number[]>()
  for (const l of listings) {
    // Skip listings without a BHK or a price — they'd show as "0 BHK" / "from ₹ 0".
    if (!l.beds || !l.priceCr) continue
    const prices = byBeds.get(l.beds) ?? []
    prices.push(l.priceCr)
    byBeds.set(l.beds, prices)
  }
  return [...byBeds.entries()]
    .map(([beds, prices]) => ({ beds, minPriceCr: Number(Math.min(...prices).toFixed(2)), count: prices.length }))
    .sort((a, b) => a.beds - b.beds)
}

export function CityDetailPage({ slug }: { slug: string }) {
  const router = useRouter()
  const user = useNav((s) => s.user)
  const shortlistedIds = useShortlistStore((s) => s.shortlistedIds)
  const toggleShortlist = useShortlistStore((s) => s.toggleShortlist)
  const city = getCityBySlug(slug)
  // Listings come from live search (city is matched exactly server-side).
  const { data: search, isLoading: listingsLoading, isError: listingsError, refetch } = useSearchQuery(
    { city: city?.name, limit: 50 },
    { skip: !city },
  )
  const { count: listingCount, startingPriceCr } = useCityStats(city?.name ?? "")

  if (!city) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">City not found</h1>
        <p className="mt-2 text-sm text-brand-muted-foreground">
          We don&apos;t have a page for that city yet.
        </p>
        <button
          onClick={() => router.push(ROUTES.cities)}
          className="btn-gold relative mt-6 overflow-hidden px-5 py-2.5 text-sm font-bold"
        >
          <span className="relative z-10">Browse all cities</span>
        </button>
      </div>
    )
  }

  const listings = (search?.hits ?? []).map(searchDocToProperty).sort(byPriority)
  const projects = [...projectsInCity(city.name)].sort(byPriority)
  const otherCities = popularCities.filter((c) => c.slug !== city.slug)
  const newLaunches = projects.filter((p) => p.status === "New Launch")
  const developers = topDevelopersIn(listings, projects)
  const featuredDeveloperName = findFeaturedDeveloperName(developers.map(([name]) => name))
  const organicDevelopers = developers.filter(([name]) => name !== featuredDeveloperName)
  const areas = popularAreasIn(listings, projects, city.name)
  const configs = configBreakdownIn(listings)

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(ROUTES.cities)}
              className="grid h-10 w-10 place-items-center border border-brand-border-light text-brand-secondary hover:bg-brand-surface"
              aria-label="Back to cities"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="grid h-10 w-10 place-items-center bg-gradient-to-br from-brand-primary via-brand-primary to-gold-700 shadow-md">
              <span className="font-serif text-lg font-bold text-brand-secondary">V</span>
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-brand-secondary">{city.name}</h1>
              <p className="text-xs text-brand-secondary/55">Real estate in {city.name}</p>
            </div>
          </div>
          {user ? (
            <UserNavMenu user={user} className="text-brand-secondary" />
          ) : (
            <button
              onClick={() => router.push(ROUTES.loginWithReturn(ROUTES.cityDetail(city.slug)))}
              className="shrink-0 border border-brand-border-light px-4 py-2 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
            >
              Log in
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-brand-secondary/55">
          <button onClick={() => router.push(ROUTES.home)} className="hover:text-brand-secondary">Home</button>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <button onClick={() => router.push(ROUTES.cities)} className="hover:text-brand-secondary">Cities</button>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate text-brand-secondary">{city.name}</span>
        </div>

        {/* Hero */}
        <Reveal direction="up">
          <div className="relative aspect-[21/9] w-full overflow-hidden">
            <Image src={city.image} alt={city.name} fill sizes="100vw" priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-black via-ink-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/40 bg-ink-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-primary backdrop-blur-sm">
                <MapPin className="h-3 w-3" /> India
              </span>
              <h2 className="mt-3 font-serif text-4xl font-bold text-white sm:text-5xl">{city.name}</h2>
              <p className="mt-2 max-w-xl text-sm text-white/70">{city.blurb}</p>
            </div>
          </div>
        </Reveal>

        {/* Real stats — computed, never invented */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="bg-card p-5 ring-1 ring-brand-border-light">
            <div className="font-serif text-3xl font-bold text-brand-secondary">
              <AnimatedCounter to={listingCount} />
            </div>
            <div className="text-xs uppercase tracking-wide text-brand-secondary/55">Properties listed</div>
          </div>
          <div className="bg-card p-5 ring-1 ring-brand-border-light">
            <div className="font-serif text-3xl font-bold text-brand-secondary">
              <AnimatedCounter to={projects.length} />
            </div>
            <div className="text-xs uppercase tracking-wide text-brand-secondary/55">Developer projects</div>
          </div>
          <div className="col-span-2 bg-card p-5 ring-1 ring-brand-border-light sm:col-span-1">
            <div className="font-serif text-3xl font-bold text-brand-secondary">
              {startingPriceCr !== undefined ? formatStartingPrice(startingPriceCr).replace(/^from /, "") : "—"}
            </div>
            <div className="text-xs uppercase tracking-wide text-brand-secondary/55">Starting price</div>
          </div>
        </div>

        {/* City Advertisement ad slot — only renders when a Live ad targets this city, never a placeholder. */}
        <div className="mt-6">
          <CityAdSlot cityName={city.name} />
        </div>

        {/* New launches — only when this city actually has one, never an empty highlight strip. */}
        {newLaunches.length > 0 && (
          <div className="mt-10 border border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 via-transparent to-transparent p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-primary-dark" />
              <h3 className="font-serif text-xl font-bold text-brand-secondary">New launches in {city.name}</h3>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {newLaunches.map((p) => (
                <button
                  key={p.id}
                  onClick={() => router.push(ROUTES.projectDetail(p.id))}
                  className="group flex items-center gap-3 border border-brand-border-light bg-card p-3 text-left hover:border-brand-primary/40"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden">
                    <img src={p.coverImage} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-brand-secondary">{p.name}</div>
                    <div className="truncate text-xs text-brand-secondary/55">{p.developer} · {p.location}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-brand-secondary/40" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured properties */}
        <div className="mt-10">
          <div className="flex items-end justify-between">
            <h3 className="font-serif text-2xl font-bold text-brand-secondary">Properties in {city.name}</h3>
            {listingCount > 0 && (
              <button
                onClick={() => router.push(ROUTES.propertiesSearch({ city: city.name }))}
                className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
              >
                View all {listingCount} in {city.name} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {listingsLoading ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full" />
              ))}
            </div>
          ) : listingsError ? (
            <p className="mt-4 text-sm text-brand-secondary/55">
              Couldn&apos;t load listings for {city.name}.{" "}
              <button onClick={() => refetch()} className="font-bold text-brand-primary-dark hover:underline">
                Try again
              </button>
            </p>
          ) : listings.length === 0 ? (
            <p className="mt-4 text-sm text-brand-secondary/55">
              VXP is expanding to {city.name} — no properties listed here yet. Be the first to{" "}
              {/* Sellers go straight to the wizard; everyone else needs a plan first. */}
              <button
                onClick={() => router.push(canSell(user) ? ROUTES.newListing : ROUTES.membership)}
                className="font-bold text-brand-primary-dark hover:underline"
              >
                list one
              </button>.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.slice(0, 12).map((p) => (
                <div
                  key={p.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(ROUTES.propertyDetail(p.slug))}
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault()
                      router.push(ROUTES.propertyDetail(p.slug))
                    }
                  }}
                  aria-label={`${p.title}, ${p.price}`}
                  className="group cursor-pointer overflow-hidden bg-card text-left ring-1 ring-brand-border-light hover:ring-brand-primary/40"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {p.priority !== "Organic" && (
                      <div className="absolute left-3 top-3">
                        <PriorityBadge priority={p.priority} />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleShortlist(p.id, toShortlistSnapshot(p)) }}
                      aria-pressed={shortlistedIds.includes(p.id)}
                      aria-label={shortlistedIds.includes(p.id) ? "Remove from shortlist" : "Add to shortlist"}
                      className={
                        "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm hover:bg-card " +
                        (shortlistedIds.includes(p.id) ? "bg-card text-brand-primary-dark" : "bg-card/85 text-brand-secondary/70")
                      }
                    >
                      <Heart className={"h-4 w-4" + (shortlistedIds.includes(p.id) ? " fill-brand-primary-dark" : "")} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="truncate font-serif text-base font-bold text-brand-secondary">{p.title}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-brand-secondary/55">
                      <MapPin className="h-3 w-3 text-brand-primary-dark" /> {p.location}
                    </div>
                    <div className="mt-2 font-serif text-lg font-bold text-brand-secondary">{p.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configuration breakdown — real min prices per BHK size, derived from actual listings. */}
        {configs.length > 0 && (
          <div className="mt-10">
            <h3 className="font-serif text-2xl font-bold text-brand-secondary">Configurations available in {city.name}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {configs.map((c) => (
                <div key={c.beds} className="bg-card p-4 ring-1 ring-brand-border-light">
                  <div className="font-serif text-lg font-bold text-brand-secondary">{c.beds} BHK</div>
                  <div className="mt-1 text-xs text-brand-secondary/55">{c.count} listing{c.count === 1 ? "" : "s"}</div>
                  <div className="mt-2 text-sm font-bold text-brand-primary-dark">from {formatCr(c.minPriceCr)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Developer projects */}
        <div className="mt-10">
          <div className="flex items-end justify-between">
            <h3 className="font-serif text-2xl font-bold text-brand-secondary">Developer projects in {city.name}</h3>
            {projects.length > 0 && (
              <button
                onClick={() => router.push(`${ROUTES.projects}?city=${encodeURIComponent(city.name)}`)}
                className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
              >
                View all {projects.length} in {city.name} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {projects.length === 0 ? (
            <p className="mt-4 text-sm text-brand-secondary/55">No developer projects in {city.name} yet.</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 12).map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(ROUTES.projectDetail(p.id))}
                  onKeyDown={(e) => e.key === "Enter" && router.push(ROUTES.projectDetail(p.id))}
                  className="group cursor-pointer overflow-hidden bg-card text-left ring-1 ring-brand-border-light hover:ring-brand-primary/40"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={p.coverImage} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {p.priority !== "Organic" && (
                      <div className="absolute left-3 top-3">
                        <PriorityBadge priority={p.priority} />
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleShortlist(p.id) }}
                      aria-pressed={shortlistedIds.includes(p.id)}
                      aria-label={shortlistedIds.includes(p.id) ? "Remove from shortlist" : "Add to shortlist"}
                      className={
                        "absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm hover:bg-card " +
                        (shortlistedIds.includes(p.id) ? "bg-card text-brand-primary-dark" : "bg-card/85 text-brand-secondary/70")
                      }
                    >
                      <Heart className={"h-4 w-4" + (shortlistedIds.includes(p.id) ? " fill-brand-primary-dark" : "")} />
                    </button>
                  </div>
                  <div className="p-4">
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-primary-dark">
                      <Layers3 className="h-3 w-3" /> {p.developer}
                    </span>
                    <div className="mt-1 truncate font-serif text-base font-bold text-brand-secondary">{p.name}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-brand-secondary/55">
                      <Building2 className="h-3 w-3 text-brand-primary-dark" /> {p.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top developers — real names/counts derived from actual listings + projects here. */}
        {developers.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-primary-dark" />
              <h3 className="font-serif text-2xl font-bold text-brand-secondary">Top developers in {city.name}</h3>
            </div>
            <div className="mt-4">
              <FeaturedDeveloperAdSlot developerNames={developers.map(([name]) => name)} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {organicDevelopers.map(([name, count]) => (
                <button
                  key={name}
                  onClick={() => router.push(`${ROUTES.projects}?city=${encodeURIComponent(city.name)}`)}
                  className="flex items-center gap-3 border border-brand-border-light bg-card py-2 pl-2 pr-4 hover:border-brand-primary/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-brand-secondary font-serif text-sm font-bold text-paper-ivory">
                    {developerInitials(name)}
                  </span>
                  <Building2 className="h-3.5 w-3.5 text-brand-primary-dark" />
                  <span className="text-sm font-bold text-brand-secondary">{name}</span>
                  <span className="text-xs text-brand-secondary/50">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Popular areas — real localities parsed from actual "Locality, City" location strings. */}
        {areas.length > 0 && (
          <div className="mt-10">
            <h3 className="font-serif text-2xl font-bold text-brand-secondary">Popular areas in {city.name}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {areas.map(([area, count]) => (
                <button
                  key={area}
                  onClick={() => router.push(ROUTES.propertiesSearch({ city: city.name, q: area }))}
                  className="flex items-center gap-1.5 border border-brand-border-light bg-card px-4 py-2 text-sm font-semibold text-brand-secondary hover:border-brand-primary/40"
                >
                  <MapPin className="h-3.5 w-3.5 text-brand-primary-dark" /> {area}
                  <span className="text-xs text-brand-secondary/50">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Explore other cities */}
        <div className="mt-14 border-t border-brand-border-light pt-8">
          <h3 className="font-serif text-xl font-bold text-brand-secondary">Explore other cities</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {otherCities.map((c) => (
              <button
                key={c.slug}
                onClick={() => router.push(ROUTES.cityDetail(c.slug))}
                className="group relative aspect-[4/3] overflow-hidden ring-1 ring-brand-border-light"
              >
                <Image src={c.image} alt={c.name} fill sizes="20vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-black/70 to-transparent" />
                <span className="absolute bottom-2 left-2 font-serif text-sm font-bold text-white">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
