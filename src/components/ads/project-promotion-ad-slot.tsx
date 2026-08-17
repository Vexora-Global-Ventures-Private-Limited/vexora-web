"use client"

import { ArrowUpRight, FileText, Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { myAds } from "@/lib/dashboard-data"
import { projects } from "@/lib/projects-data"
import { ROUTES } from "@/lib/routes"

/**
 * "Project Promotion" ad slot — placement "Dedicated project landing page"
 * per the ad-type program (AD-113 "Sobha Sentosa — Virtual Tour + Brochure"
 * is live today). Only ever claims the rich-media extras (brochure, in this
 * case) the matched project actually has on file — never an invented video
 * or virtual-tour link the project doesn't really have.
 *
 * `projectId` scopes the slot to one project's own detail page (only renders
 * when the Live ad is actually promoting that project). Omit it to get a
 * homepage-style spotlight on whichever Project Promotion ad is Live.
 */
export function ProjectPromotionAdSlot({ projectId }: { projectId?: string }) {
  const router = useRouter()
  const ad = myAds.find((a) => a.type === "Project Promotion" && a.status === "Live")
  if (!ad) return null

  const headlinePrefix = ad.headline.split(" — ")[0].trim()
  const matchedProject = projects.find((p) => p.name.startsWith(headlinePrefix))
  if (projectId && matchedProject?.id !== projectId) return null

  const destination = matchedProject ? ROUTES.projectDetail(matchedProject.id) : ROUTES.projects

  const card = (
    <button
      onClick={() => router.push(destination)}
      className="group flex w-full items-center justify-between gap-4 overflow-hidden border border-brand-primary/30 bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent text-left hover:border-brand-primary/50"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-4 pl-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex shrink-0 items-center gap-1 bg-brand-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-black">
            <Play className="h-3 w-3" /> Project Spotlight
          </span>
          {matchedProject?.brochureUrl && (
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand-primary-dark">
              <FileText className="h-3 w-3" /> Brochure available
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate font-serif text-base font-bold text-brand-secondary">{ad.headline}</div>
          <div className="text-xs text-brand-secondary/55">{ad.placement}</div>
        </div>
      </div>
      <span className="hidden shrink-0 items-center gap-1 pr-2 text-xs font-bold text-brand-primary-dark group-hover:text-brand-secondary sm:flex">
        View project <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
      <img
        src={ad.bannerImage}
        alt={ad.headline}
        className="h-24 w-36 shrink-0 object-cover sm:h-28 sm:w-52"
      />
    </button>
  )

  // Scoped to a project's own detail page — embed inline in that page's own
  // container, no extra section chrome.
  if (projectId) return card

  // Homepage/standalone usage — self-contained section, so there's zero
  // extra chrome (and zero empty band) on any page where this ad isn't live.
  return (
    <section className="bg-card pb-24 sm:pb-28">
      <div className="mx-auto max-w-[90rem] px-6 sm:px-10 lg:px-16">{card}</div>
    </section>
  )
}
