"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { MapPin, Search, ArrowLeft, Layers3, Plus, BadgeCheck, ArrowUpRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { placeholderImages } from "@/lib/api-mappers"
import { useGetFeaturedBuildersQuery, useGetPromotedProjectsQuery } from "@/store/api/listingsApi"
import { projectInventorySummary, projectPriceRange } from "@/components/listings/project-helpers"
import { UserNavMenu } from "@/components/site/user-nav-menu"

/**
 * Developer projects, from the real API. The backend only exposes a short
 * promoted list (GET /projects/promoted — viewer's city first) plus featured
 * developers (GET /builders/featured); there's no full project catalogue or
 * search endpoint yet, so filtering here is client-side over that list.
 * Both lists are empty on the dev API today — the empty state is honest.
 */
export function ProjectsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useNav((s) => s.user)
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const { data: projects = [], isLoading, isError, refetch } = useGetPromotedProjectsQuery()
  const { data: builders = [] } = useGetFeaturedBuildersQuery()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    // Projects carry no developer name, only builderProfileId — so a search
    // for a developer (e.g. from the homepage "Featured developers" row,
    // which links here with ?q=<name>) matches through the builders list.
    const matchingBuilderIds = new Set(builders.filter((b) => b.displayName.toLowerCase().includes(q)).map((b) => b._id))
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        `${p.locality} ${p.city}`.toLowerCase().includes(q) ||
        (!!p.builderProfileId && matchingBuilderIds.has(p.builderProfileId)),
    )
  }, [projects, builders, query])

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => router.push(ROUTES.home)}
              className="grid h-10 w-10 place-items-center border border-brand-border-light text-brand-secondary hover:bg-brand-surface"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="hidden h-10 w-10 shrink-0 place-items-center bg-gradient-to-br from-brand-primary via-brand-primary to-gold-700 shadow-md sm:grid">
              <span className="font-serif text-lg font-bold text-brand-secondary">V</span>
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-xl font-bold text-brand-secondary">Developer Projects</h1>
              <p className="hidden text-xs text-brand-secondary/55 sm:block">New launches &amp; ongoing developments, direct from builders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.tier === "V" && (
              <button
                onClick={() => router.push(ROUTES.newProject)}
                aria-label="List a project"
                className="flex items-center gap-1.5 bg-ink-black px-3 py-2 text-xs font-bold text-brand-primary hover:bg-brand-secondary sm:px-4"
              >
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">List a project</span>
              </button>
            )}
            {user ? (
              <UserNavMenu user={user} className="text-brand-secondary" />
            ) : (
              <button
                onClick={() => router.push(ROUTES.loginWithReturn(ROUTES.projects))}
                className="border border-brand-border-light px-3 py-2 text-sm font-bold text-brand-secondary hover:bg-brand-surface sm:px-4"
              >
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-brand-border-light bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by project, developer or location..."
              aria-label="Search projects"
              className="w-full border border-brand-border-light bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {builders.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-lg font-bold text-brand-secondary">Featured developers</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {builders.map((b) => (
                <div key={b._id} className="flex items-center gap-3 border border-brand-border-light bg-card px-4 py-3">
                  {b.logoUrl ? (
                    <img src={b.logoUrl} alt={`${b.displayName} logo`} className="h-9 w-9 object-contain" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center bg-ink-black font-serif text-sm font-bold text-brand-primary">
                      {b.displayName.charAt(0)}
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-1 text-sm font-bold text-brand-secondary">
                      {b.displayName}
                      {b.badge && <BadgeCheck className="h-3.5 w-3.5 text-brand-primary-dark" />}
                    </div>
                    {b.city && <div className="text-xs text-brand-secondary/55">{b.city}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-bold text-brand-secondary">Promoted projects</h2>
          {!isLoading && <span className="text-xs text-brand-secondary/55">{filtered.length} project{filtered.length === 1 ? "" : "s"}</span>}
        </div>

        {isLoading ? (
          <div className="mt-4 bg-card p-10 text-center text-sm text-brand-secondary/60">Loading projects…</div>
        ) : isError ? (
          <div className="mt-4 bg-card p-10 text-center text-sm text-brand-secondary/60">
            Couldn&apos;t load projects.{" "}
            <button onClick={() => refetch()} className="font-bold text-brand-primary-dark underline">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-4 border border-dashed border-brand-border-light bg-card p-12 text-center">
            <Layers3 className="mx-auto h-8 w-8 text-brand-primary-dark" />
            <p className="mt-3 font-serif text-lg font-bold text-brand-secondary">
              {projects.length === 0 ? "No promoted projects right now" : "No projects match your search"}
            </p>
            <p className="mt-1 text-sm text-brand-secondary/60">
              {projects.length === 0
                ? "New developer launches appear here as builders promote them. Meanwhile, browse individual listings."
                : "Try a different name or location."}
            </p>
            <button
              onClick={() => router.push(ROUTES.properties)}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-primary-dark hover:text-brand-secondary"
            >
              Browse properties <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => {
              const summary = projectInventorySummary(p)
              return (
                <motion.button
                  key={p._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(ROUTES.projectDetail(p._id))}
                  className="group overflow-hidden bg-card text-left shadow-sm ring-1 ring-brand-border-light hover:ring-brand-primary/50"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={placeholderImages("apartment", p._id)[0]}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 font-serif text-lg font-bold text-white">{projectPriceRange(p)}</div>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-serif text-lg font-bold text-brand-secondary">{p.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-secondary/55">
                      <MapPin className="h-3 w-3" /> {[p.locality, p.city].filter(Boolean).join(", ")}
                    </p>
                    <div className="mt-3 flex items-center gap-3 border-t border-brand-border-light pt-3 text-[11px] text-brand-secondary/70">
                      {summary.bhks.length > 0 && <span>{summary.bhks.map((b) => `${b} BHK`).join(" · ")}</span>}
                      <span>{summary.available} units available</span>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
