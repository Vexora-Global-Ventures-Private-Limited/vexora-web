// VXP — India-only real estate marketplace & lead platform.
// Static marketing content (no API exists for it): city blurbs, plan bullet
// copy, ad product copy, property-type descriptions, budget buckets — plus
// the shared listing card type. Anything shown to users as if it were real
// but isn't (the testimonials below) is labelled "Sample" where it renders.
// All live numbers (listings, prices, counts) come from the API.

import { HOMEPAGE_IMAGES } from "@/lib/homepage-images"

export type Priority = "Sponsored" | "Featured" | "Organic"

/**
 * Full disclosure block shown on the property detail page — RERA status,
 * area breakdown, and every "fine print" fact a buyer would otherwise have
 * to ask the seller for. Optional so mock data can be filled in gradually,
 * but every seeded property below has one — nothing here is invented per
 * render (no random "N people viewed" churn); it's fixed mock data like
 * everything else in this file, so the same numbers show every time.
 */
export type PropertyTransparency = {
  reraRegistered: boolean
  /** Omitted when reraRegistered is false — there's nothing to show. */
  reraNumber?: string
  reraUrl?: string
  superBuiltupArea: string
  builtupArea: string
  carpetArea: string
  /** Numeric sq.ft companions to the three strings above — power the area
   *  composition bar visual (carpet is always the true livable area). */
  builtupAreaSqft: number
  carpetAreaSqft: number
  balconies: number
  hasPoojaRoom: boolean
  /** Omitted for villas/plots, where a floor number doesn't apply. */
  floorNumber?: number
  totalFloors?: number
  facing: string
  overlooking: string
  possession: string
  postedOn: string
  transactionType: "New" | "Resale"
  ownership: string
  flooring: string
  furnishing: "Furnished" | "Semi-Furnished" | "Unfurnished"
  widthOfFacingRoad: string
  parking: string
  powerBackup: "Full" | "Partial" | "None"
  keyHighlights: string[]
  viewedThisWeek: number
  contactedThisWeek: number
}

export type Property = {
  id: string
  title: string
  location: string
  city: string
  price: string
  /** Numeric price in ₹ Cr — powers real budget filtering and price sorting. */
  priceCr: number
  pricePerSqft?: string
  beds: number
  baths: number
  area: string
  /** Numeric carpet area in sq.ft, parsed from `area` — powers area-range filtering. */
  areaSqft: number
  type: "Apartment" | "Villa" | "Penthouse" | "Commercial" | "Plot"
  status: "Ready to Move" | "Under Construction"
  /** Sale vs rent — the search filter grammar's `purpose` facet. */
  purpose: "Sale" | "Rent"
  amenities: string[]
  priority: Priority
  tags: string[]
  image: string
  /** Full photo set for the gallery — uploaded by the listing's own owner/
   *  broker, not stock filler borrowed from other listings. Always includes
   *  `image` as the cover. */
  galleryImages: string[]
  developer?: string
  developerVerified?: boolean
  developerMemberSince?: string
  transparency?: PropertyTransparency
  pos?: number // display order
  /**
   * Whether the seller's membership is currently active. Decides
   * delivered vs undelivered when a buyer contacts this listing — the two
   * clocks (listing validity, membership expiry) are independent per the
   * docs, so a lapsed seller can still have a live, contactable listing.
   * Defaults to true when omitted.
   */
  sellerMembershipActive?: boolean
  /** Which header nav vertical this listing belongs to. Omitted = "Residence" (the default
   *  for every pre-existing entry below — no need to touch them). Powers the Commercial,
   *  Land & Luxury Villa, and Global Properties nav pages. */
  segment?: "Residence" | "Commercial" | "Land & Luxury Villa" | "Global"
}

export type City = {
  /** URL-safe id for /cities/[slug] — e.g. "delhi-ncr". */
  slug: string
  name: string
  image: string
  blurb: string
}

