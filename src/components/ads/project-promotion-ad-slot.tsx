"use client"

import { ArrowUpRight, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { HOMEPAGE_IMAGES } from "@/lib/homepage-images"
import { useGetPromotedProjectsQuery } from "@/store/api/listingsApi"

/**
 * "Project Promotion" slot — GET /projects/promoted (public; the viewer's
 * own city first). A project appears here once its paid
 * `project_promotion` ad is approved. Renders nothing when none is promoted.
 *
 * `projectId` scopes the slot to one project's own detail page (renders only
 * when that exact project is promoted). Omit it for the homepage spotlight.
 */
export function ProjectPromotionAdSlot({ projectId }: { projectId?: string }) {
  const router = useRouter()
  const { data: promoted } = useGetPromotedProjectsQuery()
  const project = projectId ? promoted?.find((p) => p._id === projectId) : promoted?.[0]
  if (!project) return null

  const card = (
    <button
      onClick={() => router.push(ROUTES.projectDetail(project._id))}
      className="group flex w-full items-center justify-between gap-4 overflow-hidden border border-brand-primary/30 bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent text-left hover:border-brand-primary/50"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-4 pl-5">
        <span className="flex w-fit shrink-0 items-center gap-1 bg-brand-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-black">
          <Play className="h-3 w-3" /> Project Spotlight
        </span>
        <div className="min-w-0">
          <div className="truncate font-serif text-base font-bold text-brand-secondary">{project.name}</div>
          <div className="text-xs text-brand-secondary/55">{[project.locality, project.city].filter(Boolean).join(", ")}</div>
        </div>
      </div>
      <span className="hidden shrink-0 items-center gap-1 pr-2 text-xs font-bold text-brand-primary-dark group-hover:text-brand-secondary sm:flex">
        View project <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
      <img src={HOMEPAGE_IMAGES.heroModernEstate} alt="" className="h-24 w-36 shrink-0 object-cover sm:h-28 sm:w-52" />
    </button>
  )

  // Scoped to a project's own detail page — inline, no extra section chrome.
  if (projectId) return card

  return (
    <section className="bg-card pb-24 sm:pb-28">
      <div className="mx-auto max-w-[90rem] px-6 sm:px-10 lg:px-16">{card}</div>
    </section>
  )
}
