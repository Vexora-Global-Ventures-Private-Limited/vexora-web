"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, Building2, MapPin } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { getApiErrorCode } from "@/lib/api-error"
import { placeholderImages } from "@/lib/api-mappers"
import { useGetBuilderBySlugQuery } from "@/store/api/listingsApi"
import { projectInventorySummary, projectPriceRange } from "@/components/listings/project-helpers"

const SAFE_HTTPS = (url: string | undefined) => {
  if (!url) return false
  try {
    return new URL(url.trim()).protocol === "https:"
  } catch {
    return false
  }
}

const BADGE_LABEL: Record<string, string> = { verified: "Verified", verified_developer: "Verified Developer" }

/**
 * Public builder (developer) page — GET /builders/:slug. The backend returns
 * two different payloads: an anonymous visitor gets a teaser (name, logo,
 * badge, city, project count), a signed-in user gets the full profile with
 * its projects. So the signed-out state is a real "sign in to see the
 * projects" view, not the same page with things hidden client-side.
 *
 * Every field beyond the name is treated as optional — no builder profile
 * exists on dev yet, so the exact shape couldn't be checked live.
 */
export function BuilderDetail({ slug }: { slug: string }) {
  const router = useRouter()
  const { user } = useNav()
  const { data: builder, isLoading, isFetching, error, refetch } = useGetBuilderBySlugQuery(slug)

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-6 py-24 text-center text-sm text-brand-muted-foreground">Loading developer…</div>
  }

  const code = getApiErrorCode(error)
  if (error && (!code || code === "INTERNAL")) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">Couldn&apos;t load this developer</h1>
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

  if (error || !builder) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">Developer not found</h1>
        <p className="mt-2 text-sm text-brand-muted-foreground">This developer page doesn&apos;t exist or is no longer public.</p>
        <button onClick={() => router.push(ROUTES.projects)} className="btn-gold relative mt-6 overflow-hidden px-5 py-2.5 text-sm font-bold">
          <span className="relative z-10">Browse projects</span>
        </button>
      </div>
    )
  }

  const name = builder.displayName?.trim() || "Developer"
  const projects = builder.projects ?? []
  const projectCount = builder.projectCount ?? (builder.projects ? projects.length : undefined)
  const badge = builder.badge ? BADGE_LABEL[builder.badge] ?? null : null
  const signedIn = !!user?.id

  return (
    <div className="min-h-screen bg-card">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <button
            onClick={() => (window.history.length > 1 ? router.back() : router.push(ROUTES.projects))}
            className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {SAFE_HTTPS(builder.logoUrl) ? (
            <img src={builder.logoUrl!.trim()} alt="" referrerPolicy="no-referrer" className="h-20 w-20 shrink-0 rounded-xl border border-brand-border bg-card object-contain p-2" />
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-secondary to-ink-deep font-serif text-3xl font-bold text-brand-primary" aria-hidden>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="break-words font-serif text-3xl font-bold text-brand-secondary sm:text-4xl">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-brand-secondary/70">
              {builder.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-primary-dark" aria-hidden /> {builder.city}
                </span>
              )}
              {typeof projectCount === "number" && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-brand-primary-dark" aria-hidden /> {projectCount} project{projectCount === 1 ? "" : "s"}
                </span>
              )}
              {badge && (
                <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                  <BadgeCheck className="h-4 w-4" aria-hidden /> {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {builder.about && (
          <p className="mt-8 whitespace-pre-line break-words text-sm leading-relaxed text-brand-secondary/75">{builder.about}</p>
        )}

        <h2 className="mt-10 font-serif text-xl font-bold text-brand-secondary">Projects</h2>
        {!signedIn ? (
          <div className="mt-4 border border-dashed border-brand-border p-6 text-center">
            <p className="text-sm text-brand-secondary/70">Sign in to see this developer&apos;s projects and live inventory.</p>
            <button
              onClick={() => router.push(ROUTES.loginWithReturn(ROUTES.builderDetail(slug)))}
              className="btn-gold relative mt-4 overflow-hidden px-5 py-2.5 text-sm font-bold"
            >
              <span className="relative z-10">Sign in</span>
            </button>
          </div>
        ) : projects.length === 0 ? (
          <p className="mt-3 text-sm text-brand-muted-foreground">This developer hasn&apos;t published any projects yet.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((p) => {
              const summary = projectInventorySummary(p)
              return (
                <a
                  key={p._id}
                  href={ROUTES.projectDetail(p._id)}
                  className="group block overflow-hidden border border-brand-border bg-card transition-colors hover:border-brand-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <div className="relative h-36 overflow-hidden">
                    <img src={placeholderImages("apartment", p._id)[0]} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute right-2 top-2 bg-ink-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/85">
                      Representative photo
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="break-words font-serif text-lg font-bold text-brand-secondary">{p.name}</div>
                    <div className="mt-0.5 text-xs text-brand-secondary/60">{[p.locality, p.city].filter(Boolean).join(", ")}</div>
                    <div className="mt-2 flex flex-wrap gap-x-3 text-xs text-brand-secondary/75">
                      <span>{projectPriceRange(p)}</span>
                      <span>
                        {summary.available} of {summary.units} units available
                      </span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
