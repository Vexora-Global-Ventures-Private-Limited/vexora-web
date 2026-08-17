// VXP — Dashboard mock data.
// Drives the Mercury / Jupiter / Venus dashboards, advertiser dashboard, and
// reports module. All data is shaped exactly per the scope doc.

import type { Tier } from "@/lib/nav-store"
import { useContactStore, type SubmittedLead } from "@/lib/contact-store"
import { properties, type Property } from "@/lib/vxp-data"

// ──────────────────────────────────────────────────────────────────────────
// LISTINGS
// ──────────────────────────────────────────────────────────────────────────

export type Listing = {
  id: string
  /** The public property this listing corresponds to — use this (not `id`) to link to /properties/[id]. */
  propertyId: string
  title: string
  location: string
  city: string
  price: string
  pricePerSqft: string
  beds: number
  baths: number
  area: string
  type: "Apartment" | "Villa" | "Penthouse" | "Commercial" | "Plot"
  status: "Ready to Move" | "Under Construction"
  /** Optional — seeded listings predate this field, so it's honestly absent rather than defaulted. */
  purpose?: "Sale" | "Rent"
  priority: "Sponsored" | "Featured" | "Organic"
  verified: boolean
  image: string
  /** Additional photos beyond the cover `image` — parity with Property.galleryImages. */
  galleryImages?: string[]
  developer?: string
  furnishing?: "Furnished" | "Semi-Furnished" | "Unfurnished"
  facing?: string
  transactionType?: "New" | "Resale"
  reraRegistered?: boolean
  /** Omitted when reraRegistered is false. */
  reraNumber?: string
  /** Omitted when reraRegistered is false. */
  reraUrl?: string
  amenities?: string[]
  /** The rest of the fields the public property page's "Area & configuration"
   *  and "Property details" sections show — parity with PropertyTransparency
   *  (vxp-data.ts) so a self-added listing can render the same rich detail
   *  page as the seeded catalog, not a stripped-down version of it. All
   *  optional/honestly-absent, same as `developer`/`facing` above. */
  carpetAreaSqft?: number
  balconies?: number
  hasPoojaRoom?: boolean
  /** Omitted for villas/plots, where a floor number doesn't apply. */
  floorNumber?: number
  totalFloors?: number
  overlooking?: string
  possession?: string
  ownership?: string
  flooring?: string
  widthOfFacingRoad?: string
  parking?: string
  powerBackup?: "Full" | "Partial" | "None"
  keyHighlights?: string[]
  views: number
  enquiries: number
  contactsUnlocked: number
  createdAt: string
}

/** Listings stay live for 90 days from creation before they need renewing. */
export const LISTING_VALIDITY_DAYS = 90

/** Derives a listing's expiry status from `createdAt` — used by the My Listings cards and the owner toolbar on the property page. */
export function getListingExpiry(listing: Listing) {
  const expiresAt = new Date(listing.createdAt)
  expiresAt.setDate(expiresAt.getDate() + LISTING_VALIDITY_DAYS)
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
  const expired = daysLeft < 0
  const tone: "success" | "warning" | "danger" = expired ? "danger" : daysLeft <= 14 ? "warning" : "success"
  const label = expired
    ? `Expired ${Math.abs(daysLeft)}d ago`
    : daysLeft === 0
      ? "Expires today"
      : `Expires in ${daysLeft}d`
  return { expiresAt, daysLeft, expired, tone, label }
}

/**
 * Renders a self-added `Listing` (My Listings / addListing) through the same
 * rich public property page as the seeded catalog, instead of a stripped-down
 * view. `areaSqft` on `Property` is the super built-up figure (matches the
 * seeded catalog's own numbers, e.g. p1's `areaSqft: 2840` ===
 * `transparency.superBuiltupArea: "2,840 sq.ft..."`); built-up area is
 * estimated at 98% of that (the seeded catalog's own built-up/super-built-up
 * ratio) since sellers aren't asked for it separately — only carpet area,
 * which RERA actually mandates disclosing and which the transparency panel's
 * efficiency bar depends on.
 */
