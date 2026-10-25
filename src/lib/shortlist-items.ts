import { projectPriceRangeCr, type Project } from "@/lib/projects-data"
import { HOMEPAGE_IMAGES } from "@/lib/homepage-images"
import type { ShortlistSnapshot } from "@/lib/shortlist-store"
import { ROUTES } from "@/lib/routes"

export type ShortlistItem = {
  kind: "property" | "project"
  id: string
  title: string
  location: string
  price: string
  image: string
  meta: string
  /** null for a listing saved on another device — no slug is known to link to. */
  href: string | null
}

const isListingId = (id: string) => /^[a-f0-9]{24}$/i.test(id)

/** Resolves shortlisted ids (real listings + local projects share one store)
 *  into a single display-ready list, in the order they were added. Listings
 *  render from the snapshot taken when they were hearted (the API has no
 *  "listing by id" lookup); one without a snapshot — saved on another
 *  device — gets a generic row instead of being silently dropped. Leftover
 *  ids from the old mock catalog ("p1"…) are skipped. */
export function buildShortlistItems(
  shortlistedIds: string[],
  snapshots: Record<string, ShortlistSnapshot>,
  allProjects: Project[],
): ShortlistItem[] {
  return shortlistedIds
    .map((id): ShortlistItem | null => {
      if (isListingId(id)) {
        const snap = snapshots[id]
        if (snap) return { kind: "property", id, ...snap }
        return {
          kind: "property",
          id,
          title: "Saved listing",
          location: "Saved on another device",
          price: "—",
          image: HOMEPAGE_IMAGES.apartmentInterior,
          meta: "Open it again on the device you saved it from, or browse to find it",
          href: null,
        }
      }
      const project = allProjects.find((p) => p.id === id)
      if (project) {
        const { min, max } = projectPriceRangeCr(project)
        return {
          kind: "project",
          id: project.id,
          title: project.name,
          location: project.location,
          price: min === max ? `₹ ${min} Cr` : `₹ ${min} – ${max} Cr`,
          image: project.coverImage,
          meta: `${project.configurations.length} configuration${project.configurations.length === 1 ? "" : "s"}`,
          href: ROUTES.projectDetail(project.id),
        }
      }
      return null
    })
    .filter((x): x is ShortlistItem => x !== null)
}
