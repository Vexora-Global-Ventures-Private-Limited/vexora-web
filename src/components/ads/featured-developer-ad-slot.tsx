"use client"

import { ArrowUpRight, Star } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { HOMEPAGE_IMAGES } from "@/lib/homepage-images"
import { useGetFeaturedBuildersQuery } from "@/store/api/listingsApi"

/**
 * Kept for callers that de-duplicate a featured developer out of an organic
 * list. Real featured developers come from GET /builders/featured (async —
 * see the slot below), and the prototype's organic developer lists are
 * static names that never match them, so there's nothing to de-duplicate.
 */
export function findFeaturedDeveloperName(_developerNames: string[]): string | null {
  return null
}

/**
 * "Featured Developer" slot — GET /builders/featured (public). A builder is
 * featured when an admin approves their paid `featured` ad, which flips
 * `builder_profiles.isFeatured`. Renders nothing when no builder is
 * featured — never a placeholder sponsor.
 */
export function FeaturedDeveloperAdSlot({ dark = false }: { developerNames?: string[]; dark?: boolean }) {
  const router = useRouter()
  const { data: builders } = useGetFeaturedBuildersQuery()
  const builder = builders?.[0]
  if (!builder) return null

  return (
    <button
      onClick={() => router.push(builder.slug ? ROUTES.builderDetail(builder.slug) : ROUTES.projects)}
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
          <div className={"truncate font-serif text-lg font-bold " + (dark ? "text-white" : "text-brand-secondary")}>{builder.displayName}</div>
          {builder.city && <div className={"text-xs " + (dark ? "text-white/50" : "text-brand-secondary/55")}>{builder.city}</div>}
        </div>
      </div>
      <span
        className={
          "hidden shrink-0 items-center gap-1 pr-2 text-xs font-bold sm:flex " +
          (dark ? "text-brand-primary-light group-hover:text-white" : "text-brand-primary-dark group-hover:text-brand-secondary")
        }
      >
        View projects <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
      <img
        src={builder.logoUrl || HOMEPAGE_IMAGES.commercialTower}
        alt=""
        className="h-24 w-40 shrink-0 object-cover sm:h-28 sm:w-52"
      />
    </button>
  )
}
