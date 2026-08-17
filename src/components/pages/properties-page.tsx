"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import {
  MapPin, Bed, Bath, Maximize2, BadgeCheck, Crown, Star, ArrowUpRight,
  Search, SlidersHorizontal, ChevronDown, ArrowLeft, X, Heart,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  properties, CITIES, BHK_OPTIONS, PURPOSE_OPTIONS, AMENITIES_MASTER,
  PRICE_RANGE_CR, AREA_RANGE_SQFT, type Priority, type Property,
} from "@/lib/vxp-data"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { UserNavMenu } from "@/components/site/user-nav-menu"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const STATUSES: Property["status"][] = ["Ready to Move", "Under Construction"]

const SEGMENT_META: Record<NonNullable<Property["segment"]>, { title: string; subtitle: string; empty: string }> = {
  "Residence": { title: "Browse Properties", subtitle: "1,84,000+ verified listings across India", empty: "No properties match your search. Try removing a filter." },
  "Commercial": { title: "Commercial Properties", subtitle: "Office, retail and warehouse space from developers across India", empty: "No commercial listings match your search. Try removing a filter." },
  "Land & Luxury Villa": { title: "Land & Luxury Villas", subtitle: "Premium villas and gated land parcels from India's top developers", empty: "No villas or plots match your search. Try removing a filter." },
  "Global": { title: "Global Properties", subtitle: "Cross-border listings for developers and investors, worldwide", empty: "No global listings match your search. Try removing a filter." },
}

type SortKey = "recommended" | "price-asc" | "price-desc"
const SORT_LABEL: Record<SortKey, string> = {
  recommended: "Recommended",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
}

/**
 * BR-03: the Sponsored → Featured → Organic bucket order is fixed and never
 * user-changeable. `sort` only re-orders results *within* each bucket —
 * it never lets a Featured listing outrank a Sponsored one.
 */
function sortWithinBuckets(list: Property[], sort: SortKey): Property[] {
  const buckets: Record<Priority, Property[]> = { Sponsored: [], Featured: [], Organic: [] }
  for (const p of list) buckets[p.priority].push(p)

  const order = (arr: Property[]) => {
    if (sort === "price-asc") return [...arr].sort((a, b) => a.priceCr - b.priceCr)
    if (sort === "price-desc") return [...arr].sort((a, b) => b.priceCr - a.priceCr)
    return [...arr].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0))
  }

  return [...order(buckets.Sponsored), ...order(buckets.Featured), ...order(buckets.Organic)]
}

function parseNum(v: string | null, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) && v !== null ? n : fallback
}

type PropertiesPageProps = {
  /** Which header nav vertical to scope this listing grid to. Omitted = "Residence"
   *  (the original, general /properties page — unchanged behavior). */
  segment?: NonNullable<Property["segment"]>
}