export function listingToProperty(listing: Listing): Property {
  const areaSqft = Number(listing.area.replace(/[^\d]/g, "")) || 0
  const carpetAreaSqft = listing.carpetAreaSqft ?? Math.round(areaSqft * 0.7)
  const builtupAreaSqft = Math.round(areaSqft * 0.98)
  const fmtSqft = (n: number) => `${n.toLocaleString("en-IN")} sq.ft`
  const postedOn = new Date(listing.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return {
    id: listing.propertyId || listing.id,
    title: listing.title,
    location: listing.location,
    city: listing.city,
    price: listing.price,
    priceCr: Number(listing.price.replace(/[^\d.]/g, "")) || 0,
    pricePerSqft: listing.pricePerSqft,
    beds: listing.beds,
    baths: listing.baths,
    area: listing.area,
    areaSqft,
    type: listing.type,
    status: listing.status,
    purpose: listing.purpose ?? "Sale",
    amenities: listing.amenities ?? [],
    priority: listing.priority,
    tags: [],
    image: listing.image,
    galleryImages: listing.galleryImages?.length ? listing.galleryImages : [listing.image],
    developer: listing.developer,
    developerVerified: listing.verified,
    transparency: {
      reraRegistered: listing.reraRegistered ?? false,
      reraNumber: listing.reraNumber,
      reraUrl: listing.reraUrl,
      superBuiltupArea: listing.area,
      builtupArea: fmtSqft(builtupAreaSqft),
      carpetArea: fmtSqft(carpetAreaSqft),
      builtupAreaSqft,
      carpetAreaSqft,
      balconies: listing.balconies ?? 0,
      hasPoojaRoom: listing.hasPoojaRoom ?? false,
      floorNumber: listing.floorNumber,
      totalFloors: listing.totalFloors,
      facing: listing.facing || "Not specified",
      overlooking: listing.overlooking || "Not specified",
      possession: listing.possession || (listing.status === "Ready to Move" ? "Ready to move" : "To be announced"),
      postedOn,
      transactionType: listing.transactionType ?? "New",
      ownership: listing.ownership || "Freehold",
      flooring: listing.flooring || "Not specified",
      furnishing: listing.furnishing ?? "Unfurnished",
      widthOfFacingRoad: listing.widthOfFacingRoad || "Not specified",
      parking: listing.parking || "Not specified",
      powerBackup: listing.powerBackup ?? "None",
      keyHighlights: listing.keyHighlights ?? [],
      viewedThisWeek: listing.views,
      contactedThisWeek: listing.enquiries,
    },
    sellerMembershipActive: true,
    segment: "Residence",
  }
}

// Only p1 and p6 are actually this demo user's own listings -- the other
// four public-catalog properties (p2-p5) belong to other developers/brokers
// and must NOT show owner controls or a "My Listings" breadcrumb on their
// detail pages. Previously this array aliased all six public properties,
// which made every single property in the catalog register as "owned by
// you" -- including flagship listings from five unrelated developers.
export const myListings: Listing[] = [
  {
    id: "L-2841", propertyId: "p1", title: "Lodha Bellevue — 4 BHK Sky Residence", location: "Worli, Mumbai", city: "Mumbai",
    price: "₹ 12.5 Cr", pricePerSqft: "₹ 68,420/sq.ft", beds: 4, baths: 5, area: "2,840 sq.ft",
    type: "Penthouse", status: "Under Construction", priority: "Sponsored", verified: true,
    image: "/images/prop-penthouse-marina.png", developer: "Lodha Group", views: 18420, enquiries: 312, contactsUnlocked: 48, createdAt: "2026-04-12",
  },
  {
    id: "L-2846", propertyId: "p6", title: "Hiranandani Estate — Signature Villa", location: "Thane West, Thane", city: "Thane",
    price: "₹ 6.8 Cr", pricePerSqft: "₹ 24,500/sq.ft", beds: 5, baths: 6, area: "2,920 sq.ft",
    type: "Villa", status: "Ready to Move", priority: "Organic", verified: false,
    image: "/images/prop-villa-emirates.png", developer: "Hiranandani Group", views: 3940, enquiries: 72, contactsUnlocked: 8, createdAt: "2026-03-10",
  },
]

// ──────────────────────────────────────────────────────────────────────────
// LEADS — exact pipeline per scope doc §5
// Jupiter: New → Contacted → Follow-up → Site Visit → Negotiation → Booking → Closed / Lost
// Venus:   New → Contacted → Qualified  → Site Visit → Negotiation → Booking → Closed
// ──────────────────────────────────────────────────────────────────────────

export type LeadStage =
  | "New" | "Contacted" | "Follow-up" | "Qualified"
  | "Site Visit" | "Negotiation" | "Booking" | "Closed" | "Lost"

/** Status-pill tone per stage — shared by the leads list/board and the lead detail sheet. */
export const STAGE_TONE: Record<LeadStage, "success" | "warning" | "danger" | "info" | "neutral"> = {
  New: "info",
  Contacted: "info",
  Qualified: "warning",
  "Follow-up": "warning",
  "Site Visit": "warning",
  Negotiation: "warning",
  Booking: "success",
  Closed: "success",
  Lost: "danger",
}

export type Lead = {
  id: string
  name: string
  phone: string
  property: string
  propertyId: string
  source: "Property Click" | "Contact Request" | "Callback Request" | "Site Visit" | "Listing Enquiry" | "Sponsored Property Click" | "Advertisement Click"
  stage: LeadStage
  assignedTo: string
  createdAt: string
  notes: string
  /**
   * Decided once, at creation, from the seller's membership state at that
   * instant — never recomputed except by release. Existing seeded leads are
   * all historical/delivered; only buyer-submitted demo leads (via
   * contact-store) can come through undelivered.
   */
  delivered: boolean
}

export const leads: Lead[] = [
  { id: "LD-9842", name: "Rohan Malhotra", phone: "+91 98200 11234", property: "Lodha Bellevue · Worli", propertyId: "L-2841", source: "Sponsored Property Click", stage: "Site Visit", assignedTo: "Anjali Iyer", createdAt: "2h ago", notes: "Wants sea-facing 4 BHK, budget ₹12-15 Cr.", delivered: true },
  { id: "LD-9841", name: "Vikram Shah", phone: "+91 98200 22345", property: "Runwal Sanctuary · Goregaon", propertyId: "L-2842", source: "Listing Enquiry", stage: "Negotiation", assignedTo: "Anjali Iyer", createdAt: "5h ago", notes: "Negotiating on ₹8.9Cr asking, willing to pay ₹8.5Cr.", delivered: true },
  { id: "LD-9840", name: "Priya Reddy", phone: "+91 98200 33456", property: "Sobha Dream Acres · Bengaluru", propertyId: "L-2844", source: "Property Click", stage: "Contacted", assignedTo: "Anjali Iyer", createdAt: "8h ago", notes: "First call done, prefers 3BHK with study.", delivered: true },
  { id: "LD-9839", name: "Aditya Nair", phone: "+91 98200 44567", property: "Godrej Prana · Pune", propertyId: "L-2843", source: "Advertisement Click", stage: "New", assignedTo: "Anjali Iyer", createdAt: "1d ago", notes: "Just submitted enquiry via home banner.", delivered: true },
  { id: "LD-9838", name: "Sneha Kapoor", phone: "+91 98200 55678", property: "Prestige Jindal · Bengaluru", propertyId: "L-2845", source: "Callback Request", stage: "Follow-up", assignedTo: "Anjali Iyer", createdAt: "1d ago", notes: "Callback scheduled for tomorrow 11am.", delivered: true },
  { id: "LD-9837", name: "Karthik Iyer", phone: "+91 98200 66789", property: "Lodha Bellevue · Worli", propertyId: "L-2841", source: "Contact Request", stage: "Booking", assignedTo: "Anjali Iyer", createdAt: "2d ago", notes: "Token of ₹10L received, paperwork in progress.", delivered: true },
  { id: "LD-9836", name: "Meera Joshi", phone: "+91 98200 77890", property: "Hiranandani Estate · Thane", propertyId: "L-2846", source: "Site Visit", stage: "Closed", assignedTo: "Anjali Iyer", createdAt: "3d ago", notes: "Deal closed at ₹6.8Cr — full payment.", delivered: true },
  { id: "LD-9835", name: "Arjun Gupta", phone: "+91 98200 88901", property: "Runwal Sanctuary · Goregaon", propertyId: "L-2842", source: "Listing Enquiry", stage: "Lost", assignedTo: "Anjali Iyer", createdAt: "4d ago", notes: "Lost to competitor — price too high.", delivered: true },
  { id: "LD-9834", name: "Nisha Agarwal", phone: "+91 98200 99012", property: "Godrej Prana · Pune", propertyId: "L-2843", source: "Property Click", stage: "New", assignedTo: "Anjali Iyer", createdAt: "4d ago", notes: "New lead, awaiting first contact.", delivered: true },
  { id: "LD-9833", name: "Rahul Deshpande", phone: "+91 98200 10123", property: "Sobha Dream Acres · Bengaluru", propertyId: "L-2844", source: "Sponsored Property Click", stage: "Contacted", assignedTo: "Anjali Iyer", createdAt: "5d ago", notes: "WhatsApp sent, awaiting response.", delivered: true },
  // Undelivered seed example — Hiranandani's seller (L-2846) has a lapsed
  // membership; the lead was created but never reached the seller inbox.
  { id: "LD-9832", name: "Kabir Malhotra", phone: "+91 98200 20234", property: "Hiranandani Estate · Thane", propertyId: "L-2846", source: "Contact Request", stage: "New", assignedTo: "Anjali Iyer", createdAt: "6d ago", notes: "Enquiry received while seller membership was lapsed.", delivered: false },
]

const CHANNEL_TO_SOURCE: Record<SubmittedLead["channel"], Lead["source"]> = {
  call: "Contact Request",
  whatsapp: "Contact Request",
  callback: "Callback Request",
  site_visit: "Site Visit",
  enquiry_form: "Listing Enquiry",
}

function submittedLeadToLead(sl: SubmittedLead): Lead {
  const property = properties.find((p) => p.id === sl.propertyId)
  return {
    id: sl.id,
    name: sl.buyerName,
    phone: sl.buyerPhone,
    property: property ? `${property.title.split(" — ")[0]} · ${property.city}` : sl.propertyId,
    propertyId: sl.propertyId,
    source: CHANNEL_TO_SOURCE[sl.channel],
    stage: "New",
    assignedTo: "Unassigned",
    createdAt: "Just now",
    notes: `Submitted via ${sl.channel.replace("_", " ")} from the property detail page.`,
    delivered: sl.delivered,
  }
}

/**
 * Merges the static seeded leads with any buyer-submitted demo leads from
 * `contact-store` (newest first), so a lead created via the live contact hub
 * actually shows up in the seller CRM dashboards.
 */
export function getMergedLeads(): Lead[] {
  const submitted = useContactStore.getState().submittedLeads.map(submittedLeadToLead)
  return [...submitted.reverse(), ...leads]
}

export const leadPipelineJupiter = [
  { stage: "New", count: 42, color: "#bd9935" },
  { stage: "Contacted", count: 28, color: "#bd9935" },
  { stage: "Follow-up", count: 18, color: "#a8851d" },
  { stage: "Site Visit", count: 11, color: "#816720" },
  { stage: "Negotiation", count: 6, color: "#6b5d3f" },
  { stage: "Booking", count: 3, color: "#3a2c08" },
  { stage: "Closed", count: 14, color: "#0a0a0a" },
] as const

export const leadPipelineVenus = [
  { stage: "New", count: 18, color: "#bd9935" },
  { stage: "Contacted", count: 14, color: "#bd9935" },
  { stage: "Qualified", count: 9, color: "#a8851d" },
  { stage: "Site Visit", count: 6, color: "#816720" },
  { stage: "Negotiation", count: 4, color: "#6b5d3f" },
  { stage: "Booking", count: 2, color: "#3a2c08" },
  { stage: "Closed", count: 8, color: "#0a0a0a" },
] as const

export const leadSources = [
  { source: "Property Click", count: 4280, share: 34 },
  { source: "Contact Request", count: 2140, share: 17 },
  { source: "Sponsored Property Click", count: 1980, share: 16 },
  { source: "Listing Enquiry", count: 1620, share: 13 },
  { source: "Callback Request", count: 1340, share: 11 },
  { source: "Site Visit", count: 720, share: 6 },
  { source: "Advertisement Click", count: 480, share: 3 },
]

// ──────────────────────────────────────────────────────────────────────────
// ADVERTISEMENTS — exact 5 types per scope doc §3
// ──────────────────────────────────────────────────────────────────────────

export type AdType = "Home Banner" | "City Advertisement" | "Featured Developer" | "Project Promotion" | "Sponsored Properties"
export type AdStatus = "Draft" | "Pending Payment" | "Under Review" | "Approved" | "Live" | "Rejected" | "Paused" | "Completed"

export type Ad = {
  id: string
  type: AdType
  headline: string
  placement: string
  package: string
  price: string
  status: AdStatus
  impressions: number
  clicks: number
  ctr: string
  startDate: string
  endDate: string
  /** The banner image every ad campaign uploads in step 3 of the promote wizard
   *  (promote-page.tsx — "Banner image, JPG/PNG, 1920×600px"). Every ad has one;
   *  this is what actually renders wherever the ad slot shows up on the live site. */
  bannerImage: string
  /** Set when `status === "Rejected"`. Rejected ads resubmit free on the same order — no second payment. */
  rejectionReason?: string
}

const GODREJ_LAUNCH_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"

export const myAds: Ad[] = [
  { id: "AD-101", type: "Home Banner", headline: "Lodha Elite Towers — Launching in Thane", placement: "VXP home page, top fold", package: "Professional · 30 days", price: "₹ 18,999", status: "Live", impressions: 84200, clicks: 2840, ctr: "3.37%", startDate: "2026-06-01", endDate: "2026-07-01", bannerImage: "/images/prop-penthouse-marina.png" },
  { id: "AD-102", type: "City Advertisement", headline: "Runwal Sanctuary — Mumbai Spotlight", placement: "Mumbai search results", package: "Starter · 7 days", price: "₹ 4,999", status: "Live", impressions: 12400, clicks: 380, ctr: "3.06%", startDate: "2026-06-15", endDate: "2026-06-22", bannerImage: "/images/prop-villa-palm.png" },
  { id: "AD-103", type: "Featured Developer", headline: "Lodha Group — Developer Profile", placement: "Developers section + profile", package: "Enterprise · 90 days", price: "₹ 49,999", status: "Under Review", impressions: 0, clicks: 0, ctr: "—", startDate: "2026-06-26", endDate: "2026-09-26", bannerImage: "/images/prop-penthouse-marina.png" },
  { id: "AD-104", type: "Project Promotion", headline: "Godrej Horizon Greens — Virtual Tour + Brochure", placement: "Dedicated project page", package: "Professional · 30 days", price: "₹ 18,999", status: "Pending Payment", impressions: 0, clicks: 0, ctr: "—", startDate: "—", endDate: "—", bannerImage: GODREJ_LAUNCH_IMAGE },
  { id: "AD-105", type: "Sponsored Properties", headline: "Lodha Bellevue — Sponsored Boost", placement: "Top of listings + search", package: "Starter · 7 days", price: "₹ 4,999", status: "Approved", impressions: 0, clicks: 0, ctr: "—", startDate: "—", endDate: "—", bannerImage: "/images/prop-penthouse-marina.png" },
  { id: "AD-106", type: "Home Banner", headline: "Hiranandani Estate — Thane Launch", placement: "VXP home page, top fold", package: "Starter · 7 days", price: "₹ 4,999", status: "Completed", impressions: 18600, clicks: 540, ctr: "2.90%", startDate: "2026-05-20", endDate: "2026-05-27", bannerImage: "/images/prop-villa-emirates.png" },
  { id: "AD-107", type: "City Advertisement", headline: "Sobha Sentosa — Bengaluru", placement: "Bengaluru search results", package: "Professional · 30 days", price: "₹ 18,999", status: "Paused", impressions: 9200, clicks: 280, ctr: "3.04%", startDate: "2026-06-10", endDate: "2026-07-10", bannerImage: "/images/prop-apt-downtown.png" },
  { id: "AD-108", type: "Project Promotion", headline: "Prestige Skyline Heights — Brochure Launch", placement: "Dedicated project page", package: "Starter · 7 days", price: "₹ 4,999", status: "Rejected", impressions: 0, clicks: 0, ctr: "—", startDate: "—", endDate: "—", bannerImage: "/images/prop-penthouse-bizbay.png", rejectionReason: "Brochure PDF failed virus scan — please re-upload a clean file." },
  { id: "AD-109", type: "City Advertisement", headline: "Lodha Elite Towers — Thane Spotlight", placement: "Thane search results", package: "Professional · 30 days", price: "₹ 18,999", status: "Live", impressions: 15800, clicks: 512, ctr: "3.24%", startDate: "2026-06-20", endDate: "2026-07-20", bannerImage: "/images/prop-penthouse-marina.png" },
  { id: "AD-110", type: "City Advertisement", headline: "Godrej Horizon Greens — Pune Spotlight", placement: "Pune search results", package: "Starter · 7 days", price: "₹ 4,999", status: "Live", impressions: 8100, clicks: 246, ctr: "3.04%", startDate: "2026-07-02", endDate: "2026-07-09", bannerImage: GODREJ_LAUNCH_IMAGE },
  { id: "AD-111", type: "Featured Developer", headline: "Runwal Group — Developer Profile", placement: "Developers section + profile", package: "Enterprise · 90 days", price: "₹ 49,999", status: "Live", impressions: 26400, clicks: 890, ctr: "3.37%", startDate: "2026-05-15", endDate: "2026-08-13", bannerImage: "/images/prop-villa-palm.png" },
  { id: "AD-112", type: "Sponsored Properties", headline: "Sobha Sentosa — Sponsored Boost", placement: "Top of listings + search", package: "Professional · 30 days", price: "₹ 18,999", status: "Live", impressions: 21300, clicks: 705, ctr: "3.31%", startDate: "2026-06-05", endDate: "2026-07-05", bannerImage: "/images/prop-apt-downtown.png" },
  { id: "AD-113", type: "Project Promotion", headline: "Sobha Sentosa — Virtual Tour + Brochure", placement: "Dedicated project page", package: "Professional · 30 days", price: "₹ 18,999", status: "Live", impressions: 11200, clicks: 364, ctr: "3.25%", startDate: "2026-06-18", endDate: "2026-07-18", bannerImage: "/images/prop-apt-downtown.png" },
  { id: "AD-114", type: "Home Banner", headline: "Godrej Horizon Greens — Pre-Launch Offer", placement: "VXP home page, top fold", package: "Enterprise · 90 days", price: "₹ 49,999", status: "Approved", impressions: 0, clicks: 0, ctr: "—", startDate: "—", endDate: "—", bannerImage: GODREJ_LAUNCH_IMAGE },
  { id: "AD-115", type: "City Advertisement", headline: "Prestige Skyline Heights — Bengaluru", placement: "Bengaluru search results", package: "Starter · 7 days", price: "₹ 4,999", status: "Under Review", impressions: 0, clicks: 0, ctr: "—", startDate: "2026-07-08", endDate: "2026-07-15", bannerImage: "/images/prop-penthouse-bizbay.png" },
  { id: "AD-116", type: "Sponsored Properties", headline: "Hiranandani Estate — Signature Villa Boost", placement: "Top of listings + search", package: "Starter · 7 days", price: "₹ 4,999", status: "Paused", impressions: 6400, clicks: 198, ctr: "3.09%", startDate: "2026-06-12", endDate: "2026-07-12", bannerImage: "/images/prop-villa-emirates.png" },
]

// ──────────────────────────────────────────────────────────────────────────
// ANALYTICS — Views / Calls / WhatsApp / Enquiries / Conversion
// ──────────────────────────────────────────────────────────────────────────

export const analyticsCards = [
  { label: "Profile Views", value: 18420, change: "+12.4%", icon: "eye" as const },
  { label: "Calls Received", value: 824, change: "+8.1%", icon: "phone" as const },
  { label: "WhatsApp Clicks", value: 1240, change: "+24.7%", icon: "whatsapp" as const },
  { label: "Enquiries", value: 412, change: "+18.9%", icon: "mail" as const },
]

export const conversionFunnel = [
  { stage: "Profile Views", count: 18420, pct: 100 },
  { stage: "Property Clicks", count: 6240, pct: 34 },
  { stage: "Enquiries", count: 412, pct: 2.2 },
  { stage: "Site Visits", count: 86, pct: 0.5 },
  { stage: "Bookings", count: 14, pct: 0.08 },
]

// ──────────────────────────────────────────────────────────────────────────
// REPORTS — exact 6 types per scope doc §8
// ──────────────────────────────────────────────────────────────────────────

export type ReportType = {
  id: string
  name: string
  desc: string
  icon: "leads" | "membership" | "advertisement" | "listing" | "performance" | "payment"
  period: string
  rows: number
}

export const reportTypes: ReportType[] = [
  { id: "R-01", name: "Lead Report", desc: "My leads by source, stage & property", icon: "leads", period: "Last 30 days", rows: 122 },
  { id: "R-02", name: "Billing Report", desc: "My subscription, renewal history & receipts", icon: "membership", period: "Last 90 days", rows: 6 },
  { id: "R-03", name: "Advertisement Report", desc: "My ad performance, impressions, clicks, CTR, ROI", icon: "advertisement", period: "Last 30 days", rows: 8 },
  { id: "R-04", name: "Listing Report", desc: "My listings by status, tier & verification", icon: "listing", period: "Last 30 days", rows: 28 },
  { id: "R-05", name: "Performance Report", desc: "Views, calls, WhatsApp, enquiries, conversion", icon: "performance", period: "Last 30 days", rows: 6 },
  { id: "R-06", name: "Ad Payment Report", desc: "My ad payments, GST invoices & refund history", icon: "payment", period: "Last 90 days", rows: 8 },
]

// ──────────────────────────────────────────────────────────────────────────
// F11 — referrals (BR-34). Reward is membership extension days only — no
// cashback (mirrors VXA's G8 `referral_reward_days` config, default 30).
// ──────────────────────────────────────────────────────────────────────────

export const REFERRAL_REWARD_DAYS = 30

export type Referral = {
  id: string
  referred: string
  joined: string
  status: "Joined" | "Pending"
  rewardDays: number
}

export const referrals: Referral[] = [
  { id: "RF-01", referred: "Rohan Malhotra", joined: "2026-06-20", status: "Joined", rewardDays: REFERRAL_REWARD_DAYS },
  { id: "RF-02", referred: "Priya Reddy", joined: "2026-06-18", status: "Joined", rewardDays: REFERRAL_REWARD_DAYS },
  { id: "RF-03", referred: "Aditya Nair", joined: "—", status: "Pending", rewardDays: 0 },
  { id: "RF-04", referred: "Sneha Kapoor", joined: "2026-06-10", status: "Joined", rewardDays: REFERRAL_REWARD_DAYS },
]
