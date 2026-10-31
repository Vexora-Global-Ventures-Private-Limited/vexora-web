import { HOMEPAGE_IMAGES } from "@/lib/homepage-images"
import type { Property } from "@/lib/vxp-data"
import type { SearchDocument } from "@/store/api/searchApi"

/**
 * Adapters from real API payloads to the UI shapes the prototype's
 * components were built around, so screens can switch data sources without
 * rewriting their markup.
 */

/** ₹ from paise, Indian-style: "₹ 1.25 Cr", "₹ 85 L", "₹ 45,000". */
export function formatPaise(paise: number | null | undefined): string {
  if (!paise) return "Price on request"
  const rupees = paise / 100
  if (rupees >= 1e7) return `₹ ${trimNum(rupees / 1e7)} Cr`
  if (rupees >= 1e5) return `₹ ${trimNum(rupees / 1e5)} L`
  return `₹ ${rupees.toLocaleString("en-IN")}`
}

function trimNum(n: number) {
  return Number(n.toFixed(2)).toString()
}

/** ₹ from crores, same style as formatPaise — "₹ 1.2 Cr", "₹ 50 L". */
export function formatCr(cr: number): string {
  return formatPaise(Math.round(cr * 1e7 * 100))
}

export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100)
}

export function crToPaise(cr: number) {
  return Math.round(cr * 1e7 * 100)
}

/**
 * Listings carry no photos in search/detail responses yet, so every API
 * card gets a stock image picked by property type. Deterministic per
 * listing id so a card never flickers between images.
 */
const PLACEHOLDERS: Record<string, string[]> = {
  apartment: [HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.apartmentInterior, HOMEPAGE_IMAGES.penthouse],
  villa: [HOMEPAGE_IMAGES.villa, HOMEPAGE_IMAGES.luxuryResidence, HOMEPAGE_IMAGES.estate],
  plot: [HOMEPAGE_IMAGES.landPlot],
  commercial: [HOMEPAGE_IMAGES.commercialTower, HOMEPAGE_IMAGES.commercialRetail],
  office: [HOMEPAGE_IMAGES.commercialInterior, HOMEPAGE_IMAGES.commercialTower],
  warehouse: [HOMEPAGE_IMAGES.commercialRetail],
}

export function placeholderImages(propertyType: string, seed: string): string[] {
  const pool = PLACEHOLDERS[propertyType] ?? PLACEHOLDERS.apartment
  const offset = [...seed].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % pool.length
  return [...pool.slice(offset), ...pool.slice(0, offset)]
}

const TYPE_LABEL: Record<string, Property["type"]> = {
  apartment: "Apartment",
  villa: "Villa",
  plot: "Plot",
  commercial: "Commercial",
  office: "Commercial",
  warehouse: "Commercial",
}

export function propertyTypeLabel(apiType: string): string {
  return apiType ? apiType.charAt(0).toUpperCase() + apiType.slice(1) : "Property"
}

const RANK_PRIORITY: Record<number, Property["priority"]> = { 0: "Sponsored", 1: "Featured", 2: "Organic", 3: "Organic" }

/** "Bandra West, Mumbai" — skips the empty strings test data legitimately has. */
export function formatLocation(doc: Pick<SearchDocument, "locality" | "sub_locality" | "city" | "state">): string {
  return [doc.sub_locality, doc.locality, doc.city].filter(Boolean).join(", ") || doc.state || "Location not specified"
}

/**
 * SearchDocument → the prototype's Property card shape.
 *
 * `id` is the listing id (what shortlists/leads take); `slug` is what the
 * public detail route takes — always link with ROUTES.propertyDetail(slug).
 * Fields the API simply doesn't have (baths, amenities, transparency, RERA)
 * are left empty/omitted rather than invented. Photos: real ones first
 * (backend added `photos` 2026-10-31), stock placeholder only when a
 * listing genuinely has none uploaded yet.
 */
export function searchDocToProperty(doc: SearchDocument): Property & { slug: string; sellerId: string; badges: string[] } {
  const images = doc.photos && doc.photos.length > 0 ? doc.photos : placeholderImages(doc.property_type, doc.id)
  const priceCr = doc.price ? doc.price / 100 / 1e7 : 0
  const isCommercial = ["commercial", "office", "warehouse"].includes(doc.property_type)
  return {
    id: doc.id,
    slug: doc.slug,
    sellerId: doc.seller_id,
    badges: doc.badges ?? [],
    title: doc.title,
    location: formatLocation(doc),
    city: doc.city,
    // Rent is a monthly figure — say so, so ₹ 45,000 isn't read as a sale price.
    price: doc.price ? `${formatPaise(doc.price)}${doc.purpose === "rent" ? " /month" : ""}` : "Price on request",
    priceCr,
    // Per-sq.ft is a sale metric; a monthly rent per sq.ft would mislead.
    pricePerSqft:
      doc.price && doc.area_sqft && doc.purpose !== "rent"
        ? `₹ ${Math.round(doc.price / 100 / doc.area_sqft).toLocaleString("en-IN")}/sq.ft`
        : undefined,
    beds: doc.bhk ?? 0,
    baths: 0,
    area: doc.area_sqft ? `${doc.area_sqft.toLocaleString("en-IN")} sq.ft` : "—",
    areaSqft: doc.area_sqft ?? 0,
    type: TYPE_LABEL[doc.property_type] ?? "Apartment",
    status: "Ready to Move",
    purpose: doc.purpose === "rent" ? "Rent" : "Sale",
    amenities: [],
    priority: RANK_PRIORITY[doc.rank_bucket] ?? "Organic",
    tags: [
      ...(doc.rank_bucket === 0 ? ["Sponsored"] : doc.rank_bucket === 1 ? ["Featured"] : []),
      ...(doc.badges?.includes("verified_developer") ? ["Verified Developer"] : doc.badges?.includes("verified") ? ["Verified"] : []),
    ],
    image: images[0],
    galleryImages: images,
    developerVerified: doc.badges?.length > 0,
    segment: isCommercial ? "Commercial" : doc.property_type === "plot" ? "Land & Luxury Villa" : "Residence",
  }
}

export type ApiProperty = ReturnType<typeof searchDocToProperty>

/** Display copy stored alongside a shortlisted listing id — see shortlist-store.ts `snapshots`. */
export function toShortlistSnapshot(p: ApiProperty) {
  return {
    title: p.title,
    location: p.location,
    price: p.price,
    image: p.image,
    meta: [p.beds ? `${p.beds} BHK` : null, p.areaSqft ? p.area : null, p.type].filter(Boolean).join(" · "),
    href: `/properties/${p.slug}`,
  }
}

/** Suggestions are built server-side as "<title> — <locality>, <city>" and print a literal "undefined" when locality is missing. */
export function cleanSuggestion(s: string) {
  return s
    .replace(/\bundefined,\s*/g, "")
    .replace(/,\s*undefined\b/g, "")
    .replace(/\s—\s*(undefined)?\s*$/, "")
}
