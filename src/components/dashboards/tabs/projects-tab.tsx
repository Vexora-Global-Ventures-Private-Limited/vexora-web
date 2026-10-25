"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, ChevronRight, Layers3, Plus, Pencil, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { placeholderImages } from "@/lib/api-mappers"
import { getApiErrorCode } from "@/lib/api-error"
import { useGetBuilderBySlugQuery, useGetMyBuilderProfileQuery } from "@/store/api/listingsApi"
import { BuilderProfileForm } from "@/components/listings/builder-profile-form"
import { projectInventorySummary, projectPriceRange } from "@/components/listings/project-helpers"

/**
 * Venus "My Projects". There's no "list my projects" endpoint (GET /projects
 * isn't deployed), so the list comes from the caller's own builder page —
 * GET /builders/:slug returns the full profile + inventory when signed in.
 * No builder profile yet (GET /builders/me → null) → create one first.
 */
export function ProjectsTab() {
  const router = useRouter()
  const { user } = useNav()
  const [query, setQuery] = useState("")
  const [editingProfile, setEditingProfile] = useState(false)

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useGetMyBuilderProfileQuery(undefined, { skip: !user?.id })
  const {
    data: fullProfile,
    isLoading: projectsLoading,
    isError: projectsFailed,
    refetch: refetchProjects,
  } = useGetBuilderBySlugQuery(profile?.slug ?? "", {
    skip: !profile?.slug,
    refetchOnMountOrArgChange: true,
  })

  if (!user?.id) {
    return (
      <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
        My Projects is available for signed-in Venus accounts.
      </div>
    )
  }

  if (profileLoading) {
    return <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">Loading…</div>
  }

  const profileErrorCode = getApiErrorCode(profileError)
  if (profileErrorCode === "FORBIDDEN") {
    return (
      <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
        Projects and builder pages are part of the Venus plan.{" "}
        <button onClick={() => router.push(ROUTES.membership)} className="font-bold text-brand-primary-dark underline">
          See plans
        </button>
      </div>
    )
  }

  // Any other failure is NOT "no profile yet" — showing the create form here
  // would make the seller try to create a second profile (409).
  if (profileError) {
    return (
      <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
        Couldn&apos;t load your builder profile.{" "}
        <button onClick={() => refetchProfile()} className="font-bold text-brand-primary-dark underline">Retry</button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-5">
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">My Projects</h2>
        <BuilderProfileForm profile={null} />
      </div>
    )
  }

  const projects = fullProfile?.projects ?? profile.projects ?? []
  const filtered = projects.filter((p) => {
    const q = query.trim().toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || `${p.locality} ${p.city}`.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-secondary">My Projects</h2>
          <p className="text-sm text-brand-muted-foreground">
            {profile.displayName} · {projects.length} project{projects.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setEditingProfile((v) => !v)}
            aria-expanded={editingProfile}
            className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            {editingProfile ? "Close profile" : "Edit builder profile"}
          </button>
          <button
            onClick={() => router.push(ROUTES.projects)}
            className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            Browse all projects <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => router.push(ROUTES.newProject)}
            className="btn-gold relative flex items-center gap-1.5 overflow-hidden px-4 py-2 text-xs font-bold"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New Project
            </span>
          </button>
        </div>
      </div>

      {editingProfile && <BuilderProfileForm profile={profile} onDone={() => setEditingProfile(false)} />}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your projects by name or location..."
          aria-label="Search your projects"
          className="w-full border border-brand-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
        />
      </div>

      {projectsLoading ? (
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">Loading projects…</div>
      ) : projectsFailed ? (
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
          Couldn&apos;t load your projects.{" "}
          <button onClick={() => refetchProjects()} className="font-bold text-brand-primary-dark underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
          {projects.length === 0 ? (
            <>
              No projects yet.{" "}
              <button onClick={() => router.push(ROUTES.newProject)} className="font-bold text-brand-primary-dark underline">
                List your first project
              </button>
            </>
          ) : (
            "No projects match your search."
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => {
            const summary = projectInventorySummary(p)
            return (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-sheen group overflow-hidden bg-card"
              >
                <button onClick={() => router.push(ROUTES.projectDetail(p._id))} className="block w-full text-left">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={placeholderImages("apartment", p._id)[0]}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 font-serif text-base font-bold text-white">{projectPriceRange(p)}</div>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-serif text-base font-bold text-brand-secondary">{p.name}</h3>
                    <p className="flex items-center gap-1 truncate text-xs text-brand-secondary/55">
                      <MapPin className="h-3 w-3" /> {[p.locality, p.city].filter(Boolean).join(", ")}
                    </p>
                    <div className="mt-3 flex items-center gap-3 border-t border-brand-border pt-3 text-[11px] text-brand-secondary/70">
                      <span className="flex items-center gap-1">
                        <Layers3 className="h-3.5 w-3.5 text-brand-primary-dark" /> {summary.towers} tower{summary.towers === 1 ? "" : "s"}
                      </span>
                      <span>{summary.available} of {summary.units} units available</span>
                    </div>
                  </div>
                </button>
                <div className="flex justify-end border-t border-brand-border px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => router.push(ROUTES.editProject(p._id))}
                    className="flex items-center gap-1.5 border border-brand-border px-3 py-1 text-xs font-bold text-brand-secondary/70 hover:bg-brand-tertiary hover:text-brand-secondary"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Manage inventory
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
