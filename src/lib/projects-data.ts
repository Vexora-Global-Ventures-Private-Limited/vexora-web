// VXP — Developer "Project" listings (Venus tier).
// A Project is a distinct entity from Property: one project holds several
// sellable unit configurations at different prices, potentially several RERA
// registrations (one per phase/tower), and a roster of contacts (the builder
// plus authorized brokers) instead of a single seller. See
// src/components/pages/property-detail-page.tsx for the single-unit
// equivalent this mirrors visually but not structurally.

import { HOMEPAGE_IMAGES } from "@/lib/homepage-images"
import type { Priority } from "@/lib/vxp-data"

export type ProjectStatus = "New Launch" | "Under Construction" | "Ready to Move"

/** One priceable unit configuration in a project — the thing that replaces a
 *  Property's single price/area/beds. Each row is independently listed. */
export type ProjectConfiguration = {
  id: string
  /** Free text, not an enum — builders label configs like "3 BHK + Study". */
  type: string
  areaSqft: number
  area: string
  priceCr: number
  price: string
  pricePerSqft?: string
  /** Honest sold-out state — a config row is never hidden, just marked. */
  available: boolean
}

/** One RERA registration. A project can have several (one per phase/tower).
 *  An empty `reraRegistrations` array on the project is the honest "not yet
 *  registered" state — never an invented number. */
export type ProjectRera = {
  id: string
  label: string
  number: string
  url?: string
}

export type ProjectGalleryCategory = "Aerial / Master Plan" | "Elevation" | "Amenities"

export type ProjectGalleryImage = {
  src: string
  category: ProjectGalleryCategory
  caption?: string
}

/** One authorized point of contact — the builder, or a broker/advisor acting
 *  on the builder's behalf. `reraRegistered` is independent per contact and
 *  must be shown honestly; it is never defaulted to true. */
export type ProjectContact = {
  id: string
  name: string
  role: "Builder" | "Authorized Broker" | "Channel Partner Advisor"
  company?: string
  reraRegistered: boolean
  /** Omitted when reraRegistered is false. */
  reraNumber?: string
  phone: string
  isPrimary?: boolean
}

export type ProjectHighlight = { label: string; detail?: string }

export type Project = {
  id: string
  name: string
  developer: string
  developerVerified?: boolean
  developerMemberSince?: string
  location: string
  city: string
  status: ProjectStatus
  possessionDate: string
  zeroBrokerage?: boolean
  priority: Priority
  tags: string[]
  coverImage: string
  /** Flat photo set, parity with Property.galleryImages — first entry === coverImage. */
  galleryImages: string[]
  /** The categorized set shown on the detail page's gallery tabs. */
  gallery: ProjectGalleryImage[]
  configurations: ProjectConfiguration[]
  reraRegistrations: ProjectRera[]
  highlights: ProjectHighlight[]
  amenities: string[]
  /** Absent -> render a disabled "coming soon" affordance, never a fake download link. */
  brochureUrl?: string
  /** [0] is Builder by convention; UI still checks `isPrimary` rather than relying on order. */
  contacts: ProjectContact[]
  description: string
  viewedThisWeek: number
  interestedThisWeek: number
  pos?: number

  // Ownership / CRM — collapsed into Project itself (no separate wrapper
  // type like Property/Listing has), since only Venus users create projects.
  /** True only for projects this demo Venus user actually created/owns. */
  isMine?: boolean
  createdAt?: string
  views?: number
  enquiries?: number
  contactsUnlocked?: number
}

/** Computed, never stored — so the catalog card's price can't drift from the
 *  actual configuration rows the way a duplicated min/max scalar could. */
