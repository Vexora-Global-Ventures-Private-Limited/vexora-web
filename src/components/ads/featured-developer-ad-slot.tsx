"use client"

import { ArrowUpRight, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { myAds } from "@/lib/dashboard-data"
import { projects } from "@/lib/projects-data"
import { ROUTES } from "@/lib/routes"

/**
 * Finds the Live Featured Developer ad (if any) matching one of the given
 * developer names, and returns the exact developer name it promotes. Shared
 * by the ad slot itself and by callers that need to de-duplicate that same
 * developer out of an organic list rendered alongside the slot.
 */
export function findFeaturedDeveloperName(developerNames: string[]): string | null {
  const ad = myAds.find(
    (a) => a.type === "Featured Developer" && a.status === "Live" && developerNames.some((name) => a.headline.startsWith(name)),
  )
  return ad ? ad.headline.split(" — ")[0].trim() : null
}

/**
 * "Featured Developer" ad slot — placement "Developers section + dedicated
 * page" per the ad-type program. Only renders when a Live Featured Developer
 * ad matches one of the developers actually active in this city (never a
 * generic/unrelated sponsor, and never a placeholder when there's no match).
 */
export function FeaturedDeveloperAdSlot({ developerNames, dark = false }: { developerNames: string[]; dark?: boolean }) {
  const router = useRouter()
  const ad = myAds.find(
    (a) => a.type === "Featured Developer" && a.status === "Live" && developerNames.some((name) => a.headline.startsWith(name)),
  )
  if (!ad) return null

  const developerName = ad.headline.split(" — ")[0].trim()
  const matchedProject = projects.find((p) => p.developer === developerName)
  const destination = matchedProject ? ROUTES.projectDetail(matchedProject.id) : ROUTES.projects

  return (
    <button
      onClick={() => router.push(destination)}
      className={
        "group flex w-full items-center justify-between gap-4 overflow-hidden border text-left " +
        (dark
          ? "border-brand-primary/40 bg-gradient-to-r from-brand-primary/15 to-transparent hover:border-brand-primary/70"
          : "border-brand-primary bg-gradient-to-r from-brand-primary/15 to-transparent hover:border-brand-primary/70")
      }
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 py-4 pl-5">
        <span className="flex shrink-0 items-center gap-1 bg-brand-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-black">
          <Star className="h-3 w-3 fill-ink-black" /> Featured
        </span>
        <div className="min-w-0">
          <div className={"truncate font-serif text-lg font-bold " + (dark ? "text-white" : "text-brand-secondary")}>{developerName}</div>
          <div className={"text-xs " + (dark ? "text-white/50" : "text-brand-secondary/55")}>{ad.placement}</div>
        </div>
      </div>
      <span
        className={
          "hidden shrink-0 items-center gap-1 pr-2 text-xs font-bold sm:flex " +
          (dark ? "text-brand-primary-light group-hover:text-white" : "text-brand-primary-dark group-hover:text-brand-secondary")
        }
      >
        View profile <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
      <img
        src={ad.bannerImage}
        alt={developerName}
        className="h-24 w-40 shrink-0 object-cover sm:h-28 sm:w-52"
      />
    </button>
  )
}