export function PropertiesPage({ segment = "Residence" }: PropertiesPageProps) {
  const meta = SEGMENT_META[segment]
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const user = useNav((s) => s.user)
  const shortlistedIds = useShortlistStore((s) => s.shortlistedIds)
  const toggleShortlist = useShortlistStore((s) => s.toggleShortlist)

  // Full filter grammar per the docs (07-Frontend.md §10.1):
  // q, city, propertyType, bhk, priceMin, priceMax, areaMin, areaMax, amenities, purpose, badges, sort
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [priorityFilter, setPriorityFilter] = useState<"All" | Priority>("All")
  const [cityFilter, setCityFilter] = useState(searchParams.get("city") ?? "All")
  const [typeFilter, setTypeFilter] = useState<"All" | Property["type"]>(
    (searchParams.get("propertyType") as Property["type"]) || "All",
  )
  const [statusFilter, setStatusFilter] = useState<"All" | Property["status"]>(
    (searchParams.get("status") as Property["status"]) || "All",
  )
  const [bhkFilter, setBhkFilter] = useState<number[]>(
    searchParams.get("bhk")?.split(",").map(Number).filter(Boolean) ?? [],
  )
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseNum(searchParams.get("priceMin"), PRICE_RANGE_CR.min),
    parseNum(searchParams.get("priceMax"), PRICE_RANGE_CR.max),
  ])
  const [areaRange, setAreaRange] = useState<[number, number]>([
    parseNum(searchParams.get("areaMin"), AREA_RANGE_SQFT.min),
    parseNum(searchParams.get("areaMax"), AREA_RANGE_SQFT.max),
  ])
  const [amenitiesFilter, setAmenitiesFilter] = useState<string[]>(
    searchParams.get("amenities")?.split(",").filter(Boolean) ?? [],
  )
  const [purposeFilter, setPurposeFilter] = useState<"All" | Property["purpose"]>(
    (searchParams.get("purpose") as Property["purpose"]) || "All",
  )
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("badges") === "verified")
  const [sort, setSort] = useState<SortKey>((searchParams.get("sort") as SortKey) || "recommended")

  // URL is the state (docs §10.1) — every filter change replaces the query
  // string so results stay shareable/bookmarkable/back-button-correct.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const params = new URLSearchParams()
      if (query) params.set("q", query)
      if (cityFilter !== "All") params.set("city", cityFilter)
      if (typeFilter !== "All") params.set("propertyType", typeFilter)
      if (statusFilter !== "All") params.set("status", statusFilter)
      if (bhkFilter.length) params.set("bhk", bhkFilter.join(","))
      if (priceRange[0] !== PRICE_RANGE_CR.min) params.set("priceMin", String(priceRange[0]))
      if (priceRange[1] !== PRICE_RANGE_CR.max) params.set("priceMax", String(priceRange[1]))
      if (areaRange[0] !== AREA_RANGE_SQFT.min) params.set("areaMin", String(areaRange[0]))
      if (areaRange[1] !== AREA_RANGE_SQFT.max) params.set("areaMax", String(areaRange[1]))
      if (amenitiesFilter.length) params.set("amenities", amenitiesFilter.join(","))
      if (purposeFilter !== "All") params.set("purpose", purposeFilter)
      if (verifiedOnly) params.set("badges", "verified")
      if (sort !== "recommended") params.set("sort", sort)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 300)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, cityFilter, typeFilter, statusFilter, bhkFilter, priceRange, areaRange, amenitiesFilter, purposeFilter, verifiedOnly, sort])

  const toggleBhk = (n: number) =>
    setBhkFilter((prev) => (prev.includes(n) ? prev.filter((v) => v !== n) : [...prev, n]))
  const toggleAmenity = (a: string) =>
    setAmenitiesFilter((prev) => (prev.includes(a) ? prev.filter((v) => v !== a) : [...prev, a]))

  const activeFilterCount =
    [cityFilter, typeFilter, statusFilter, purposeFilter].filter((v) => v !== "All").length +
    (bhkFilter.length ? 1 : 0) +
    (amenitiesFilter.length ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (priceRange[0] !== PRICE_RANGE_CR.min || priceRange[1] !== PRICE_RANGE_CR.max ? 1 : 0) +
    (areaRange[0] !== AREA_RANGE_SQFT.min || areaRange[1] !== AREA_RANGE_SQFT.max ? 1 : 0)

  const clearFilters = () => {
    setCityFilter("All")
    setTypeFilter("All")
    setStatusFilter("All")
    setBhkFilter([])
    setPriceRange([PRICE_RANGE_CR.min, PRICE_RANGE_CR.max])
    setAreaRange([AREA_RANGE_SQFT.min, AREA_RANGE_SQFT.max])
    setAmenitiesFilter([])
    setPurposeFilter("All")
    setVerifiedOnly(false)
  }

  const filtered = useMemo(() => {
    const list = properties
      .filter((p) => (p.segment ?? "Residence") === segment)
      .filter((p) => priorityFilter === "All" || p.priority === priorityFilter)
      .filter((p) => cityFilter === "All" || p.city === cityFilter)
      .filter((p) => typeFilter === "All" || p.type === typeFilter)
      .filter((p) => statusFilter === "All" || p.status === statusFilter)
      .filter((p) => purposeFilter === "All" || p.purpose === purposeFilter)
      .filter((p) => bhkFilter.length === 0 || bhkFilter.some((n) => (n >= 5 ? p.beds >= 5 : p.beds === n)))
      .filter((p) => p.priceCr >= priceRange[0] && p.priceCr <= priceRange[1])
      .filter((p) => p.areaSqft >= areaRange[0] && p.areaSqft <= areaRange[1])
      .filter((p) => amenitiesFilter.every((a) => p.amenities.includes(a)))
      .filter((p) => !verifiedOnly || p.tags.includes("Verified"))
      .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()) || p.location.toLowerCase().includes(query.toLowerCase()))

    return sortWithinBuckets(list, sort)
  }, [segment, priorityFilter, cityFilter, typeFilter, statusFilter, purposeFilter, bhkFilter, priceRange, areaRange, amenitiesFilter, verifiedOnly, query, sort])

  return (
    <div className="min-h-screen bg-brand-surface">
      {/* Header */}
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
              <h1 className="font-serif text-xl font-bold text-brand-secondary">{meta.title}</h1>
              <p className="text-xs text-brand-secondary/55">{meta.subtitle}</p>
            </div>
          </div>
          {user ? (
            <UserNavMenu user={user} className="hidden text-brand-secondary sm:flex" />
          ) : (
            <button
              onClick={() => router.push(ROUTES.login)}
              className="hidden border border-brand-border-light px-4 py-2 text-sm font-bold text-brand-secondary hover:bg-brand-surface sm:block"
            >
              Log in
            </button>
          )}
        </div>
      </header>

      {/* Search + filters */}
      <div className="border-b border-brand-border-light bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by location, project, or keyword..."
                className="w-full border border-brand-border-light bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["All", "Sponsored", "Featured", "Organic"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setPriorityFilter(f)}
                  className={
                    "px-3 py-2 text-xs font-bold transition-colors " +
                    (priorityFilter === f
                      ? "bg-ink-black text-brand-primary"
                      : "border border-brand-border-light bg-card text-brand-secondary/65 hover:bg-brand-surface")
                  }
                >
                  {f}
                </button>
              ))}

              {/* Filters popover — the full docs grammar: city, type, BHK, price, area, amenities, purpose, badges */}
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
                      <button onClick={clearFilters} className="flex items-center gap-1 text-[11px] font-bold text-brand-primary-dark hover:underline">
                        <X className="h-3 w-3" /> Clear all
                      </button>
                    )}
                  </div>

                  {/* City */}
                  <FilterSection label="City">
                    {(["All", ...CITIES] as const).map((c) => (
                      <FilterChip key={c} active={cityFilter === c} onClick={() => setCityFilter(c)}>{c}</FilterChip>
                    ))}
                  </FilterSection>

                  {/* Property type */}
                  <FilterSection label="Property type">
                    {(["All", "Apartment", "Villa", "Penthouse", "Commercial", "Plot"] as const).map((t) => (
                      <FilterChip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>{t}</FilterChip>
                    ))}
                  </FilterSection>

                  {/* BHK — multi-select, 5 means 5+ */}
                  <FilterSection label="BHK">
                    {BHK_OPTIONS.map((n) => (
                      <FilterChip key={n} active={bhkFilter.includes(n)} onClick={() => toggleBhk(n)}>
                        {n}{n === 5 ? "+" : ""} BHK
                      </FilterChip>
                    ))}
                  </FilterSection>

                  {/* Purpose */}
                  <FilterSection label="Purpose">
                    {(["All", ...PURPOSE_OPTIONS] as const).map((p) => (
                      <FilterChip key={p} active={purposeFilter === p} onClick={() => setPurposeFilter(p)}>{p}</FilterChip>
                    ))}
                  </FilterSection>

                  {/* Status */}
                  <FilterSection label="Status">
                    {(["All", ...STATUSES] as const).map((s) => (
                      <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{s}</FilterChip>
                    ))}
                  </FilterSection>

                  {/* Price range slider */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/45">Budget</p>
                      <span className="text-[11px] font-bold text-brand-secondary/70">
                        ₹ {priceRange[0]} – {priceRange[1] >= PRICE_RANGE_CR.max ? `${PRICE_RANGE_CR.max}+` : priceRange[1]} Cr
                      </span>
                    </div>
                    <Slider
                      className="mt-3"
                      min={PRICE_RANGE_CR.min}
                      max={PRICE_RANGE_CR.max}
                      step={0.25}
                      value={priceRange}
                      onValueChange={(v) => setPriceRange([v[0], v[1]])}
                    />
                  </div>

                  {/* Area range slider */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/45">Area (sq.ft)</p>
                      <span className="text-[11px] font-bold text-brand-secondary/70">
                        {areaRange[0].toLocaleString()} – {areaRange[1].toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      className="mt-3"
                      min={AREA_RANGE_SQFT.min}
                      max={AREA_RANGE_SQFT.max}
                      step={100}
                      value={areaRange}
                      onValueChange={(v) => setAreaRange([v[0], v[1]])}
                    />
                  </div>

                  {/* Amenities */}
                  <FilterSection label="Amenities">
                    {AMENITIES_MASTER.map((a) => (
                      <FilterChip key={a} active={amenitiesFilter.includes(a)} onClick={() => toggleAmenity(a)}>{a}</FilterChip>
                    ))}
                  </FilterSection>

                  {/* Badges */}
                  <div className="mt-4">
                    <FilterChip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
                      <BadgeCheck className="mr-1 inline h-3 w-3" /> Verified only
                    </FilterChip>
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
            Showing <span className="font-bold text-brand-secondary">{filtered.length}</span> of 1,84,000+ listings
          </p>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-xs font-bold text-brand-secondary/65 hover:text-brand-secondary">
                Sort: {SORT_LABEL[sort]} <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
                  <DropdownMenuRadioItem key={key} value={key}>
                    {SORT_LABEL[key]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
              }}
              whileHover={{ y: -6 }}
              onClick={() => router.push(ROUTES.propertyDetail(p.id))}
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
                  {p.tags.includes("Verified") && (
                    <Badge className="bg-card/95 text-brand-secondary hover:bg-card/95">
                      <BadgeCheck className="mr-1 h-3 w-3 text-brand-primary-dark" /> Verified
                    </Badge>
                  )}
                </div>
                <div className="absolute bottom-3 left-3">
                  <span className="rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold uppercase text-brand-secondary">
                    {p.status}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleShortlist(p.id) }}
                  aria-pressed={shortlistedIds.includes(p.id)}
                  aria-label={shortlistedIds.includes(p.id) ? "Remove from shortlist" : "Add to shortlist"}
                  className={
                    "absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur-sm hover:bg-card " +
                    (shortlistedIds.includes(p.id) ? "bg-card text-brand-primary-dark" : "bg-card/85 text-brand-secondary/70")
                  }
                >
                  <Heart className={"h-4 w-4" + (shortlistedIds.includes(p.id) ? " fill-brand-primary-dark" : "")} />
                </button>
              </div>
              <div className="p-5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary-dark">{p.type}</span>
                <h3 className="mt-1.5 line-clamp-2 font-serif text-lg font-bold text-brand-secondary">{p.title}</h3>
                <div className="mt-2 flex items-center gap-1 text-sm text-brand-secondary/60">
                  <MapPin className="h-3.5 w-3.5 text-brand-primary-dark" /> <span className="truncate">{p.location}</span>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-brand-secondary/75">
                  <span className="flex items-center gap-1.5"><Bed className="h-4 w-4 text-brand-primary-dark" /><b>{p.beds}</b> Beds</span>
                  <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-brand-primary-dark" /><b>{p.baths}</b> Baths</span>
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
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="border border-brand-border-light bg-card p-12 text-center">
            <p className="text-sm text-brand-secondary/65">{meta.empty}</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-3 text-sm font-bold text-brand-primary-dark hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
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
      className={
        "px-2.5 py-1.5 text-[11px] font-bold transition-colors " +
        (active ? "bg-ink-black text-brand-primary" : "border border-brand-border-light bg-card text-brand-secondary/65 hover:bg-brand-surface")
      }
    >
      {children}
    </button>
  )
}