// Listing counts / starting prices are intentionally NOT stored here — every
// display site computes them live from the search API (use-city-stats), so
// they can never drift into invented numbers.
// Each `image` is that city's actual landmark (Wikimedia Commons, downloaded
// locally to public/images/) — not a generic stock property photo — so the
// city pages show something real and recognizable, not a mismatched filler shot.
export const popularCities: City[] = [
  {
    slug: "mumbai",
    name: "Mumbai",
    image: "/images/city-mumbai-gateway-of-india.jpg",
    blurb: "South Mumbai sea-front towers to Bandra-Worli skyline residences.",
  },
  {
    slug: "thane",
    name: "Thane",
    image: "/images/city-thane-hiranandani-estate.jpg",
    blurb: "Lake-city living with new-launch inventory from Lodha & Hiranandani.",
  },
  {
    slug: "pune",
    name: "Pune",
    image: "/images/city-pune-shaniwar-wada.jpg",
    blurb: "Koregaon Park luxury to Hinjewadi IT-corridor apartments.",
  },
  {
    slug: "bengaluru",
    name: "Bengaluru",
    image: "/images/city-bengaluru-vidhana-soudha.jpg",
    blurb: "Indiranagar bungalows to Whitefield tech-park residences.",
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    image: "/images/city-hyderabad-charminar.jpg",
    blurb: "Jubilee Hills villas to Financial District premium towers.",
  },
  {
    slug: "delhi-ncr",
    name: "Delhi NCR",
    image: "/images/city-delhi-india-gate.jpg",
    blurb: "Lutyens' bungalows to Gurugram Golf Course Road penthouses.",
  },
]

export function getCityBySlug(slug: string): City | undefined {
  return popularCities.find((c) => c.slug === slug)
}

export type MembershipTier = {
  code: "M" | "J" | "V"
  name: string
  tagline: string
  price: string
  duration: string
  audience: string
  purpose: string
  listings: number
  accent: string
  features: string[]
  leadFeatures?: string[]
  crmModules?: string[]
  popular?: boolean
}

export const membershipTiers: MembershipTier[] = [
  {
    code: "M",
    name: "Mercury",
    tagline: "Entry-level referral & listing membership",
    price: "₹ 299",
    duration: "3 months",
    audience: "Students · Housewives · Freelancers · Owners",
    purpose: "Earn through referrals and list up to 2 properties.",
    listings: 2,
    accent: "from-[#bd9935] to-[#a8851d]",
    features: [
      "Refer & earn 30 extension days",
      "Upload up to 2 listings",
      "Photos, videos, floor plans, maps",
      "Description, amenities, area, price",
      "Contact number on each listing",
      "Smart Match notifications",
      "Customer enquiries & visit requests",
      "Follow-up alerts",
      "2 free contacts unlocked for unpaid users",
    ],
    leadFeatures: [
      "Smart Match notifications",
      "Customer enquiries",
      "Visit requests",
      "Follow-up alerts",
    ],
  },
  {
    code: "J",
    name: "Jupiter",
    tagline: "Broker CRM + Lead Management",
    price: "₹ 2,999",
    duration: "6 months",
    audience: "Brokers · Channel Partners · Agencies · Consultants",
    purpose: "Run your entire brokerage on one CRM with 30 listings.",
    listings: 30,
    accent: "from-[#bd9935] to-[#816720]",
    features: [
      "30 verified listings",
      "Manual Verified Badge (admin-reviewed)",
      "Full CRM with buyers, sellers, investors",
      "Notes, meetings, follow-ups",
      "Lead Management with pipeline",
      "Analytics: views, calls, WhatsApp, enquiries",
      "Conversion reports",
      "Co-broking with other Jupiter partners",
    ],
    crmModules: ["Buyers", "Sellers", "Investors", "Notes", "Meetings"],
    popular: true,
  },
  {
    code: "V",
    name: "Venus",
    tagline: "Business dashboard + inventory + premium leads",
    price: "₹ 4,999",
    duration: "6 months",
    audience: "Developers · Builders · Investors · Banks · NBFCs",
    purpose: "Executive dashboard for inventory, leads and campaigns.",
    listings: 100,
    accent: "from-[#816720] to-[#3a2c08]",
    features: [
      "Business login with role-based access",
      "Executive dashboard",
      "Inventory: Projects → Towers → Units",
      "Full CRM with lead tracking",
      "Lead Pipeline: New → Closed",
      "Campaign analytics & ROI tracking",
      "100 verified listings",
      "Priority placement in lead distribution",
      "Dedicated account manager",
    ],
  },
]

export type AdType = {
  code: string
  name: string
  example: string
  placement: string
  audience: string
  icon: string
}

