import { properties } from "@/lib/vxp-data"
import { projectPriceRangeCr, type Project } from "@/lib/projects-data"
import { ROUTES } from "@/lib/routes"

export type ShortlistItem = {
  kind: "property" | "project"
  id: string
  title: string
  location: string
  price: string
  image: string
  meta: string
  href: string
}

/** Resolves shortlisted ids (properties + projects share one store, ids
 *  never collide — "p*" vs "prj*") into a single display-ready list, in the
 *  order they were added. Used by the dashboard Shortlist tab and both
 *  buyer-dashboard "Shortlisted" widgets so the mixed list only gets built once. */
export function buildShortlistItems(shortlistedIds: string[], allProjects: Project[]): ShortlistItem[] {
  return shortlistedIds
    .map((id): ShortlistItem | null => {
      const property = properties.find((p) => p.id === id)
      if (property) {
        return {
          kind: "property",
          id: property.id,
          title: property.title,
          location: property.location,
          price: property.price,
          image: property.image,
          meta: `${property.beds} Bed · ${property.baths} Bath`,
          href: ROUTES.propertyDetail(property.id),
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
