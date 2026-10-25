import { formatPaise } from "@/lib/api-mappers"
import type { Project, Unit } from "@/store/api/listingsApi"

/** Real project ids are Mongo ObjectIds — anything else is a prototype mock id
 *  (the backend 500s on a malformed id, so never send one). */
export const isObjectId = (id: string) => /^[a-f0-9]{24}$/i.test(id)

export function projectUnits(project: Project): Unit[] {
  return (project.towers ?? []).flatMap((t) => t.units ?? [])
}

export function projectPriceRange(project: Project): string {
  const prices = projectUnits(project)
    .map((u) => u.pricePaise)
    .filter((p) => p > 0)
  if (prices.length === 0) return "Price on request"
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? formatPaise(min) : `${formatPaise(min)} – ${formatPaise(max)}`
}

export function projectInventorySummary(project: Project) {
  const units = projectUnits(project)
  return {
    towers: project.towers?.length ?? 0,
    units: units.length,
    available: units.filter((u) => u.status === "available").length,
    bhks: Array.from(new Set(units.map((u) => u.bhk).filter(Boolean))).sort((a, b) => a - b),
  }
}

export const UNIT_STATUSES = ["available", "blocked", "sold"] as const

export const UNIT_STATUS_LABEL: Record<string, string> = {
  available: "Available",
  blocked: "Blocked",
  sold: "Sold",
}
