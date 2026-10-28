"use client"

import { useCityNames } from "@/components/property/search-suggest"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import {
  MapPin, Bed, Maximize2, BadgeCheck, Crown, Star, ArrowUpRight,
  Search, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, ArrowLeft, X, Heart, Globe2,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { PRICE_RANGE_CR, type Property } from "@/lib/vxp-data"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { crToPaise, formatCr, propertyTypeLabel, searchDocToProperty, toShortlistSnapshot, type ApiProperty } from "@/lib/api-mappers"
import {
  useGetPublicConfigQuery,
  useSearchQuery,
  type SearchSort,
} from "@/store/api/searchApi"
import { UserNavMenu } from "@/components/site/user-nav-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Segment = NonNullable<Property["segment"]>

/**
 * Each nav vertical maps onto the API's property types. Search takes ONE
 * `property_type`, so a segment that spans several types offers them as
 * chips and starts on the first (Residence spans everything → "All").
 * Global has no backing data at all — every listing is India-only today.
 */
const SEGMENT_META: Record<Segment, { title: string; subtitle: string; empty: string; types: string[] | null }> = {
  "Residence": { title: "Browse Properties", subtitle: "Verified listings across India", empty: "No properties match your search. Try removing a filter.", types: null },
  "Commercial": { title: "Commercial Properties", subtitle: "Office, retail and warehouse space across India", empty: "No commercial listings match your search. Try removing a filter.", types: ["commercial", "office", "warehouse"] },
  "Land & Luxury Villa": { title: "Land & Luxury Villas", subtitle: "Villas and land parcels across India", empty: "No villas or plots match your search. Try removing a filter.", types: ["villa", "plot"] },
  "Global": { title: "Global Properties", subtitle: "Cross-border listings for developers and investors", empty: "", types: [] },
}

const SORT_LABEL: Record<SearchSort, string> = {
  relevance: "Recommended",
  newest: "Newest first",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
}

const PAGE_SIZE = 12

const PRIORITY_ORDER: Record<string, number> = { Sponsored: 0, Featured: 1, Organic: 2 }

/**
 * BR-03: the Sponsored → Featured → Organic bucket order is fixed and never
 * user-changeable — `sort` only re-orders within a bucket. The sort is sent
 * to the API, and also re-applied to the page in hand: the MongoDB fallback
 * search (the only one running until Meilisearch is connected) currently
 * ignores `sort`, so without this the dropdown would visibly do nothing.
 */
function orderPage(list: ApiProperty[], sort: SearchSort): ApiProperty[] {
  const cmp = (a: ApiProperty, b: ApiProperty) => {
    if (sort === "price_asc") return a.priceCr - b.priceCr
    if (sort === "price_desc") return b.priceCr - a.priceCr
    return 0
  }
  return [...list].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || cmp(a, b))
}

const QUERY_MAX = 100

/** A positive integer from the URL, or the fallback (page=0/-1 crash the search API; 1.5 returns nothing). */
function parsePositiveInt(v: string | null, fallback: number): number {
  const n = Number(v)
  return v !== null && Number.isInteger(n) && n >= 1 ? n : fallback
}

function parseCr(v: string | null, fallback: number): number {
  const n = Number(v)
  if (v === null || v === "" || !Number.isFinite(n)) return fallback
  return Math.min(PRICE_RANGE_CR.max, Math.max(PRICE_RANGE_CR.min, n))
}

type Filters = {
  q: string
  city: string
  type: string
  bhk: number | null
  price: [number, number]
  sort: SearchSort
  page: number
}

/**
 * The URL is the single source of truth for every filter (docs §10.1) —
 * shareable, bookmarkable, and correct on Back/Forward. Every value is
 * validated here, since anyone can hand-edit a query string.
 */
function readFilters(sp: URLSearchParams, defaultType: string): Filters {
  const sortParam = sp.get("sort") as SearchSort | null
  let price: [number, number] = [parseCr(sp.get("priceMin"), PRICE_RANGE_CR.min), parseCr(sp.get("priceMax"), PRICE_RANGE_CR.max)]
  if (price[0] > price[1]) price = [price[1], price[0]]
  return {
    q: (sp.get("q") ?? "").slice(0, QUERY_MAX),
    city: sp.get("city") ?? "All",
    // API types are lowercase; older links may still carry "Apartment"-style labels.
    type: sp.get("propertyType")?.toLowerCase() || defaultType,
    bhk: parsePositiveInt(sp.get("bhk"), 0) || null,
    price,
    sort: sortParam && sortParam in SORT_LABEL ? sortParam : "relevance",
    page: parsePositiveInt(sp.get("page"), 1),
  }
}

