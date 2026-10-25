"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, MapPin, Pencil } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { formatPaise, placeholderImages } from "@/lib/api-mappers"
import { getApiErrorCode } from "@/lib/api-error"
import { useGetMyBuilderProfileQuery, useGetProjectQuery } from "@/store/api/listingsApi"
import {
  projectInventorySummary,
  projectPriceRange,
  UNIT_STATUS_LABEL,
} from "@/components/listings/project-helpers"

/**
 * Public project page for a real (API) project — GET /projects/:id returns
 * the project with its towers and units. Projects carry no photos, contacts
 * or amenities in the API, so this is an inventory view, not the prototype's
 * full brochure page. There's no project-enquiry endpoint either, so no
 * contact form here — buyers browse availability.
 */
export function ApiProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { user } = useNav()
  const { data: project, isLoading, isFetching, error, refetch } = useGetProjectQuery(projectId)
  // Only a Venus account can own projects; compare against its builder profile.
  const { data: myProfile } = useGetMyBuilderProfileQuery(undefined, { skip: !user?.id || user.tier !== "V" })
  const isOwner =
    !!project &&
    !!user?.id &&
    (project.ownerId === user.id || (!!myProfile && project.builderProfileId === myProfile._id))

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-6 py-24 text-center text-sm text-brand-muted-foreground">Loading project…</div>
  }

  const code = getApiErrorCode(error)
  // No code / INTERNAL = network or server failure — not "removed", offer a retry.
  if (error && (!code || code === "INTERNAL")) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">Couldn&apos;t load this project</h1>
        <p className="mt-2 text-sm text-brand-muted-foreground">Check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-gold relative mt-6 overflow-hidden px-5 py-2.5 text-sm font-bold disabled:opacity-60"
        >
          <span className="relative z-10">{isFetching ? "Retrying…" : "Retry"}</span>
        </button>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">Project not found</h1>
        <p className="mt-2 text-sm text-brand-muted-foreground">It may have been removed by the developer.</p>
        <button onClick={() => router.push(ROUTES.projects)} className="btn-gold relative mt-6 overflow-hidden px-5 py-2.5 text-sm font-bold">
          <span className="relative z-10">Browse projects</span>
        </button>
      </div>
    )
  }

  const summary = projectInventorySummary(project)
  const cover = placeholderImages("apartment", project._id)[0]

  return (
    <div className="min-h-screen bg-card">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <button
            // Opened from a shared link there's no in-app history to go back to.
            onClick={() => (window.history.length > 1 ? router.back() : router.push(ROUTES.projects))}
            className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {isOwner && (
            <button
              onClick={() => router.push(ROUTES.editProject(project._id))}
              className="flex items-center gap-1.5 border border-brand-border px-4 py-1.5 text-xs font-bold text-brand-secondary hover:bg-brand-surface"
            >
              <Pencil className="h-3.5 w-3.5" /> Manage inventory
            </button>
          )}
        </div>
      </header>

      <div className="relative h-64 overflow-hidden sm:h-80">
        <img src={cover} alt="" className="h-full w-full object-cover" />
        <span className="absolute right-3 top-3 bg-ink-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/85">
          Representative photo
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-black/80 via-ink-black/20 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 mx-auto max-w-5xl px-6 text-white">
          <h1 className="break-words font-serif text-3xl font-bold sm:text-4xl">{project.name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
            <MapPin className="h-4 w-4" /> {[project.locality, project.city].filter(Boolean).join(", ")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Price" value={projectPriceRange(project)} />
          <Stat label="Configurations" value={summary.bhks.length ? summary.bhks.map((b) => `${b} BHK`).join(", ") : "—"} />
          <Stat label="Towers" value={String(summary.towers)} />
          <Stat label="Available units" value={`${summary.available} of ${summary.units}`} />
        </div>

        {project.description && <p className="mt-6 whitespace-pre-line break-words text-sm leading-relaxed text-brand-secondary/75">{project.description}</p>}

        <h2 className="mt-10 flex items-center gap-2 font-serif text-xl font-bold text-brand-secondary">
          <Building2 className="h-5 w-5 text-brand-primary-dark" /> Inventory
        </h2>
        {(project.towers ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-brand-muted-foreground">The developer hasn&apos;t published unit inventory yet.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {(project.towers ?? []).map((tower) => (
              <div key={tower._id} className="border border-brand-border">
                <div className="flex items-center justify-between bg-brand-tertiary/50 px-4 py-2.5">
                  <span className="font-bold text-brand-secondary">{tower.name}</span>
                  <span className="text-xs text-brand-muted-foreground">{tower.floors ? `${tower.floors} floors` : ""}</span>
                </div>
                {(tower.units ?? []).length === 0 ? (
                  <p className="px-4 py-3 text-xs text-brand-muted-foreground">No units listed in this tower yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
                    {(tower.units ?? []).map((u) => (
                      <div
                        key={u._id}
                        className={
                          "border px-3 py-2 text-xs " +
                          (u.status === "available" ? "border-brand-primary/40 bg-brand-primary/5" : "border-brand-border opacity-60")
                        }
                      >
                        <div className="font-bold text-brand-secondary">Unit {u.unitNumber}</div>
                        <div className="text-brand-secondary/65">
                          {u.bhk ? `${u.bhk} BHK · ` : ""}
                          {u.areaSqft ? `${u.areaSqft.toLocaleString("en-IN")} sq.ft` : ""}
                        </div>
                        <div className="mt-1 font-semibold text-brand-secondary">{formatPaise(u.pricePaise)}</div>
                        <div className="mt-0.5 text-[10px] uppercase tracking-wide text-brand-muted-foreground">
                          {UNIT_STATUS_LABEL[u.status] ?? u.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-sheen bg-card p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-lg font-bold text-brand-secondary">{value}</div>
    </div>
  )
}