export const adTypes: AdType[] = [
  {
    code: "01",
    name: "Home Banner",
    example: "Lodha Elite Towers — Launching in Thane",
    placement: "VXP home page, top fold",
    audience: "All visitors",
    icon: "banner",
  },
  {
    code: "02",
    name: "City Advertisement",
    example: "Search → Thane → Sponsored developer appears",
    placement: "City-specific search results",
    audience: "All visitors searching that city",
    icon: "map-pin",
  },
  {
    code: "03",
    name: "Featured Developer",
    example: "Lodha · Runwal — Click → Developer Profile",
    placement: "Developers section + dedicated page",
    audience: "All visitors",
    icon: "building",
  },
  {
    code: "04",
    name: "Project Promotion",
    example: "Video · Brochure · Photos · Virtual Tour · CTA",
    placement: "Dedicated project landing page",
    audience: "All visitors, with rich media",
    icon: "play",
  },
  {
    code: "05",
    name: "Sponsored Properties",
    example: "Sponsored → Featured → Organic ordering",
    placement: "Top of listings & search results",
    audience: "All visitors browsing listings",
    icon: "crown",
  },
]

export type Testimonial = {
  name: string
  role: string
  city: string
  quote: string
  rating: number
  initials: string
}

// MOCK / SAMPLE DATA — fictional testimonials. Shown under a "Sample
// testimonials" label; replace with real customer quotes or remove before
// launch (vexora-web UNRESOLVED #48).
export const testimonials: Testimonial[] = [
  {
    name: "Rohan Malhotra",
    role: "Closed a Worli sea-facing penthouse",
    city: "Mumbai",
    initials: "RM",
    quote:
      "VXP's sponsored inventory showed me three sea-facing penthouses I'd never have found on the other portals. The lead went straight to Lodha's sales head, and we closed in 14 days. The transparency on price-per-square-foot made the negotiation painless.",
    rating: 5,
  },
  {
    name: "Anjali Iyer",
    role: "Jupiter Partner · Independent Broker",
    city: "Bengaluru",
    initials: "AI",
    quote:
      "The Jupiter CRM replaced three separate tools I was paying for. The lead pipeline alone — New → Contacted → Site Visit → Closed — keeps my team honest about follow-ups. My conversion rate is up 38% in the first quarter.",
    rating: 5,
  },
  {
    name: "Vikram Shah",
    role: "Venus Partner · Channel Partner, Godrej",
    city: "Pune",
    initials: "VS",
    quote:
      "As a Venus partner, I get inventory-level access — Projects, Towers, Units — and the campaign analytics show me exactly which project ad is converting. No more guessing. The dedicated account manager picks up on the second ring.",
    rating: 5,
  },
]

export type AdvertiserAudience = {
  label: string
}

export const advertiserAudiences: AdvertiserAudience[] = [
  { label: "Property Owners" },
  { label: "Brokers" },
  { label: "Developers" },
  { label: "Builders" },
  { label: "Agencies" },
  { label: "Businesses" },
  { label: "Investors" },
  { label: "Interior Brands" },
  { label: "Banks" },
  { label: "NBFCs" },
]

export type PropertyType = {
  name: string
  count: string
  icon: string
  desc: string
}

export const propertyTypes: PropertyType[] = [
  { name: "Luxury Flats", count: "84,920 listings", icon: "building", desc: "High-rise & designer residences" },
  { name: "Farmhouse", count: "4,680 listings", icon: "home", desc: "Estate homes beyond the city" },
  { name: "Land / Plot", count: "6,210 listings", icon: "map", desc: "Residential & commercial land" },
  { name: "Rent", count: "18,340 listings", icon: "key", desc: "Furnished & unfurnished leases" },
  { name: "New Projects", count: "2,940 launches", icon: "sparkles", desc: "Pre-launch & under-construction" },
]

// ──────────────────────────────────────────────────────────────────────────
// SEARCH & FILTER — shared definitions so the hero search console, the
// "Ways of living" landing rows, and /properties all agree on the same
// buckets/mappings instead of each inventing its own.
// ──────────────────────────────────────────────────────────────────────────

export type BudgetBucket = { id: string; label: string; min: number; max: number }

export const BUDGET_BUCKETS: BudgetBucket[] = [
  { id: "under-1", label: "Under ₹ 1 Cr", min: 0, max: 1 },
  { id: "1-3", label: "₹ 1 – 3 Cr", min: 1, max: 3 },
  { id: "3-10", label: "₹ 3 – 10 Cr", min: 3, max: 10 },
  { id: "10-plus", label: "₹ 10 Cr +", min: 10, max: Infinity },
]

/**
 * Price slider range on /properties (₹ Cr). Fixed — it used to be derived
 * from the prototype's mock listings; the top end means "and above".
 */
export const PRICE_RANGE_CR = { min: 0, max: 50 }