function writeFilters(f: Filters, defaultType: string): string {
  const params = new URLSearchParams()
  if (f.q) params.set("q", f.q)
  if (f.city !== "All") params.set("city", f.city)
  if (f.type !== defaultType) params.set("propertyType", f.type)
  if (f.bhk) params.set("bhk", String(f.bhk))
  if (f.price[0] !== PRICE_RANGE_CR.min) params.set("priceMin", String(f.price[0]))
  if (f.price[1] !== PRICE_RANGE_CR.max) params.set("priceMax", String(f.price[1]))
  if (f.sort !== "relevance") params.set("sort", f.sort)
  if (f.page > 1) params.set("page", String(f.page))
  return params.toString()
}

type PropertiesPageProps = {
  /** Which header nav vertical to scope this listing grid to. Omitted = "Residence". */
  segment?: Segment
}

export function PropertiesPage({ segment = "Residence" }: PropertiesPageProps) {
  const meta = SEGMENT_META[segment]
  const defaultType = meta.types?.[0] ?? "All"
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const user = useNav((s) => s.user)
  const shortlistedIds = useShortlistStore((s) => s.shortlistedIds)
  const toggleShortlist = useShortlistStore((s) => s.toggleShortlist)

  const { data: config } = useGetPublicConfigQuery()

  const urlFilters = readFilters(searchParams, defaultType)

  // City picker sourced from the Location Master (search itself never
  // validates `city`, and matches it case-sensitively — "mumbai" finds
  // nothing). Listings store the district-level name ("Mumbai"), so
  // district + city entries are both offered.
  // Shared with the hero/header search so both offer the same cities.
  const cityOptions = useCityNames()
  const typeOptions = meta.types ?? config?.allowedPropertyTypes ?? []
  const bhkOptions = config?.allowedBhkValues ?? []

  // Canonicalise hand-typed / old links: city case-insensitively onto a
  // known name, unknown property types back to the default.
  const canonicalCity =
    urlFilters.city === "All" ? "All" : cityOptions.find((c) => c.toLowerCase() === urlFilters.city.toLowerCase()) ?? urlFilters.city
  const typeKnown = urlFilters.type === "All" ? !meta.types : typeOptions.length === 0 || typeOptions.includes(urlFilters.type)
  const filters: Filters = { ...urlFilters, city: canonicalCity, type: typeKnown ? urlFilters.type : defaultType }

  // Only one filter changes per interaction; any change except paging goes back to page 1.
  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, page: 1, ...patch }
    const qs = writeFilters(next, defaultType)
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // Search box: typed text is local, pushed to the URL 350ms after typing
  // stops. When the URL's q changes from elsewhere (Back/Forward), the box
  // follows it — but never overwrites what's being typed right now.
  const [query, setQuery] = useState(filters.q)
  const [lastUrlQ, setLastUrlQ] = useState(filters.q)
  if (filters.q !== lastUrlQ) {
    setLastUrlQ(filters.q)
    if (filters.q !== query.trim()) setQuery(filters.q)
  }
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed === filters.q) return
    const t = window.setTimeout(() => update({ q: trimmed }), 350)
    return () => window.clearTimeout(t)
  }, [query, filters.q])

  // Budget slider: dragging only moves the local value; the search runs once
  // on release (onValueCommit) instead of firing a request per pixel.
  const [draftPrice, setDraftPrice] = useState<[number, number]>(filters.price)
  const [lastUrlPrice, setLastUrlPrice] = useState(filters.price.join("-"))
  if (filters.price.join("-") !== lastUrlPrice) {
    setLastUrlPrice(filters.price.join("-"))
    setDraftPrice(filters.price)
  }

  const isGlobal = segment === "Global"
  const { data, isFetching, isError, refetch } = useSearchQuery(
    {
      q: filters.q || undefined,
      city: filters.city !== "All" ? filters.city : undefined,
      property_type: filters.type !== "All" ? filters.type : undefined,
      bhk: filters.bhk ?? undefined,
      price_min: filters.price[0] > PRICE_RANGE_CR.min ? crToPaise(filters.price[0]) : undefined,
      // The slider's top end means "and above" — no upper bound sent.
      price_max: filters.price[1] < PRICE_RANGE_CR.max ? crToPaise(filters.price[1]) : undefined,
      sort: filters.sort,
      page: filters.page,
      limit: PAGE_SIZE,
    },
    { skip: isGlobal },
  )

  const results = useMemo(() => orderPage((data?.hits ?? []).map(searchDocToProperty), filters.sort), [data, filters.sort])
  const totalPages = data?.totalPages ?? 0
  // A bookmarked page past the end (results shrank since) — offer page 1 instead of a dead empty state.
  const pageOutOfRange = !!data && filters.page > 1 && filters.page > totalPages

  const goToPage = (page: number) => {
    update({ page })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const activeFilterCount =
    (filters.city !== "All" ? 1 : 0) +
    (filters.type !== defaultType ? 1 : 0) +
    (filters.bhk ? 1 : 0) +
    (filters.price[0] !== PRICE_RANGE_CR.min || filters.price[1] !== PRICE_RANGE_CR.max ? 1 : 0)

  const clearFilters = (alsoQuery = false) => {
    if (alsoQuery) setQuery("")
    update({
      city: "All",
      type: defaultType,
      bhk: null,
      price: [PRICE_RANGE_CR.min, PRICE_RANGE_CR.max],
      ...(alsoQuery ? { q: "" } : {}),
    })
  }

  const openListing = (p: ApiProperty) => router.push(ROUTES.propertyDetail(p.slug))

  return (
    <div className="min-h-screen bg-brand-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(ROUTES.home)}
              className="grid h-10 w-10 place-items-center border border-brand-border-light text-brand-secondary hover:bg-brand-surface"
              aria-label="Home"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="grid h-10 w-10 place-items-center bg-gradient-to-br from-brand-primary via-brand-primary to-gold-700 shadow-md">
              <span className="font-serif text-lg font-bold text-brand-secondary">V</span>
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-brand-secondary">{meta.title}</h1>
              <p className="text-xs text-brand-secondary/55">{meta.subtitle}</p>
            </div>
          </div>
          {user ? (
            <UserNavMenu user={user} className="text-brand-secondary" />
          ) : (
            <button
              onClick={() => router.push(ROUTES.loginWithReturn(`${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`))}
              className="shrink-0 border border-brand-border-light px-4 py-2 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
            >
              Log in
            </button>
          )}
        </div>
      </header>

      {isGlobal ? (
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <Globe2 className="mx-auto h-12 w-12 text-brand-primary-dark" />
          <h2 className="mt-4 font-serif text-3xl font-bold text-brand-secondary">Global listings are coming soon</h2>
          <p className="mt-3 text-sm text-brand-secondary/65">
            VXP is India-only today. Cross-border listings for developers and investors will open here once they launch.
          </p>
          <button
            onClick={() => router.push(ROUTES.properties)}
            className="btn-gold relative mt-6 overflow-hidden px-6 py-3 text-sm font-bold"
          >
            <span className="relative z-10">Browse India listings</span>
          </button>
        </div>
      ) : (
        <>
          {/* Search + filters */}
          <div className="border-b border-brand-border-light bg-card">
            <div className="mx-auto max-w-7xl px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary/40" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value.slice(0, QUERY_MAX))}
                    maxLength={QUERY_MAX}
                    aria-label="Search listings"
                    type="search"
                    placeholder="Search by location, project, or keyword..."
                    className="w-full border border-brand-border-light bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Type chips — the segment's own types (or every configured type). */}
                  {(meta.types ? meta.types : ["All", ...typeOptions]).map((t) => (
                    <button
                      key={t}
                      onClick={() => update({ type: t })}
                      aria-pressed={filters.type === t}
                      className={
                        "px-3 py-2 text-xs font-bold transition-colors " +
                        (filters.type === t
                          ? "bg-ink-black text-brand-primary"
                          : "border border-brand-border-light bg-card text-brand-secondary/65 hover:bg-brand-surface")
                      }
                    >
                      {t === "All" ? "All" : propertyTypeLabel(t)}
                    </button>
                  ))}

                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="relative flex items-center gap-1.5 border border-brand-border-light bg-card px-3 py-2 text-xs font-bold text-brand-secondary/65 hover:bg-brand-surface">
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                        {activeFilterCount > 0 && (
                          <span className="ml-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand-primary text-[10px] font-bold text-ink-black">
                            {activeFilterCount}
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="max-h-[80vh] w-96 overflow-y-auto border-brand-border-light p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide text-brand-secondary/55">Filters</span>
                        {activeFilterCount > 0 && (
                          <button onClick={() => clearFilters()} className="flex items-center gap-1 text-[11px] font-bold text-brand-primary-dark hover:underline">
                            <X className="h-3 w-3" /> Clear all
                          </button>
                        )}
                      </div>

                      <FilterSection label="City">
                        {["All", ...cityOptions, ...(filters.city !== "All" && !cityOptions.includes(filters.city) ? [filters.city] : [])].map((c) => (
                          <FilterChip key={c} active={filters.city === c} onClick={() => update({ city: c })}>{c}</FilterChip>
                        ))}
                      </FilterSection>

                      <FilterSection label="BHK">
                        <FilterChip active={filters.bhk === null} onClick={() => update({ bhk: null })}>Any</FilterChip>
                        {bhkOptions.map((n) => (
                          <FilterChip key={n} active={filters.bhk === n} onClick={() => update({ bhk: n })}>
                            {n} BHK
                          </FilterChip>
                        ))}
                      </FilterSection>

                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/45">Budget</p>
                          <span className="text-[11px] font-bold text-brand-secondary/70">
                            {formatCr(draftPrice[0]) === "Price on request" ? "₹ 0" : formatCr(draftPrice[0])} –{" "}
                            {draftPrice[1] >= PRICE_RANGE_CR.max ? `${formatCr(PRICE_RANGE_CR.max)}+` : formatCr(draftPrice[1])}
                          </span>
                        </div>
                        <Slider
                          className="mt-3"
                          min={PRICE_RANGE_CR.min}
                          max={PRICE_RANGE_CR.max}
                          step={0.25}
                          value={draftPrice}
                          aria-label="Budget range"
                          onValueChange={(v) => setDraftPrice([v[0], v[1]])}
                          onValueCommit={(v) => update({ price: [v[0], v[1]] })}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-brand-secondary/65">
                {data ? (
                  <>
                    <span className="font-bold text-brand-secondary">{data.total.toLocaleString("en-IN")}</span>{" "}
                    listing{data.total === 1 ? "" : "s"} found
                  </>
                ) : (
                  "Searching…"
                )}
              </p>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-xs font-bold text-brand-secondary/65 hover:text-brand-secondary">
                    Sort: {SORT_LABEL[filters.sort]} <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup value={filters.sort} onValueChange={(v) => update({ sort: v as SearchSort })}>
                    {(Object.keys(SORT_LABEL) as SearchSort[]).map((key) => (
                      <DropdownMenuRadioItem key={key} value={key}>
                        {SORT_LABEL[key]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isError ? (
              <div className="border border-brand-border-light bg-card p-12 text-center">
                <p className="text-sm text-brand-secondary/65">Search is unavailable right now.</p>
                <button onClick={() => refetch()} className="mt-3 text-sm font-bold text-brand-primary-dark hover:underline">
                  Try again
                </button>
              </div>
            ) : !data ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card ring-1 ring-brand-border-light">
                    <Skeleton className="aspect-[4/3] w-full" />
                    <div className="space-y-2 p-5">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-5 w-4/5" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                key={`${filters.page}-${results.length}`}
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                className={"grid grid-cols-1 gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3" + (isFetching ? " opacity-60" : "")}
              >
                {results.map((p) => {
                  const saved = shortlistedIds.includes(p.id)
                  return (
                    <motion.div
                      key={p.id}
                      variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
                      }}
                      whileHover={{ y: -6 }}
                      onClick={() => openListing(p)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          openListing(p)
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`${p.title}, ${p.price}, ${p.location}`}
                      data-cursor="view"
                      className={
                        "group relative cursor-pointer overflow-hidden bg-card transition-shadow hover:shadow-2xl hover:shadow-brand-primary/15 " +
                        (p.priority === "Sponsored" ? "ring-2 ring-brand-primary" : "ring-1 ring-brand-border-light hover:ring-brand-primary/40")
                      }
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image src={p.image} alt={p.title} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink-black/50 to-transparent" />
                        <div className="absolute inset-x-3 top-3 flex gap-1.5">
                          {p.priority === "Sponsored" && (
                            <Badge className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-ink-black hover:from-brand-primary hover:to-brand-primary-dark">
                              <Crown className="mr-1 h-3 w-3" /> Sponsored
                            </Badge>
                          )}
                          {p.priority === "Featured" && (
                            <Badge className="bg-ink-black text-brand-primary hover:bg-ink-black">
                              <Star className="mr-1 h-3 w-3 fill-brand-primary" /> Featured
                            </Badge>
                          )}
                          {p.badges.length > 0 && (
                            <Badge className="bg-card/95 text-brand-secondary hover:bg-card/95">
                              <BadgeCheck className="mr-1 h-3 w-3 text-brand-primary-dark" /> Verified
                            </Badge>
                          )}
                        </div>
                        <div className="absolute bottom-3 left-3">
                          <span className="rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold uppercase text-brand-secondary">
                            For {p.purpose}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleShortlist(p.id, toShortlistSnapshot(p)) }}
                          aria-pressed={saved}
                          aria-label={saved ? "Remove from shortlist" : "Add to shortlist"}
                          className={
                            "absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm hover:bg-card " +
                            (saved ? "bg-card text-brand-primary-dark" : "bg-card/85 text-brand-secondary/70")
                          }
                        >
                          <Heart className={"h-4 w-4" + (saved ? " fill-brand-primary-dark" : "")} />
                        </button>
                      </div>
                      <div className="p-5">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary-dark">{p.type}</span>
                        <h3 className="mt-1.5 line-clamp-2 font-serif text-lg font-bold text-brand-secondary">{p.title}</h3>
                        <div className="mt-2 flex items-center gap-1 text-sm text-brand-secondary/60">
                          <MapPin className="h-3.5 w-3.5 text-brand-primary-dark" /> <span className="truncate">{p.location}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-sm text-brand-secondary/75">
                          {p.beds > 0 && (
                            <span className="flex items-center gap-1.5"><Bed className="h-4 w-4 text-brand-primary-dark" /><b>{p.beds}</b> BHK</span>
                          )}
                          <span className="flex items-center gap-1.5"><Maximize2 className="h-4 w-4 text-brand-primary-dark" /><b>{p.area}</b></span>
                        </div>
                        <div className="mt-5 flex items-end justify-between border-t border-brand-border-light pt-4">
                          <div>
                            <div className="font-serif text-xl font-bold text-brand-secondary">{p.price}</div>
                            {p.pricePerSqft && <div className="text-xs text-brand-secondary/50">{p.pricePerSqft}</div>}
                          </div>
                          <span className="flex items-center gap-1 bg-ink-black px-4 py-2 text-xs font-bold text-brand-primary">
                            View <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}

            {data && results.length === 0 && pageOutOfRange && (
              <div className="border border-brand-border-light bg-card p-12 text-center">
                <p className="text-sm text-brand-secondary/65">There&apos;s nothing on page {filters.page} any more.</p>
                <button onClick={() => goToPage(1)} className="mt-3 text-sm font-bold text-brand-primary-dark hover:underline">
                  Go to page 1
                </button>
              </div>
            )}

            {data && results.length === 0 && !pageOutOfRange && (
              <div className="border border-brand-border-light bg-card p-12 text-center">
                <p className="text-sm text-brand-secondary/65">{meta.empty}</p>
                {(activeFilterCount > 0 || filters.q) && (
                  <button
                    onClick={() => clearFilters(true)}
                    className="mt-3 text-sm font-bold text-brand-primary-dark hover:underline"
                  >
                    Clear search &amp; filters
                  </button>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => goToPage(Math.max(1, filters.page - 1))}
                  disabled={filters.page <= 1 || isFetching}
                  className="flex items-center gap-1 border border-brand-border-light bg-card px-4 py-2 text-xs font-bold text-brand-secondary disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <span className="text-xs font-semibold text-brand-secondary/65">
                  Page {filters.page} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(Math.min(totalPages, filters.page + 1))}
                  disabled={filters.page >= totalPages || isFetching}
                  className="flex items-center gap-1 border border-brand-border-light bg-card px-4 py-2 text-xs font-bold text-brand-secondary disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/45">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={
        "px-2.5 py-1.5 text-[11px] font-bold transition-colors " +
        (active ? "bg-ink-black text-brand-primary" : "border border-brand-border-light bg-card text-brand-secondary/65 hover:bg-brand-surface")
      }
    >
      {children}
    </button>
  )
}
