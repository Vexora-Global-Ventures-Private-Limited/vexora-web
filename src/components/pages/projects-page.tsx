"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import {
  MapPin, BadgeCheck, Crown, Star, ArrowUpRight, Search, SlidersHorizontal,
  ArrowLeft, X, FileCheck2, ShieldAlert, Layers3, Plus, Heart,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useProjectsStore } from "@/lib/projects-store"
import { PROJECT_STATUSES, PROJECT_CITIES, projectPriceRangeCr, type Project, type ProjectStatus } from "@/lib/projects-data"
import type { Priority } from "@/lib/vxp-data"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { UserNavMenu } from "@/components/site/user-nav-menu"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"

function parseNum(v: string | null, fallback: number): number {
  const n = Number(v)
  return Number.isFinite(n) && v !== null ? n : fallback
}

export function ProjectsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const user = useNav((s) => s.user)
  const projects = useProjectsStore((s) => s.projects)
  const shortlistedIds = useShortlistStore((s) => s.shortlistedIds)
  const toggleShortlist = useShortlistStore((s) => s.toggleShortlist)

  const priceBounds = useMemo(() => {
    const ranges = projects.map(projectPriceRangeCr)
    return {
      min: 0,
      max: Math.ceil(Math.max(...ranges.map((r) => r.max), 1)),
    }
  }, [projects])

  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [priorityFilter, setPriorityFilter] = useState<"All" | Priority>("All")
  const [cityFilter, setCityFilter] = useState(searchParams.get("city") ?? "All")
  const [statusFilter, setStatusFilter] = useState<"All" | ProjectStatus>(
    (searchParams.get("status") as ProjectStatus) || "All",
  )
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseNum(searchParams.get("priceMin"), priceBounds.min),
    parseNum(searchParams.get("priceMax"), priceBounds.max),
  ])
  const [zeroBrokerageOnly, setZeroBrokerageOnly] = useState(searchParams.get("zeroBrokerage") === "1")

  useEffect(() => {
    const t = window.setTimeout(() => {
      const params = new URLSearchParams()
      if (query) params.set("q", query)
      if (cityFilter !== "All") params.set("city", cityFilter)
      if (statusFilter !== "All") params.set("status", statusFilter)
      if (priceRange[0] !== priceBounds.min) params.set("priceMin", String(priceRange[0]))
      if (priceRange[1] !== priceBounds.max) params.set("priceMax", String(priceRange[1]))
      if (zeroBrokerageOnly) params.set("zeroBrokerage", "1")
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }, 300)
    return () => window.clearTimeout(t)
  }, [query, cityFilter, statusFilter, priceRange, zeroBrokerageOnly, pathname, router])

  const activeFilterCount =
    [cityFilter, statusFilter].filter((v) => v !== "All").length +
    (zeroBrokerageOnly ? 1 : 0) +
    (priceRange[0] !== priceBounds.min || priceRange[1] !== priceBounds.max ? 1 : 0)

  const clearFilters = () => {
    setCityFilter("All")
    setStatusFilter("All")
    setPriceRange([priceBounds.min, priceBounds.max])
    setZeroBrokerageOnly(false)
  }

  const filtered = useMemo(() => {
    const buckets: Record<Priority, Project[]> = { Sponsored: [], Featured: [], Organic: [] }
    for (const p of projects) {
      const { min, max } = projectPriceRangeCr(p)
      if (priorityFilter !== "All" && p.priority !== priorityFilter) continue
      if (cityFilter !== "All" && p.city !== cityFilter) continue
      if (statusFilter !== "All" && p.status !== statusFilter) continue
      if (zeroBrokerageOnly && !p.zeroBrokerage) continue
      if (max < priceRange[0] || min > priceRange[1]) continue
      if (
        query &&
        !p.name.toLowerCase().includes(query.toLowerCase()) &&
        !p.location.toLowerCase().includes(query.toLowerCase()) &&
        !p.developer.toLowerCase().includes(query.toLowerCase())
      ) continue
      buckets[p.priority].push(p)
    }
    const order = (arr: Project[]) => [...arr].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0))
    return [...order(buckets.Sponsored), ...order(buckets.Featured), ...order(buckets.Organic)]
  }, [projects, priorityFilter, cityFilter, statusFilter, zeroBrokerageOnly, priceRange, query])

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
              <h1 className="font-serif text-xl font-bold text-brand-secondary">Developer Projects</h1>
              <p className="text-xs text-brand-secondary/55">New launches &amp; ongoing developments, direct from builders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.tier === "V" && (
              <button
                onClick={() => router.push(ROUTES.newProject)}
                className="hidden items-center gap-1.5 bg-ink-black px-4 py-2 text-xs font-bold text-brand-primary hover:bg-brand-secondary sm:flex"
              >
                <Plus className="h-3.5 w-3.5" /> List a project
              </button>
            )}
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
                placeholder="Search by project name or location..."
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

                  <FilterSection label="City">
                    {(["All", ...PROJECT_CITIES] as const).map((c) => (
                      <FilterChip key={c} active={cityFilter === c} onClick={() => setCityFilter(c)}>{c}</FilterChip>
                    ))}
                  </FilterSection>

                  <FilterSection label="Construction status">
                    {(["All", ...PROJECT_STATUSES] as const).map((s) => (
                      <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{s}</FilterChip>
                    ))}
                  </FilterSection>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/45">Starting price</p>
                      <span className="text-[11px] font-bold text-brand-secondary/70">
                        ₹ {priceRange[0]} – {priceRange[1] >= priceBounds.max ? `${priceBounds.max}+` : priceRange[1]} Cr
                      </span>
                    </div>
                    <Slider
                      className="mt-3"
                      min={priceBounds.min}
                      max={priceBounds.max}
                      step={0.25}
                      value={priceRange}
                      onValueChange={(v) => setPriceRange([v[0], v[1]])}
                    />
                  </div>

                  <div className="mt-4">
                    <FilterChip active={zeroBrokerageOnly} onClick={() => setZeroBrokerageOnly((v) => !v)}>
                      Zero brokerage only
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
        <p className="mb-5 text-sm text-brand-secondary/65">
          Showing <span className="font-bold text-brand-secondary">{filtered.length}</span> of {projects.length} developer projects
        </p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((p) => {
            const { min, max } = projectPriceRangeCr(p)
            const reraOk = p.reraRegistrations.length > 0
            return (
              <motion.div
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
                }}
                whileHover={{ y: -6 }}
                onClick={() => router.push(ROUTES.projectDetail(p.id))}
                className={
                  "group relative cursor-pointer overflow-hidden bg-card transition-shadow hover:shadow-2xl hover:shadow-brand-primary/15 " +
                  (p.priority === "Sponsored" ? "ring-2 ring-brand-primary" : "ring-1 ring-brand-border-light hover:ring-brand-primary/40")
                }
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={p.coverImage} alt={p.name} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-black/50 to-transparent" />
                  <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
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
                    {reraOk ? (
                      <Badge className="bg-card/95 text-green-700 hover:bg-card/95">
                        <FileCheck2 className="mr-1 h-3 w-3" /> RERA
                      </Badge>
                    ) : (
                      <Badge className="bg-card/95 text-amber-700 hover:bg-card/95">
                        <ShieldAlert className="mr-1 h-3 w-3" /> RERA Pending
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
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary-dark">{p.developer}</span>
                  <h3 className="mt-1.5 line-clamp-2 font-serif text-lg font-bold text-brand-secondary">{p.name}</h3>
                  <div className="mt-2 flex items-center gap-1 text-sm text-brand-secondary/60">
                    <MapPin className="h-3.5 w-3.5 text-brand-primary-dark" /> <span className="truncate">{p.location}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-sm text-brand-secondary/75">
                    <Layers3 className="h-4 w-4 text-brand-primary-dark" />
                    <span>{p.configurations.length} configuration{p.configurations.length === 1 ? "" : "s"}</span>
                    {p.zeroBrokerage && <span className="ml-1 text-xs font-bold text-brand-primary-dark">· Zero Brokerage</span>}
                  </div>
                  <div className="mt-5 flex items-end justify-between border-t border-brand-border-light pt-4">
                    <div>
                      <div className="font-serif text-xl font-bold text-brand-secondary">
                        {min === max ? `₹ ${min} Cr` : `₹ ${min} – ${max} Cr`}
                      </div>
                      <div className="text-xs text-brand-secondary/50">Starting price</div>
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

        {filtered.length === 0 && (
          <div className="border border-brand-border-light bg-card p-12 text-center">
            <p className="text-sm text-brand-secondary/65">No projects match your search. Try removing a filter.</p>
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