export function projectPriceRangeCr(project: Project): { min: number; max: number } {
  const prices = project.configurations.map((c) => c.priceCr)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

export function projectAreaRangeSqft(project: Project): { min: number; max: number } {
  const areas = project.configurations.map((c) => c.areaSqft)
  return { min: Math.min(...areas), max: Math.max(...areas) }
}

export const projects: Project[] = [
  {
    id: "prj1",
    name: "Lodha Elite Towers",
    developer: "Lodha Group",
    developerVerified: true,
    developerMemberSince: "Jan 2019",
    location: "Thane West, Thane",
    city: "Thane",
    status: "Under Construction",
    possessionDate: "Dec 2028",
    zeroBrokerage: false,
    priority: "Sponsored",
    tags: ["Sponsored", "Gated Township", "New Launch"],
    coverImage: "/images/prop-penthouse-marina.png",
    galleryImages: [
      "/images/prop-penthouse-marina.png", HOMEPAGE_IMAGES.heroModernEstate, HOMEPAGE_IMAGES.apartmentHighrise,
      HOMEPAGE_IMAGES.luxuryResidence, "/images/prop-apt-downtown.png",
    ],
    gallery: [
      { src: "/images/prop-penthouse-marina.png", category: "Aerial / Master Plan", caption: "Twin-tower master plan, aerial view" },
      { src: HOMEPAGE_IMAGES.heroModernEstate, category: "Aerial / Master Plan", caption: "25-acre township layout" },
      { src: HOMEPAGE_IMAGES.apartmentHighrise, category: "Elevation", caption: "Tower A & B facade" },
      { src: "/images/prop-apt-downtown.png", category: "Elevation", caption: "Entrance lobby elevation" },
      { src: HOMEPAGE_IMAGES.luxuryResidence, category: "Amenities", caption: "Clubhouse & infinity pool" },
    ],
    configurations: [
      { id: "CFG-3BHK", type: "3 BHK", areaSqft: 1815, area: "1,815 sq.ft", priceCr: 2.85, price: "₹ 2.85 Cr", pricePerSqft: "₹ 15,700/sq.ft", available: true },
      { id: "CFG-4BHK", type: "4 BHK", areaSqft: 2540, area: "2,540 sq.ft", priceCr: 4.1, price: "₹ 4.10 Cr", pricePerSqft: "₹ 16,140/sq.ft", available: true },
      { id: "CFG-PENT", type: "Penthouse", areaSqft: 4200, area: "4,200 sq.ft", priceCr: 8.5, price: "₹ 8.50 Cr", pricePerSqft: "₹ 20,240/sq.ft", available: false },
    ],
    reraRegistrations: [
      { id: "RERA-A", label: "Tower A", number: "P51700078901", url: "https://maharera.maharashtra.gov.in/" },
      { id: "RERA-B", label: "Tower B", number: "P51700078902", url: "https://maharera.maharashtra.gov.in/" },
    ],
    highlights: [
      { label: "25.7-acre development", detail: "Twin-tower gated township" },
      { label: "7+ acres of open green space", detail: "Landscaped gardens & jogging track" },
      { label: "Tripod tower design", detail: "Optimized for cross-ventilation & natural light" },
      { label: "Easy payment plan", detail: "20:80 construction-linked plan available" },
    ],
    amenities: ["Swimming pool", "Gym & spa", "24/7 security", "Garden terrace", "High-speed elevators", "Smart home system", "Private parking"],
    brochureUrl: "/brochures/lodha-elite-towers.pdf",
    contacts: [
      { id: "C-BUILDER", name: "Lodha Group — Sales Desk", role: "Builder", company: "Lodha Group", reraRegistered: true, reraNumber: "A51700001234", phone: "+91 22-6900-1000", isPrimary: true },
      { id: "C-B1", name: "Vikram Shah", role: "Channel Partner Advisor", company: "VXP Venus Partner", reraRegistered: true, reraNumber: "A51700005678", phone: "+91 98200 55010" },
      { id: "C-B2", name: "Next Door Realty Pvt Ltd", role: "Authorized Broker", reraRegistered: false, phone: "+91 98200 55020" },
    ],
    description:
      "Lodha Elite Towers is a twin-tower residential development in Thane West spanning 25.7 acres, with over 7 acres reserved for open green space. The tripod tower layout is designed for panoramic views and natural cross-ventilation across all configurations.",
    viewedThisWeek: 2140,
    interestedThisWeek: 34,
    pos: 1,
    isMine: true,
    createdAt: "2026-04-01",
    views: 22800,
    enquiries: 186,
    contactsUnlocked: 41,
  },
  {
    id: "prj2",
    name: "Runwal Sanctuary — Extension",
    developer: "Runwal Group",
    developerVerified: true,
    developerMemberSince: "Mar 2020",
    location: "Goregaon, Mumbai",
    city: "Mumbai",
    status: "Ready to Move",
    possessionDate: "Immediate",
    zeroBrokerage: true,
    priority: "Featured",
    tags: ["Featured", "Zero Brokerage"],
    coverImage: "/images/prop-villa-palm.png",
    galleryImages: [
      "/images/prop-villa-palm.png", HOMEPAGE_IMAGES.villa, HOMEPAGE_IMAGES.estate,
    ],
    gallery: [
      { src: "/images/prop-villa-palm.png", category: "Aerial / Master Plan", caption: "Extension block master plan" },
      { src: HOMEPAGE_IMAGES.villa, category: "Elevation", caption: "Villa row elevation" },
      { src: HOMEPAGE_IMAGES.estate, category: "Amenities", caption: "Private garden & clubhouse" },
    ],
    configurations: [
      { id: "CFG-VILLA", type: "Villa", areaSqft: 3460, area: "3,460 sq.ft", priceCr: 8.9, price: "₹ 8.9 Cr", pricePerSqft: "₹ 25,720/sq.ft", available: true },
    ],
    reraRegistrations: [
      { id: "RERA-1", label: "Extension Block", number: "P51800091234", url: "https://maharera.maharashtra.gov.in/" },
    ],
    highlights: [
      { label: "Lake-facing villa plots", detail: "Private frontage on the sanctuary lake" },
      { label: "Zero brokerage", detail: "Direct developer listing, no agent fees" },
    ],
    amenities: ["Private parking", "Garden terrace", "24/7 security", "Swimming pool"],
    // No brochure yet — rendered as a disabled "coming soon" affordance, never a fake link.
    contacts: [
      { id: "C-BUILDER", name: "Runwal Group — Sales Desk", role: "Builder", company: "Runwal Group", reraRegistered: true, reraNumber: "A51800002345", phone: "+91 22-6900-2000", isPrimary: true },
    ],
    description:
      "An extension of the existing Runwal Sanctuary community in Goregaon, offering ready-to-move lake-facing villa plots directly from the developer with zero brokerage.",
    viewedThisWeek: 860,
    interestedThisWeek: 11,
    pos: 2,
    isMine: true,
    createdAt: "2026-05-14",
    views: 5240,
    enquiries: 38,
    contactsUnlocked: 6,
  },
  {
    id: "prj3",
    name: "Godrej Horizon Greens",
    developer: "Godrej Properties",
    developerVerified: true,
    developerMemberSince: "Feb 2018",
    location: "Kharadi, Pune",
    city: "Pune",
    status: "New Launch",
    possessionDate: "Jun 2030",
    zeroBrokerage: true,
    priority: "Sponsored",
    tags: ["Sponsored", "New Launch", "Zero Brokerage"],
    coverImage: HOMEPAGE_IMAGES.heroLaunch,
    galleryImages: [
      HOMEPAGE_IMAGES.heroLaunch, HOMEPAGE_IMAGES.apartmentInterior, "/images/prop-apt-jbr.png",
    ],
    gallery: [
      { src: HOMEPAGE_IMAGES.heroLaunch, category: "Aerial / Master Plan", caption: "Pre-launch master plan render" },
      { src: HOMEPAGE_IMAGES.apartmentInterior, category: "Elevation", caption: "Sample facade render" },
      { src: "/images/prop-apt-jbr.png", category: "Amenities", caption: "Planned clubhouse render" },
    ],
    configurations: [
      { id: "CFG-2BHK", type: "2 BHK", areaSqft: 1050, area: "1,050 sq.ft", priceCr: 1.15, price: "₹ 1.15 Cr", pricePerSqft: "₹ 10,950/sq.ft", available: true },
      { id: "CFG-3BHK", type: "3 BHK", areaSqft: 1420, area: "1,420 sq.ft", priceCr: 1.68, price: "₹ 1.68 Cr", pricePerSqft: "₹ 11,830/sq.ft", available: true },
    ],
    // Honest pre-launch edge case, mirrors p5 in vxp-data.ts — nothing invented.
    reraRegistrations: [],
    highlights: [
      { label: "Pre-launch pricing", detail: "Early-bird rates before official RERA launch pricing" },
      { label: "IT-corridor location", detail: "5 minutes from Kharadi EON IT Park" },
    ],
    amenities: ["Gym & spa", "24/7 security", "Swimming pool"],
    contacts: [
      { id: "C-BUILDER", name: "Godrej Properties — Sales Desk", role: "Builder", company: "Godrej Properties", reraRegistered: false, phone: "+91 20-6900-3000", isPrimary: true },
    ],
    description:
      "Godrej Horizon Greens is a newly announced residential project in Kharadi, Pune. RERA registration is in progress ahead of the official launch — pricing shown is indicative pre-launch pricing.",
    viewedThisWeek: 1480,
    interestedThisWeek: 22,
    pos: 3,
  },
  {
    id: "prj4",
    name: "Sobha Sentosa",
    developer: "Sobha Limited",
    developerVerified: true,
    developerMemberSince: "Nov 2021",
    location: "Panathur, Bengaluru",
    city: "Bengaluru",
    status: "Ready to Move",
    possessionDate: "Immediate",
    zeroBrokerage: false,
    priority: "Featured",
    tags: ["Featured", "Verified", "Ready to Move"],
    coverImage: "/images/prop-apt-downtown.png",
    galleryImages: [
      "/images/prop-apt-downtown.png", HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.heroModernEstate,
    ],
    gallery: [
      { src: "/images/prop-apt-downtown.png", category: "Aerial / Master Plan", caption: "Completed township aerial" },
      { src: HOMEPAGE_IMAGES.apartmentHighrise, category: "Elevation", caption: "Tower facade, phase 2" },
      { src: HOMEPAGE_IMAGES.heroModernEstate, category: "Amenities", caption: "5-clubhouse network" },
    ],
    configurations: [
      { id: "CFG-3BHK", type: "3 BHK", areaSqft: 1815, area: "1,815 sq.ft", priceCr: 2.65, price: "₹ 2.65 Cr", pricePerSqft: "₹ 14,600/sq.ft", available: true },
      { id: "CFG-3BHKS", type: "3 BHK + Study", areaSqft: 1980, area: "1,980 sq.ft", priceCr: 2.98, price: "₹ 2.98 Cr", pricePerSqft: "₹ 15,050/sq.ft", available: true },
    ],
    reraRegistrations: [
      { id: "RERA-1", label: "Phase 2", number: "PRM/KA/RERA/1251/446/PR/240115/006789", url: "https://rera.karnataka.gov.in/" },
    ],
    highlights: [
      { label: "Gated township", detail: "5 clubhouses across the development" },
      { label: "Backward-integrated construction", detail: "Sobha's in-house precision engineering" },
    ],
    amenities: ["Gym & spa", "24/7 security", "Swimming pool", "Private parking"],
    brochureUrl: "/brochures/sobha-sentosa.pdf",
    contacts: [
      { id: "C-BUILDER", name: "Sobha Limited — Sales Desk", role: "Builder", company: "Sobha Limited", reraRegistered: true, reraNumber: "A52100003456", phone: "+91 80-6900-4000", isPrimary: true },
      { id: "C-B1", name: "ATS Consultancy", role: "Authorized Broker", reraRegistered: true, reraNumber: "A52100009988", phone: "+91 98450 66010" },
    ],
    description:
      "Sobha Sentosa is a ready-to-move gated township in Panathur, Bengaluru, built with Sobha's backward-integrated construction model and finished across 5 dedicated clubhouses.",
    viewedThisWeek: 1120,
    interestedThisWeek: 16,
    pos: 4,
  },
  {
    id: "prj5",
    name: "Prestige Skyline Heights",
    developer: "Prestige Group",
    developerVerified: false,
    developerMemberSince: "Jun 2024",
    location: "Tumkur Road, Bengaluru",
    city: "Bengaluru",
    status: "Under Construction",
    possessionDate: "Mar 2029",
    zeroBrokerage: false,
    priority: "Organic",
    tags: ["Under Construction"],
    coverImage: "/images/prop-penthouse-bizbay.png",
    galleryImages: [
      "/images/prop-penthouse-bizbay.png", HOMEPAGE_IMAGES.penthouse, HOMEPAGE_IMAGES.heroPenthouse,
    ],
    gallery: [
      { src: "/images/prop-penthouse-bizbay.png", category: "Aerial / Master Plan", caption: "Under-construction site aerial" },
      { src: HOMEPAGE_IMAGES.penthouse, category: "Elevation", caption: "Tower render" },
      { src: HOMEPAGE_IMAGES.heroPenthouse, category: "Amenities", caption: "Planned sky lounge render" },
    ],
    configurations: [
      { id: "CFG-2BHK", type: "2 BHK", areaSqft: 1180, area: "1,180 sq.ft", priceCr: 1.32, price: "₹ 1.32 Cr", pricePerSqft: "₹ 11,190/sq.ft", available: true },
      { id: "CFG-3BHK", type: "3 BHK", areaSqft: 1640, area: "1,640 sq.ft", priceCr: 1.85, price: "₹ 1.85 Cr", pricePerSqft: "₹ 11,280/sq.ft", available: true },
    ],
    reraRegistrations: [
      { id: "RERA-1", label: "Tower 1", number: "PRM/KA/RERA/1251/446/PR/240301/007712", url: "https://rera.karnataka.gov.in/" },
    ],
    highlights: [
      { label: "Metro connectivity", detail: "8 minutes from the upcoming Tumkur Road metro station" },
    ],
    amenities: ["24/7 security", "Private parking"],
    contacts: [
      // Every broker here is deliberately non-RERA-registered — proves the
      // per-contact badge never silently defaults to "verified".
      { id: "C-B1", name: "RTF Properties", role: "Authorized Broker", reraRegistered: false, phone: "+91 98450 77010", isPrimary: true },
      { id: "C-B2", name: "Heaven Property", role: "Authorized Broker", reraRegistered: false, phone: "+91 98450 77020" },
    ],
    description:
      "Prestige Skyline Heights is an under-construction residential tower on Tumkur Road, Bengaluru, sold exclusively through independent authorized brokers rather than a direct builder sales desk.",
    viewedThisWeek: 540,
    interestedThisWeek: 7,
    pos: 5,
  },

  // ── More developer projects — pairs with the broader city inventory added
  // to properties, so "Developer projects in {city}" and "Top developers"
  // reflect a real spread of builders rather than the same 5 repeated.
  {
    id: "prj6",
    name: "Oberoi Esquire",
    developer: "Oberoi Realty",
    developerVerified: true,
    developerMemberSince: "May 2015",
    location: "Goregaon East, Mumbai",
    city: "Mumbai",
    status: "Under Construction",
    possessionDate: "Sep 2028",
    zeroBrokerage: true,
    priority: "Organic",
    tags: ["Zero Brokerage"],
    coverImage: HOMEPAGE_IMAGES.apartmentHighrise,
    galleryImages: [HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.luxuryResidence],
    gallery: [
      { src: HOMEPAGE_IMAGES.apartmentHighrise, category: "Elevation", caption: "Tower elevation render" },
      { src: HOMEPAGE_IMAGES.luxuryResidence, category: "Amenities", caption: "Clubhouse render" },
    ],
    configurations: [
      { id: "CFG-3BHK", type: "3 BHK", areaSqft: 1690, area: "1,690 sq.ft", priceCr: 3.6, price: "₹ 3.60 Cr", pricePerSqft: "₹ 21,300/sq.ft", available: true },
    ],
    reraRegistrations: [{ id: "RERA-1", label: "Tower 1", number: "P51800056781", url: "https://maharera.maharashtra.gov.in/" }],
    highlights: [{ label: "Zero brokerage", detail: "Direct developer listing, no agent fees" }],
    amenities: ["Swimming pool", "Gym & spa", "24/7 security"],
    contacts: [{ id: "C-BUILDER", name: "Oberoi Realty — Sales Desk", role: "Builder", company: "Oberoi Realty", reraRegistered: true, reraNumber: "A51800004321", phone: "+91 22-6900-5000", isPrimary: true }],
    description: "Oberoi Esquire is an under-construction residential tower in Goregaon East, Mumbai, sold directly by the developer with zero brokerage.",
    viewedThisWeek: 690,
    interestedThisWeek: 9,
    pos: 6,
  },
  {
    id: "prj7",
    name: "Kalpataru Immensa",
    developer: "Kalpataru Group",
    developerVerified: true,
    developerMemberSince: "Sep 2016",
    location: "Thane West, Thane",
    city: "Thane",
    status: "New Launch",
    possessionDate: "Dec 2029",
    zeroBrokerage: false,
    priority: "Organic",
    tags: ["New Launch"],
    coverImage: HOMEPAGE_IMAGES.luxuryResidence,
    galleryImages: [HOMEPAGE_IMAGES.luxuryResidence, "/images/prop-apt-jbr.png"],
    gallery: [
      { src: HOMEPAGE_IMAGES.luxuryResidence, category: "Aerial / Master Plan", caption: "Pre-launch master plan render" },
      { src: "/images/prop-apt-jbr.png", category: "Elevation", caption: "Sample facade render" },
    ],
    configurations: [
      { id: "CFG-2BHK", type: "2 BHK", areaSqft: 1180, area: "1,180 sq.ft", priceCr: 1.55, price: "₹ 1.55 Cr", pricePerSqft: "₹ 13,140/sq.ft", available: true },
    ],
    reraRegistrations: [],
    highlights: [{ label: "Pre-launch pricing", detail: "Early-bird rates before official RERA launch pricing" }],
    amenities: ["24/7 security", "Private parking"],
    contacts: [{ id: "C-BUILDER", name: "Kalpataru Group — Sales Desk", role: "Builder", company: "Kalpataru Group", reraRegistered: false, phone: "+91 22-6900-6000", isPrimary: true }],
    description: "Kalpataru Immensa is a newly announced residential project in Thane West. RERA registration is in progress ahead of the official launch.",
    viewedThisWeek: 410,
    interestedThisWeek: 6,
    pos: 7,
  },
  {
    id: "prj8",
    name: "Kolte-Patil Verve",
    developer: "Kolte-Patil Developers",
    developerVerified: true,
    developerMemberSince: "Apr 2015",
    location: "Baner, Pune",
    city: "Pune",
    status: "Ready to Move",
    possessionDate: "Immediate",
    zeroBrokerage: true,
    priority: "Featured",
    tags: ["Featured", "Zero Brokerage", "Ready to Move"],
    coverImage: HOMEPAGE_IMAGES.apartmentInterior,
    galleryImages: [HOMEPAGE_IMAGES.apartmentInterior, HOMEPAGE_IMAGES.estate],
    gallery: [
      { src: HOMEPAGE_IMAGES.apartmentInterior, category: "Elevation", caption: "Completed tower facade" },
      { src: HOMEPAGE_IMAGES.estate, category: "Amenities", caption: "Landscaped podium garden" },
    ],
    configurations: [
      { id: "CFG-2BHK", type: "2 BHK", areaSqft: 1235, area: "1,235 sq.ft", priceCr: 1.15, price: "₹ 1.15 Cr", pricePerSqft: "₹ 9,310/sq.ft", available: true },
      { id: "CFG-3BHK", type: "3 BHK", areaSqft: 1650, area: "1,650 sq.ft", priceCr: 1.62, price: "₹ 1.62 Cr", pricePerSqft: "₹ 9,820/sq.ft", available: true },
    ],
    reraRegistrations: [{ id: "RERA-1", label: "Phase 1", number: "P52100067891", url: "https://maharera.maharashtra.gov.in/" }],
    highlights: [{ label: "Zero brokerage", detail: "Direct developer listing, no agent fees" }],
    amenities: ["Swimming pool", "Gym & spa", "24/7 security"],
    contacts: [{ id: "C-BUILDER", name: "Kolte-Patil Developers — Sales Desk", role: "Builder", company: "Kolte-Patil Developers", reraRegistered: true, reraNumber: "A52100005566", phone: "+91 20-6900-7000", isPrimary: true }],
    description: "Kolte-Patil Verve is a completed, ready-to-move residential development in Baner, Pune, sold directly by the developer with zero brokerage.",
    viewedThisWeek: 780,
    interestedThisWeek: 13,
    pos: 8,
  },
  {
    id: "prj9",
    name: "Brigade Meadows",
    developer: "Brigade Group",
    developerVerified: true,
    developerMemberSince: "Feb 2016",
    location: "Kanakapura Road, Bengaluru",
    city: "Bengaluru",
    status: "Under Construction",
    possessionDate: "Nov 2028",
    zeroBrokerage: false,
    priority: "Organic",
    tags: ["Under Construction"],
    coverImage: HOMEPAGE_IMAGES.apartmentHighrise,
    galleryImages: [HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.heroModernEstate],
    gallery: [
      { src: HOMEPAGE_IMAGES.apartmentHighrise, category: "Aerial / Master Plan", caption: "Township aerial render" },
      { src: HOMEPAGE_IMAGES.heroModernEstate, category: "Elevation", caption: "Tower render" },
    ],
    configurations: [
      { id: "CFG-3BHK", type: "3 BHK", areaSqft: 1810, area: "1,810 sq.ft", priceCr: 2.3, price: "₹ 2.30 Cr", pricePerSqft: "₹ 12,700/sq.ft", available: true },
    ],
    reraRegistrations: [{ id: "RERA-1", label: "Phase 3", number: "PRM/KA/RERA/1251/446/PR/240210/007345", url: "https://rera.karnataka.gov.in/" }],
    highlights: [{ label: "Integrated township", detail: "Schools, retail & clubhouse within the community" }],
    amenities: ["Swimming pool", "Gym & spa", "24/7 security"],
    contacts: [{ id: "C-BUILDER", name: "Brigade Group — Sales Desk", role: "Builder", company: "Brigade Group", reraRegistered: true, reraNumber: "A52100006677", phone: "+91 80-6900-8000", isPrimary: true }],
    description: "Brigade Meadows is an under-construction integrated township on Kanakapura Road, Bengaluru, with schools, retail and a clubhouse planned within the community.",
    viewedThisWeek: 520,
    interestedThisWeek: 8,
    pos: 9,
  },
  {
    id: "prj10",
    name: "My Home Avatar",
    developer: "My Home Group",
    developerVerified: true,
    developerMemberSince: "Mar 2015",
    location: "Narsingi, Hyderabad",
    city: "Hyderabad",
    status: "Ready to Move",
    possessionDate: "Immediate",
    zeroBrokerage: false,
    priority: "Organic",
    tags: ["Ready to Move"],
    coverImage: HOMEPAGE_IMAGES.estate,
    galleryImages: [HOMEPAGE_IMAGES.estate, HOMEPAGE_IMAGES.apartmentHighrise],
    gallery: [
      { src: HOMEPAGE_IMAGES.estate, category: "Elevation", caption: "Completed tower facade" },
      { src: HOMEPAGE_IMAGES.apartmentHighrise, category: "Amenities", caption: "Clubhouse & pool deck" },
    ],
    configurations: [
      { id: "CFG-3BHK", type: "3 BHK", areaSqft: 1795, area: "1,795 sq.ft", priceCr: 2.05, price: "₹ 2.05 Cr", pricePerSqft: "₹ 11,420/sq.ft", available: true },
    ],
    reraRegistrations: [{ id: "RERA-1", label: "Tower A", number: "P02400078912", url: "https://rera.telangana.gov.in/" }],
    highlights: [{ label: "Ready to move", detail: "Fully completed with occupancy certificate" }],
    amenities: ["Swimming pool", "Gym & spa", "24/7 security", "Private parking"],
    contacts: [{ id: "C-BUILDER", name: "My Home Group — Sales Desk", role: "Builder", company: "My Home Group", reraRegistered: true, reraNumber: "A02400001122", phone: "+91 40-6900-9000", isPrimary: true }],
    description: "My Home Avatar is a completed, ready-to-move residential tower in Narsingi, Hyderabad, with full occupancy certification.",
    viewedThisWeek: 460,
    interestedThisWeek: 7,
    pos: 10,
  },
  {
    id: "prj11",
    name: "DLF The Camellias",
    developer: "DLF",
    developerVerified: true,
    developerMemberSince: "Feb 2010",
    location: "Golf Course Road, Gurugram",
    city: "Delhi NCR",
    status: "Ready to Move",
    possessionDate: "Immediate",
    zeroBrokerage: false,
    priority: "Featured",
    tags: ["Featured", "Verified", "Ready to Move"],
    coverImage: HOMEPAGE_IMAGES.heroModernEstate,
    galleryImages: [HOMEPAGE_IMAGES.heroModernEstate, HOMEPAGE_IMAGES.luxuryResidence],
    gallery: [
      { src: HOMEPAGE_IMAGES.heroModernEstate, category: "Elevation", caption: "Tower facade" },
      { src: HOMEPAGE_IMAGES.luxuryResidence, category: "Amenities", caption: "Sky lounge & spa" },
    ],
    configurations: [
      { id: "CFG-4BHK", type: "4 BHK", areaSqft: 4400, area: "4,400 sq.ft", priceCr: 12.5, price: "₹ 12.50 Cr", pricePerSqft: "₹ 28,400/sq.ft", available: true },
    ],
    reraRegistrations: [{ id: "RERA-1", label: "Tower 1", number: "RC/REP/HARERA/GGM/876/2020/45", url: "https://haryanarera.gov.in/" }],
    highlights: [{ label: "Ultra-luxury address", detail: "One of Gurugram's most prestigious postcodes" }],
    amenities: ["Concierge service", "Swimming pool", "Gym & spa", "24/7 security", "Smart home system"],
    brochureUrl: "/brochures/dlf-the-camellias.pdf",
    contacts: [{ id: "C-BUILDER", name: "DLF — Sales Desk", role: "Builder", company: "DLF", reraRegistered: true, reraNumber: "A76500001234", phone: "+91 124-6900-1000", isPrimary: true }],
    description: "DLF The Camellias is a completed ultra-luxury residential tower on Golf Course Road, Gurugram, among the most prestigious addresses in Delhi NCR.",
    viewedThisWeek: 1340,
    interestedThisWeek: 19,
    pos: 11,
  },
]

export const PROJECT_STATUSES: ProjectStatus[] = ["New Launch", "Under Construction", "Ready to Move"]

export const PROJECT_CITIES: string[] = Array.from(new Set(projects.map((p) => p.city))).sort()

/** Real developer projects in a city — used by the city pages. */
export function projectsInCity(cityName: string): Project[] {
  return projects.filter((p) => p.city === cityName)
}
