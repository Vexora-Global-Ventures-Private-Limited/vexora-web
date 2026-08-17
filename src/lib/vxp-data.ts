// VXP — India-only real estate marketplace & lead platform.
// Mock data covering all product surfaces from the scope doc:
// properties, cities, developers, memberships, ad types, lead pipeline, testimonials.

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

// Sponsored → Featured → Organic, exactly as the scope doc prescribes.
export const properties: Property[] = [
  {
    id: "p1",
    title: "Lodha Bellevue — 4 BHK Sky Residence",
    location: "Worli, Mumbai",
    city: "Mumbai",
    price: "₹ 12.5 Cr",
    priceCr: 12.5,
    pricePerSqft: "₹ 68,420/sq.ft",
    beds: 4,
    baths: 5,
    area: "2,840 sq.ft",
    areaSqft: 2840,
    type: "Penthouse",
    status: "Under Construction",
    purpose: "Sale",
    amenities: ["Sea view", "Concierge service", "Smart home system", "High-speed elevators", "24/7 security"],
    priority: "Sponsored",
    tags: ["Sponsored", "Sea View", "Concierge"],
    image: HOMEPAGE_IMAGES.penthouse,
    galleryImages: [
      HOMEPAGE_IMAGES.penthouse, HOMEPAGE_IMAGES.heroPenthouse, HOMEPAGE_IMAGES.apartmentInterior,
      HOMEPAGE_IMAGES.luxuryResidence, HOMEPAGE_IMAGES.heroModernEstate,
    ],
    developer: "Lodha Group",
    developerVerified: true,
    developerMemberSince: "Jan 2019",
    transparency: {
      reraRegistered: true,
      reraNumber: "P51800012345",
      reraUrl: "https://maharera.maharashtra.gov.in/",
      superBuiltupArea: "2,840 sq.ft (263.9 sq.m.)",
      builtupArea: "2,790 sq.ft (259.2 sq.m.)",
      carpetArea: "1,985 sq.ft (184.4 sq.m.)",
      builtupAreaSqft: 2790,
      carpetAreaSqft: 1985,
      balconies: 3,
      hasPoojaRoom: true,
      floorNumber: 38,
      totalFloors: 42,
      facing: "West",
      overlooking: "Sea",
      possession: "Dec 2027",
      postedOn: "Jun 18, 2026",
      transactionType: "New",
      ownership: "Freehold",
      flooring: "Marble",
      furnishing: "Unfurnished",
      widthOfFacingRoad: "40 Feet",
      parking: "2 Covered",
      powerBackup: "Full",
      keyHighlights: ["Sea-facing residence", "Private elevator lobby", "24/7 concierge & security", "Smart home automation"],
      viewedThisWeek: 1842,
      contactedThisWeek: 14,
    },
    pos: 1,
  },
  {
    id: "p2",
    title: "Runwal Sanctuary — Lake-Facing Villa",
    location: "Goregaon, Mumbai",
    city: "Mumbai",
    price: "₹ 8.9 Cr",
    priceCr: 8.9,
    pricePerSqft: "₹ 32,140/sq.ft",
    beds: 5,
    baths: 6,
    area: "3,460 sq.ft",
    areaSqft: 3460,
    type: "Villa",
    status: "Ready to Move",
    purpose: "Sale",
    amenities: ["Private parking", "Garden terrace", "24/7 security", "Swimming pool"],
    priority: "Sponsored",
    tags: ["Sponsored", "Private Garden", "Lake View"],
    image: HOMEPAGE_IMAGES.villa,
    galleryImages: [
      HOMEPAGE_IMAGES.villa, HOMEPAGE_IMAGES.heroTwilightVilla, HOMEPAGE_IMAGES.estate,
      HOMEPAGE_IMAGES.apartmentInterior, HOMEPAGE_IMAGES.heroModernEstate,
    ],
    developer: "Runwal Group",
    developerVerified: true,
    developerMemberSince: "Mar 2020",
    transparency: {
      reraRegistered: true,
      reraNumber: "P51800023456",
      reraUrl: "https://maharera.maharashtra.gov.in/",
      superBuiltupArea: "3,460 sq.ft (321.5 sq.m.)",
      builtupArea: "3,400 sq.ft (315.9 sq.m.)",
      carpetArea: "2,440 sq.ft (226.7 sq.m.)",
      builtupAreaSqft: 3400,
      carpetAreaSqft: 2440,
      balconies: 2,
      hasPoojaRoom: true,
      facing: "North",
      overlooking: "Lake, Garden",
      possession: "Immediate",
      postedOn: "May 30, 2026",
      transactionType: "New",
      ownership: "Freehold",
      flooring: "Vitrified Tiles",
      furnishing: "Unfurnished",
      widthOfFacingRoad: "30 Feet",
      parking: "3 Covered",
      powerBackup: "Full",
      keyHighlights: ["Private lake frontage", "Independent villa plot", "Landscaped garden terrace", "Gated community security"],
      viewedThisWeek: 1120,
      contactedThisWeek: 9,
    },
    pos: 2,
  },
  {
    id: "p3",
    title: "Godrej Prana — Sky Penthouse with Deck",
    location: "Undri, Pune",
    city: "Pune",
    price: "₹ 4.75 Cr",
    priceCr: 4.75,
    pricePerSqft: "₹ 18,650/sq.ft",
    beds: 4,
    baths: 5,
    area: "2,540 sq.ft",
    areaSqft: 2540,
    type: "Penthouse",
    status: "Under Construction",
    purpose: "Sale",
    amenities: ["Sea view", "Smart home system", "Gym & spa", "High-speed elevators"],
    priority: "Featured",
    tags: ["Featured", "Verified", "Sky Deck"],
    image: HOMEPAGE_IMAGES.luxuryResidence,
    galleryImages: [
      HOMEPAGE_IMAGES.luxuryResidence, HOMEPAGE_IMAGES.heroPenthouse, HOMEPAGE_IMAGES.penthouse,
      HOMEPAGE_IMAGES.apartmentInterior, HOMEPAGE_IMAGES.heroLaunch,
    ],
    developer: "Godrej Properties",
    developerVerified: true,
    developerMemberSince: "Feb 2018",
    transparency: {
      reraRegistered: true,
      reraNumber: "P52100034567",
      reraUrl: "https://maharera.maharashtra.gov.in/",
      superBuiltupArea: "2,540 sq.ft (236.0 sq.m.)",
      builtupArea: "2,495 sq.ft (231.8 sq.m.)",
      carpetArea: "1,780 sq.ft (165.4 sq.m.)",
      builtupAreaSqft: 2495,
      carpetAreaSqft: 1780,
      balconies: 3,
      hasPoojaRoom: false,
      floorNumber: 24,
      totalFloors: 26,
      facing: "South-East",
      overlooking: "Garden, Club House",
      possession: "Mar 2028",
      postedOn: "Jun 5, 2026",
      transactionType: "New",
      ownership: "Freehold",
      flooring: "Vitrified Tiles",
      furnishing: "Unfurnished",
      widthOfFacingRoad: "36 Feet",
      parking: "2 Covered",
      powerBackup: "Full",
      keyHighlights: ["Rooftop sky deck", "Smart home automation", "Clubhouse & spa access", "High-speed elevators"],
      viewedThisWeek: 968,
      contactedThisWeek: 11,
    },
    pos: 3,
  },
  {
    id: "p4",
    title: "Sobha Dream Acres — 3 BHC Premium Residence",
    location: "Panathur, Bengaluru",
    city: "Bengaluru",
    price: "₹ 2.65 Cr",
    priceCr: 2.65,
    pricePerSqft: "₹ 12,300/sq.ft",
    beds: 3,
    baths: 3,
    area: "1,815 sq.ft",
    areaSqft: 1815,
    type: "Apartment",
    status: "Ready to Move",
    purpose: "Sale",
    amenities: ["Gym & spa", "24/7 security", "Swimming pool"],
    priority: "Featured",
    tags: ["Featured", "Verified"],
    image: HOMEPAGE_IMAGES.apartmentHighrise,
    galleryImages: [
      HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.apartmentInterior, HOMEPAGE_IMAGES.heroModernEstate,
      HOMEPAGE_IMAGES.villa, HOMEPAGE_IMAGES.heroLaunch,
    ],
    developer: "Sobha Limited",
    developerVerified: true,
    developerMemberSince: "Nov 2021",
    transparency: {
      reraRegistered: true,
      reraNumber: "PRM/KA/RERA/1251/446/PR/240115/006789",
      reraUrl: "https://rera.karnataka.gov.in/",
      superBuiltupArea: "1,815 sq.ft (168.6 sq.m.)",
      builtupArea: "1,780 sq.ft (165.4 sq.m.)",
      carpetArea: "1,270 sq.ft (118.0 sq.m.)",
      builtupAreaSqft: 1780,
      carpetAreaSqft: 1270,
      balconies: 2,
      hasPoojaRoom: true,
      floorNumber: 9,
      totalFloors: 14,
      facing: "East",
      overlooking: "Park",
      possession: "Immediate",
      postedOn: "Jun 22, 2026",
      transactionType: "New",
      ownership: "Freehold",
      flooring: "Vitrified Tiles",
      furnishing: "Semi-Furnished",
      widthOfFacingRoad: "24 Feet",
      parking: "1 Covered",
      powerBackup: "Partial",
      keyHighlights: ["Gated township with 5 clubhouses", "Gym & spa on-site", "Landscaped central park", "24/7 security"],
      viewedThisWeek: 742,
      contactedThisWeek: 7,
    },
    pos: 4,
  },
  {
    id: "p5",
    title: "Prestige Jindal City — 3 BHK Luxury Apartment",
    location: "Tumkur Road, Bengaluru",
    city: "Bengaluru",
    price: "₹ 2.20 Cr",
    priceCr: 2.2,
    pricePerSqft: "₹ 11,800/sq.ft",
    beds: 3,
    baths: 4,
    area: "1,640 sq.ft",
    areaSqft: 1640,
    type: "Apartment",
    status: "Ready to Move",
    purpose: "Sale",
    amenities: ["24/7 security", "Private parking"],
    priority: "Organic",
    tags: ["Verified"],
    image: HOMEPAGE_IMAGES.apartmentInterior,
    galleryImages: [
      HOMEPAGE_IMAGES.apartmentInterior, HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.heroLaunch,
      HOMEPAGE_IMAGES.luxuryResidence, HOMEPAGE_IMAGES.estate,
    ],
    developer: "Prestige Group",
    developerVerified: false,
    developerMemberSince: "Jun 2024",
    transparency: {
      // Honest edge case: not every listing has cleared RERA yet — shown as
      // "registration in progress" rather than hidden or faked as approved.
      reraRegistered: false,
      superBuiltupArea: "1,640 sq.ft (152.4 sq.m.)",
      builtupArea: "1,610 sq.ft (149.6 sq.m.)",
      carpetArea: "1,150 sq.ft (106.8 sq.m.)",
      builtupAreaSqft: 1610,
      carpetAreaSqft: 1150,
      balconies: 2,
      hasPoojaRoom: false,
      floorNumber: 12,
      totalFloors: 18,
      facing: "South",
      overlooking: "Main Road",
      possession: "Immediate",
      postedOn: "Jul 1, 2026",
      transactionType: "New",
      ownership: "Freehold",
      flooring: "Vitrified Tiles",
      furnishing: "Unfurnished",
      widthOfFacingRoad: "45 Feet",
      parking: "1 Covered",
      powerBackup: "None",
      keyHighlights: ["Metro connectivity nearby", "24/7 security", "Children's play area"],
      viewedThisWeek: 415,
      contactedThisWeek: 3,
    },
    pos: 5,
  },
  {
    id: "p6",
    title: "Hiranandani Estate — Signature Villa",
    location: "Thane West, Thane",
    city: "Thane",
    price: "₹ 6.8 Cr",
    priceCr: 6.8,
    pricePerSqft: "₹ 24,500/sq.ft",
    beds: 5,
    baths: 6,
    area: "2,920 sq.ft",
    areaSqft: 2920,
    type: "Villa",
    status: "Ready to Move",
    purpose: "Sale",
    amenities: ["Private parking", "Garden terrace", "24/7 security", "Swimming pool", "Gym & spa"],
    priority: "Organic",
    tags: ["Verified", "Gated"],
    image: HOMEPAGE_IMAGES.estate,
    galleryImages: [
      HOMEPAGE_IMAGES.estate, HOMEPAGE_IMAGES.heroTwilightVilla, HOMEPAGE_IMAGES.villa,
      HOMEPAGE_IMAGES.apartmentInterior, HOMEPAGE_IMAGES.heroModernEstate,
    ],
    developer: "Hiranandani Group",
    developerVerified: true,
    developerMemberSince: "Aug 2017",
    transparency: {
      reraRegistered: true,
      reraNumber: "P51700045678",
      reraUrl: "https://maharera.maharashtra.gov.in/",
      superBuiltupArea: "2,920 sq.ft (271.3 sq.m.)",
      builtupArea: "2,865 sq.ft (266.2 sq.m.)",
      carpetArea: "2,045 sq.ft (190.0 sq.m.)",
      builtupAreaSqft: 2865,
      carpetAreaSqft: 2045,
      balconies: 4,
      hasPoojaRoom: true,
      facing: "North-East",
      overlooking: "Garden, Club House",
      possession: "Immediate",
      postedOn: "Apr 28, 2026",
      transactionType: "New",
      ownership: "Co-operative Society",
      flooring: "Marble",
      furnishing: "Unfurnished",
      widthOfFacingRoad: "60 Feet",
      parking: "2 Covered",
      powerBackup: "Full",
      keyHighlights: ["Gated villa community", "Private garden terrace", "Clubhouse with pool & gym", "24/7 manned security"],
      viewedThisWeek: 634,
      contactedThisWeek: 5,
    },
    pos: 6,
    // Demo case for the docs' "undelivered lead" rule — this seller's
    // membership has lapsed, but the listing itself is still live and
    // contactable (the two clocks are independent).
    sellerMembershipActive: false,
  },

  // ── Broader city inventory — more developers, more localities, so the city
  // pages' "Top developers"/"Popular areas" sections have real variety to draw
  // from instead of just the 1-2 flagship listings above. Lighter entries
  // (no `transparency` block) — the detail page already renders those
  // sections conditionally, so this is an honest "less-detailed listing",
  // never a faked one.
  {
    id: "p7", title: "Oberoi Sky City — 3 BHK Sky Residence", location: "Borivali, Mumbai", city: "Mumbai",
    price: "₹ 3.4 Cr", priceCr: 3.4, pricePerSqft: "₹ 19,200/sq.ft", beds: 3, baths: 3, area: "1,770 sq.ft", areaSqft: 1770,
    type: "Apartment", status: "Under Construction", purpose: "Sale",
    amenities: ["Swimming pool", "Gym & spa", "24/7 security"], priority: "Featured", tags: ["Featured", "Verified"],
    image: HOMEPAGE_IMAGES.apartmentHighrise, galleryImages: [HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.apartmentInterior],
    developer: "Oberoi Realty", developerVerified: true, developerMemberSince: "May 2015", pos: 7,
  },
  {
    id: "p8", title: "Kalpataru Avana — 4 BHK Residence", location: "Andheri West, Mumbai", city: "Mumbai",
    price: "₹ 5.1 Cr", priceCr: 5.1, pricePerSqft: "₹ 22,600/sq.ft", beds: 4, baths: 4, area: "2,260 sq.ft", areaSqft: 2260,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Gym & spa", "24/7 security", "Private parking"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.luxuryResidence, galleryImages: [HOMEPAGE_IMAGES.luxuryResidence, HOMEPAGE_IMAGES.apartmentInterior],
    developer: "Kalpataru Group", developerVerified: true, developerMemberSince: "Sep 2016", pos: 8,
  },
  {
    id: "p9", title: "Piramal Aranya — 3 BHK Harbour View", location: "Byculla, Mumbai", city: "Mumbai",
    price: "₹ 4.6 Cr", priceCr: 4.6, pricePerSqft: "₹ 24,100/sq.ft", beds: 3, baths: 3, area: "1,910 sq.ft", areaSqft: 1910,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Swimming pool", "24/7 security", "High-speed elevators"], priority: "Organic", tags: ["Verified"],
    image: "/images/prop-apt-downtown.png", galleryImages: ["/images/prop-apt-downtown.png", HOMEPAGE_IMAGES.apartmentHighrise],
    developer: "Piramal Realty", developerVerified: true, developerMemberSince: "Jan 2017", pos: 9,
  },
  {
    id: "p10", title: "Rustomjee Seasons — 2 BHK Apartment", location: "Bandra East, Mumbai", city: "Mumbai",
    price: "₹ 3.9 Cr", priceCr: 3.9, pricePerSqft: "₹ 27,800/sq.ft", beds: 2, baths: 2, area: "1,405 sq.ft", areaSqft: 1405,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Gym & spa", "24/7 security"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.apartmentInterior, galleryImages: [HOMEPAGE_IMAGES.apartmentInterior, "/images/prop-apt-downtown.png"],
    developer: "Rustomjee", developerVerified: true, developerMemberSince: "Mar 2014", pos: 10,
  },
  {
    id: "p11", title: "Sunteck City — 3 BHK Residence", location: "Powai, Mumbai", city: "Mumbai",
    price: "₹ 4.2 Cr", priceCr: 4.2, pricePerSqft: "₹ 20,900/sq.ft", beds: 3, baths: 3, area: "2,010 sq.ft", areaSqft: 2010,
    type: "Apartment", status: "Under Construction", purpose: "Sale",
    amenities: ["Swimming pool", "Smart home system", "24/7 security"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.apartmentHighrise, galleryImages: [HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.luxuryResidence],
    developer: "Sunteck Realty", developerVerified: true, developerMemberSince: "Jul 2019", pos: 11,
  },
  {
    id: "p12", title: "L&T Emerald Isle — 3 BHK Apartment", location: "Malad West, Mumbai", city: "Mumbai",
    price: "₹ 3.1 Cr", priceCr: 3.1, pricePerSqft: "₹ 17,400/sq.ft", beds: 3, baths: 3, area: "1,780 sq.ft", areaSqft: 1780,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Swimming pool", "Gym & spa", "Garden terrace"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.estate, galleryImages: [HOMEPAGE_IMAGES.estate, HOMEPAGE_IMAGES.apartmentInterior],
    developer: "L&T Realty", developerVerified: true, developerMemberSince: "Oct 2018", pos: 12,
  },

  {
    id: "p13", title: "Lodha Fiorenza — 3 BHK Apartment", location: "Majiwada, Thane", city: "Thane",
    price: "₹ 2.9 Cr", priceCr: 2.9, pricePerSqft: "₹ 16,100/sq.ft", beds: 3, baths: 3, area: "1,800 sq.ft", areaSqft: 1800,
    type: "Apartment", status: "Under Construction", purpose: "Sale",
    amenities: ["Swimming pool", "Gym & spa", "24/7 security"], priority: "Featured", tags: ["Featured", "Verified"],
    image: "/images/prop-apt-jbr.png", galleryImages: ["/images/prop-apt-jbr.png", HOMEPAGE_IMAGES.apartmentHighrise],
    developer: "Lodha Group", developerVerified: true, developerMemberSince: "Jan 2019", pos: 13,
  },
  {
    id: "p14", title: "Runwal Forest — 2 BHK Apartment", location: "Kalyan, Thane", city: "Thane",
    price: "₹ 1.4 Cr", priceCr: 1.4, pricePerSqft: "₹ 9,800/sq.ft", beds: 2, baths: 2, area: "1,430 sq.ft", areaSqft: 1430,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Garden terrace", "24/7 security"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.villa, galleryImages: [HOMEPAGE_IMAGES.villa, HOMEPAGE_IMAGES.estate],
    developer: "Runwal Group", developerVerified: true, developerMemberSince: "Mar 2020", pos: 14,
  },
  {
    id: "p15", title: "Ten X Habitat — 3 BHK Residence", location: "Ghodbunder Road, Thane", city: "Thane",
    price: "₹ 2.3 Cr", priceCr: 2.3, pricePerSqft: "₹ 13,600/sq.ft", beds: 3, baths: 3, area: "1,690 sq.ft", areaSqft: 1690,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Swimming pool", "Gym & spa", "Private parking"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.apartmentHighrise, galleryImages: [HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.estate],
    developer: "Raymond Realty", developerVerified: true, developerMemberSince: "Feb 2021", pos: 15,
  },
  {
    id: "p16", title: "Kalpataru Vivant — 2 BHK Apartment", location: "Manpada, Thane", city: "Thane",
    price: "₹ 1.7 Cr", priceCr: 1.7, pricePerSqft: "₹ 11,200/sq.ft", beds: 2, baths: 2, area: "1,520 sq.ft", areaSqft: 1520,
    type: "Apartment", status: "Under Construction", purpose: "Sale",
    amenities: ["24/7 security", "Private parking"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.luxuryResidence, galleryImages: [HOMEPAGE_IMAGES.luxuryResidence, "/images/prop-apt-jbr.png"],
    developer: "Kalpataru Group", developerVerified: true, developerMemberSince: "Sep 2016", pos: 16,
  },

  {
    id: "p17", title: "Kolte-Patil Life Republic — 2 BHK Apartment", location: "Hinjewadi, Pune", city: "Pune",
    price: "₹ 1.1 Cr", priceCr: 1.1, pricePerSqft: "₹ 8,900/sq.ft", beds: 2, baths: 2, area: "1,235 sq.ft", areaSqft: 1235,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Swimming pool", "Gym & spa", "24/7 security"], priority: "Featured", tags: ["Featured", "Verified"],
    image: HOMEPAGE_IMAGES.apartmentInterior, galleryImages: [HOMEPAGE_IMAGES.apartmentInterior, HOMEPAGE_IMAGES.apartmentHighrise],
    developer: "Kolte-Patil Developers", developerVerified: true, developerMemberSince: "Apr 2015", pos: 17,
  },
  {
    id: "p18", title: "Panchshil Towers — 3 BHK Residence", location: "Viman Nagar, Pune", city: "Pune",
    price: "₹ 2.6 Cr", priceCr: 2.6, pricePerSqft: "₹ 13,900/sq.ft", beds: 3, baths: 3, area: "1,870 sq.ft", areaSqft: 1870,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Concierge service", "Gym & spa", "24/7 security"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.heroModernEstate, galleryImages: [HOMEPAGE_IMAGES.heroModernEstate, HOMEPAGE_IMAGES.luxuryResidence],
    developer: "Panchshil Realty", developerVerified: true, developerMemberSince: "Jun 2013", pos: 18,
  },
  {
    id: "p19", title: "Gera World of Joy — 3 BHK Apartment", location: "Kharadi, Pune", city: "Pune",
    price: "₹ 1.9 Cr", priceCr: 1.9, pricePerSqft: "₹ 11,600/sq.ft", beds: 3, baths: 3, area: "1,640 sq.ft", areaSqft: 1640,
    type: "Apartment", status: "Under Construction", purpose: "Sale",
    amenities: ["Swimming pool", "Garden terrace"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.apartmentHighrise, galleryImages: [HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.apartmentInterior],
    developer: "Gera Developments", developerVerified: true, developerMemberSince: "Aug 2017", pos: 19,
  },
  {
    id: "p20", title: "Kumar Princeton — 2 BHK Apartment", location: "Baner, Pune", city: "Pune",
    price: "₹ 1.25 Cr", priceCr: 1.25, pricePerSqft: "₹ 9,500/sq.ft", beds: 2, baths: 2, area: "1,315 sq.ft", areaSqft: 1315,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["24/7 security"], priority: "Organic", tags: [],
    image: HOMEPAGE_IMAGES.estate, galleryImages: [HOMEPAGE_IMAGES.estate, HOMEPAGE_IMAGES.apartmentInterior],
    developer: "Kumar Properties", developerVerified: false, developerMemberSince: "Nov 2023", pos: 20,
  },

  {
    id: "p21", title: "Brigade Cornerstone Utopia — 3 BHK Apartment", location: "Whitefield, Bengaluru", city: "Bengaluru",
    price: "₹ 2.4 Cr", priceCr: 2.4, pricePerSqft: "₹ 12,700/sq.ft", beds: 3, baths: 3, area: "1,890 sq.ft", areaSqft: 1890,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Swimming pool", "Gym & spa", "24/7 security"], priority: "Featured", tags: ["Featured", "Verified"],
    image: HOMEPAGE_IMAGES.apartmentHighrise, galleryImages: [HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.luxuryResidence],
    developer: "Brigade Group", developerVerified: true, developerMemberSince: "Feb 2016", pos: 21,
  },
  {
    id: "p22", title: "Purva Atmosphere — 2 BHK Apartment", location: "Hennur, Bengaluru", city: "Bengaluru",
    price: "₹ 1.35 Cr", priceCr: 1.35, pricePerSqft: "₹ 9,900/sq.ft", beds: 2, baths: 2, area: "1,360 sq.ft", areaSqft: 1360,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Garden terrace", "24/7 security"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.apartmentInterior, galleryImages: [HOMEPAGE_IMAGES.apartmentInterior, HOMEPAGE_IMAGES.estate],
    developer: "Puravankara", developerVerified: true, developerMemberSince: "May 2014", pos: 22,
  },
  {
    id: "p23", title: "Sattva Songbird — 3 BHK Apartment", location: "Marathahalli, Bengaluru", city: "Bengaluru",
    price: "₹ 1.95 Cr", priceCr: 1.95, pricePerSqft: "₹ 11,200/sq.ft", beds: 3, baths: 3, area: "1,745 sq.ft", areaSqft: 1745,
    type: "Apartment", status: "Under Construction", purpose: "Sale",
    amenities: ["Swimming pool", "Gym & spa"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.heroModernEstate, galleryImages: [HOMEPAGE_IMAGES.heroModernEstate, HOMEPAGE_IMAGES.apartmentHighrise],
    developer: "Salarpuria Sattva", developerVerified: true, developerMemberSince: "Sep 2018", pos: 23,
  },
  {
    id: "p24", title: "Embassy Springs — 2 BHK Apartment", location: "Bellandur, Bengaluru", city: "Bengaluru",
    price: "₹ 1.55 Cr", priceCr: 1.55, pricePerSqft: "₹ 10,400/sq.ft", beds: 2, baths: 2, area: "1,490 sq.ft", areaSqft: 1490,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["24/7 security", "Private parking"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.luxuryResidence, galleryImages: [HOMEPAGE_IMAGES.luxuryResidence, HOMEPAGE_IMAGES.apartmentInterior],
    developer: "Embassy Group", developerVerified: true, developerMemberSince: "Jan 2012", pos: 24,
  },

  {
    id: "p25", title: "My Home Bhooja — 3 BHK Apartment", location: "Gachibowli, Hyderabad", city: "Hyderabad",
    price: "₹ 2.1 Cr", priceCr: 2.1, pricePerSqft: "₹ 11,900/sq.ft", beds: 3, baths: 3, area: "1,765 sq.ft", areaSqft: 1765,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Swimming pool", "Gym & spa", "24/7 security"], priority: "Featured", tags: ["Featured", "Verified"],
    image: HOMEPAGE_IMAGES.apartmentHighrise, galleryImages: [HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.apartmentInterior],
    developer: "My Home Group", developerVerified: true, developerMemberSince: "Mar 2015", pos: 25,
  },
  {
    id: "p26", title: "Aparna Sarovar Zenith — 2 BHK Apartment", location: "Kondapur, Hyderabad", city: "Hyderabad",
    price: "₹ 1.2 Cr", priceCr: 1.2, pricePerSqft: "₹ 8,700/sq.ft", beds: 2, baths: 2, area: "1,380 sq.ft", areaSqft: 1380,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Swimming pool", "24/7 security"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.estate, galleryImages: [HOMEPAGE_IMAGES.estate, HOMEPAGE_IMAGES.apartmentHighrise],
    developer: "Aparna Constructions", developerVerified: true, developerMemberSince: "Jul 2016", pos: 26,
  },
  {
    id: "p27", title: "Rajapushpa Provincia — 3 BHK Apartment", location: "Financial District, Hyderabad", city: "Hyderabad",
    price: "₹ 1.85 Cr", priceCr: 1.85, pricePerSqft: "₹ 10,600/sq.ft", beds: 3, baths: 3, area: "1,745 sq.ft", areaSqft: 1745,
    type: "Apartment", status: "Under Construction", purpose: "Sale",
    amenities: ["Gym & spa", "24/7 security"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.apartmentInterior, galleryImages: [HOMEPAGE_IMAGES.apartmentInterior, HOMEPAGE_IMAGES.luxuryResidence],
    developer: "Rajapushpa Properties", developerVerified: true, developerMemberSince: "Oct 2019", pos: 27,
  },
  {
    id: "p28", title: "Prestige High Fields — 3 BHK Apartment", location: "Nanakramguda, Hyderabad", city: "Hyderabad",
    price: "₹ 2.35 Cr", priceCr: 2.35, pricePerSqft: "₹ 12,900/sq.ft", beds: 3, baths: 3, area: "1,820 sq.ft", areaSqft: 1820,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Swimming pool", "Gym & spa", "Concierge service"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.heroModernEstate, galleryImages: [HOMEPAGE_IMAGES.heroModernEstate, HOMEPAGE_IMAGES.apartmentHighrise],
    developer: "Prestige Group", developerVerified: true, developerMemberSince: "Jun 2024", pos: 28,
  },

  {
    id: "p29", title: "DLF Privana — 3 BHK Residence", location: "Golf Course Road, Gurugram", city: "Delhi NCR",
    price: "₹ 3.8 Cr", priceCr: 3.8, pricePerSqft: "₹ 18,900/sq.ft", beds: 3, baths: 3, area: "2,010 sq.ft", areaSqft: 2010,
    type: "Apartment", status: "Under Construction", purpose: "Sale",
    amenities: ["Swimming pool", "Gym & spa", "24/7 security"], priority: "Featured", tags: ["Featured", "Verified"],
    image: HOMEPAGE_IMAGES.heroModernEstate, galleryImages: [HOMEPAGE_IMAGES.heroModernEstate, HOMEPAGE_IMAGES.luxuryResidence],
    developer: "DLF", developerVerified: true, developerMemberSince: "Feb 2010", pos: 29,
  },
  {
    id: "p30", title: "M3M Golf Estate — 3 BHK Apartment", location: "Golf Course Extension, Gurugram", city: "Delhi NCR",
    price: "₹ 2.9 Cr", priceCr: 2.9, pricePerSqft: "₹ 15,400/sq.ft", beds: 3, baths: 3, area: "1,880 sq.ft", areaSqft: 1880,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Swimming pool", "24/7 security"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.apartmentHighrise, galleryImages: [HOMEPAGE_IMAGES.apartmentHighrise, HOMEPAGE_IMAGES.apartmentInterior],
    developer: "M3M India", developerVerified: true, developerMemberSince: "Jan 2013", pos: 30,
  },
  {
    id: "p31", title: "ATS Pristine — 2 BHK Apartment", location: "Sector 150, Noida", city: "Delhi NCR",
    price: "₹ 1.65 Cr", priceCr: 1.65, pricePerSqft: "₹ 10,100/sq.ft", beds: 2, baths: 2, area: "1,635 sq.ft", areaSqft: 1635,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Garden terrace", "24/7 security"], priority: "Organic", tags: [],
    image: HOMEPAGE_IMAGES.estate, galleryImages: [HOMEPAGE_IMAGES.estate, HOMEPAGE_IMAGES.apartmentInterior],
    developer: "ATS Group", developerVerified: false, developerMemberSince: "Sep 2022", pos: 31,
  },
  {
    id: "p32", title: "Signature Global City — 2 BHK Apartment", location: "Sohna Road, Gurugram", city: "Delhi NCR",
    price: "₹ 1.1 Cr", priceCr: 1.1, pricePerSqft: "₹ 7,900/sq.ft", beds: 2, baths: 2, area: "1,395 sq.ft", areaSqft: 1395,
    type: "Apartment", status: "Under Construction", purpose: "Sale",
    amenities: ["24/7 security"], priority: "Organic", tags: ["Verified"],
    image: HOMEPAGE_IMAGES.luxuryResidence, galleryImages: [HOMEPAGE_IMAGES.luxuryResidence, HOMEPAGE_IMAGES.apartmentHighrise],
    developer: "Signature Global", developerVerified: true, developerMemberSince: "Apr 2018", pos: 32,
  },

  // — Commercial nav vertical (9) —
  {
    id: "p33", title: "Godrej BKC One — Grade-A Office Space", location: "Bandra Kurla Complex, Mumbai", city: "Mumbai",
    price: "₹ 18.5 Cr", priceCr: 18.5, pricePerSqft: "₹ 42,000/sq.ft", beds: 0, baths: 2, area: "8,200 sq.ft", areaSqft: 8200,
    type: "Commercial", status: "Ready to Move", purpose: "Sale",
    amenities: ["Central AC", "24/7 power backup", "High-speed elevators", "Reserved parking", "24/7 security"], priority: "Sponsored", tags: ["Sponsored", "Grade-A", "BKC"],
    image: HOMEPAGE_IMAGES.commercialTower, galleryImages: [HOMEPAGE_IMAGES.commercialTower, HOMEPAGE_IMAGES.commercialInterior],
    developer: "Godrej Properties", developerVerified: true, developerMemberSince: "Jan 2019", pos: 33, segment: "Commercial",
  },
  {
    id: "p34", title: "DLF Cyber City — IT Office Floor", location: "Cyber City, Gurugram", city: "Delhi NCR",
    price: "₹ 9.8 Cr", priceCr: 9.8, pricePerSqft: "₹ 22,500/sq.ft", beds: 0, baths: 2, area: "4,350 sq.ft", areaSqft: 4350,
    type: "Commercial", status: "Ready to Move", purpose: "Sale",
    amenities: ["Central AC", "High-speed elevators", "24/7 security", "Cafeteria"], priority: "Featured", tags: ["Featured", "IT Park"],
    image: HOMEPAGE_IMAGES.commercialInterior, galleryImages: [HOMEPAGE_IMAGES.commercialInterior, HOMEPAGE_IMAGES.commercialTower],
    developer: "DLF", developerVerified: true, developerMemberSince: "Feb 2010", pos: 34, segment: "Commercial",
  },
  {
    id: "p35", title: "Prestige Tech Park — IT/ITES Office Floor", location: "Sarjapur Road, Bengaluru", city: "Bengaluru",
    price: "₹ 6.4 Cr", priceCr: 6.4, pricePerSqft: "₹ 15,800/sq.ft", beds: 0, baths: 1, area: "4,050 sq.ft", areaSqft: 4050,
    type: "Commercial", status: "Under Construction", purpose: "Sale",
    amenities: ["Central AC", "Reserved parking", "24/7 security"], priority: "Featured", tags: ["Featured", "IT Park"],
    image: HOMEPAGE_IMAGES.commercialTower, galleryImages: [HOMEPAGE_IMAGES.commercialTower, HOMEPAGE_IMAGES.commercialInterior],
    developer: "Prestige Group", developerVerified: true, developerMemberSince: "Mar 2012", pos: 35, segment: "Commercial",
  },
  {
    id: "p36", title: "Brigade World Trade Center — Coworking Floor", location: "K R Puram, Bengaluru", city: "Bengaluru",
    price: "₹ 4.9 Cr", priceCr: 4.9, pricePerSqft: "₹ 13,600/sq.ft", beds: 0, baths: 1, area: "3,600 sq.ft", areaSqft: 3600,
    type: "Commercial", status: "Ready to Move", purpose: "Sale",
    amenities: ["Central AC", "High-speed elevators", "24/7 security"], priority: "Organic", tags: ["Coworking"],
    image: HOMEPAGE_IMAGES.commercialInterior, galleryImages: [HOMEPAGE_IMAGES.commercialInterior, HOMEPAGE_IMAGES.commercialTower],
    developer: "Brigade Group", developerVerified: true, developerMemberSince: "Nov 2014", pos: 36, segment: "Commercial",
  },
  {
    id: "p37", title: "Phoenix Marketcity — Retail Showroom", location: "Kurla, Mumbai", city: "Mumbai",
    price: "₹ 5.6 Cr", priceCr: 5.6, pricePerSqft: "₹ 48,000/sq.ft", beds: 0, baths: 1, area: "1,170 sq.ft", areaSqft: 1170,
    type: "Commercial", status: "Ready to Move", purpose: "Sale",
    amenities: ["High footfall mall", "Central AC", "24/7 security"], priority: "Sponsored", tags: ["Sponsored", "Retail"],
    image: HOMEPAGE_IMAGES.commercialRetail, galleryImages: [HOMEPAGE_IMAGES.commercialRetail, HOMEPAGE_IMAGES.commercialTower],
    developer: "Phoenix Mills", developerVerified: true, developerMemberSince: "Jul 2011", pos: 37, segment: "Commercial",
  },
  {
    id: "p38", title: "Panchshil Business Hub — Office Tower Floor", location: "Kharadi, Pune", city: "Pune",
    price: "₹ 5.1 Cr", priceCr: 5.1, pricePerSqft: "₹ 14,200/sq.ft", beds: 0, baths: 1, area: "3,600 sq.ft", areaSqft: 3600,
    type: "Commercial", status: "Under Construction", purpose: "Sale",
    amenities: ["Central AC", "Reserved parking", "24/7 security"], priority: "Organic", tags: [],
    image: HOMEPAGE_IMAGES.commercialTower, galleryImages: [HOMEPAGE_IMAGES.commercialTower, HOMEPAGE_IMAGES.commercialInterior],
    developer: "Panchshil Realty", developerVerified: true, developerMemberSince: "May 2013", pos: 38, segment: "Commercial",
  },
  {
    id: "p39", title: "My Home Twitza — IT Office Campus Floor", location: "Gachibowli, Hyderabad", city: "Hyderabad",
    price: "₹ 4.3 Cr", priceCr: 4.3, pricePerSqft: "₹ 9,800/sq.ft", beds: 0, baths: 1, area: "4,400 sq.ft", areaSqft: 4400,
    type: "Commercial", status: "Ready to Move", purpose: "Sale",
    amenities: ["Central AC", "Cafeteria", "24/7 security"], priority: "Organic", tags: ["IT Park"],
    image: HOMEPAGE_IMAGES.commercialInterior, galleryImages: [HOMEPAGE_IMAGES.commercialInterior, HOMEPAGE_IMAGES.commercialTower],
    developer: "My Home Group", developerVerified: true, developerMemberSince: "Aug 2016", pos: 39, segment: "Commercial",
  },
  {
    id: "p40", title: "Sobha Business Park — Logistics & Warehouse Unit", location: "Hoskote, Bengaluru", city: "Bengaluru",
    price: "₹ 3.2 Cr", priceCr: 3.2, pricePerSqft: "₹ 4,600/sq.ft", beds: 0, baths: 1, area: "7,000 sq.ft", areaSqft: 7000,
    type: "Commercial", status: "Ready to Move", purpose: "Sale",
    amenities: ["Loading dock", "24/7 security", "Reserved parking"], priority: "Organic", tags: ["Warehouse"],
    image: HOMEPAGE_IMAGES.commercialTower, galleryImages: [HOMEPAGE_IMAGES.commercialTower, HOMEPAGE_IMAGES.commercialInterior],
    developer: "Sobha Limited", developerVerified: true, developerMemberSince: "Oct 2015", pos: 40, segment: "Commercial",
  },
  {
    id: "p41", title: "L&T Business Bay — Retail Arcade Unit", location: "OMR, Chennai", city: "Chennai",
    price: "₹ 2.7 Cr", priceCr: 2.7, pricePerSqft: "₹ 27,000/sq.ft", beds: 0, baths: 1, area: "1,000 sq.ft", areaSqft: 1000,
    type: "Commercial", status: "Under Construction", purpose: "Sale",
    amenities: ["High footfall arcade", "Central AC", "24/7 security"], priority: "Featured", tags: ["Featured", "Retail"],
    image: HOMEPAGE_IMAGES.commercialRetail, galleryImages: [HOMEPAGE_IMAGES.commercialRetail, HOMEPAGE_IMAGES.commercialInterior],
    developer: "L&T Realty", developerVerified: true, developerMemberSince: "Jun 2014", pos: 41, segment: "Commercial",
  },

  // — Land & Luxury Villa nav vertical (8) —
  {
    id: "p42", title: "Rustomjee Sea Face Villa — 5 BHK Luxury Villa", location: "Alibaug, Maharashtra", city: "Alibaug",
    price: "₹ 8.9 Cr", priceCr: 8.9, pricePerSqft: "₹ 14,350/sq.ft", beds: 5, baths: 6, area: "6,200 sq.ft", areaSqft: 6200,
    type: "Villa", status: "Ready to Move", purpose: "Sale",
    amenities: ["Private pool", "Sea view", "Landscaped garden", "Home theatre", "24/7 security"], priority: "Sponsored", tags: ["Sponsored", "Sea View"],
    image: HOMEPAGE_IMAGES.heroTwilightVilla, galleryImages: [HOMEPAGE_IMAGES.heroTwilightVilla, HOMEPAGE_IMAGES.villa],
    developer: "Rustomjee", developerVerified: true, developerMemberSince: "Feb 2017", pos: 42, segment: "Land & Luxury Villa",
  },
  {
    id: "p43", title: "Lodha Upper Thane Estate — 6 BHK Luxury Villa", location: "Upper Thane", city: "Thane",
    price: "₹ 11.2 Cr", priceCr: 11.2, pricePerSqft: "₹ 15,140/sq.ft", beds: 6, baths: 7, area: "7,400 sq.ft", areaSqft: 7400,
    type: "Villa", status: "Ready to Move", purpose: "Sale",
    amenities: ["Private pool", "Clubhouse", "Landscaped garden", "Smart home system", "24/7 security"], priority: "Sponsored", tags: ["Sponsored", "Gated Estate"],
    image: HOMEPAGE_IMAGES.villa, galleryImages: [HOMEPAGE_IMAGES.villa, HOMEPAGE_IMAGES.estate],
    developer: "Lodha Group", developerVerified: true, developerMemberSince: "Jan 2019", pos: 43, segment: "Land & Luxury Villa",
  },
  {
    id: "p44", title: "Kalpataru Vivant Hillside Villa — 4 BHK", location: "Lonavala", city: "Lonavala",
    price: "₹ 4.6 Cr", priceCr: 4.6, pricePerSqft: "₹ 12,100/sq.ft", beds: 4, baths: 5, area: "3,800 sq.ft", areaSqft: 3800,
    type: "Villa", status: "Under Construction", purpose: "Sale",
    amenities: ["Hill view", "Private pool", "Landscaped garden", "24/7 security"], priority: "Featured", tags: ["Featured", "Weekend Home"],
    image: HOMEPAGE_IMAGES.heroTwilightVilla, galleryImages: [HOMEPAGE_IMAGES.heroTwilightVilla, HOMEPAGE_IMAGES.luxuryResidence],
    developer: "Kalpataru Group", developerVerified: true, developerMemberSince: "Sep 2018", pos: 44, segment: "Land & Luxury Villa",
  },
  {
    id: "p45", title: "Sobha Winchester Farmland Plot", location: "Devanahalli, Bengaluru", city: "Bengaluru",
    price: "₹ 2.3 Cr", priceCr: 2.3, pricePerSqft: "₹ 1,920/sq.ft", beds: 0, baths: 0, area: "12,000 sq.ft", areaSqft: 12000,
    type: "Plot", status: "Ready to Move", purpose: "Sale",
    amenities: ["Gated layout", "Approach road", "24/7 security"], priority: "Organic", tags: ["Plot"],
    image: HOMEPAGE_IMAGES.landPlot, galleryImages: [HOMEPAGE_IMAGES.landPlot, HOMEPAGE_IMAGES.estate],
    developer: "Sobha Limited", developerVerified: true, developerMemberSince: "Oct 2015", pos: 45, segment: "Land & Luxury Villa",
  },
  {
    id: "p46", title: "Puravankara Elegant Farms — Gated Villa Plot", location: "Kanakapura Road, Bengaluru", city: "Bengaluru",
    price: "₹ 1.8 Cr", priceCr: 1.8, pricePerSqft: "₹ 3,750/sq.ft", beds: 0, baths: 0, area: "4,800 sq.ft", areaSqft: 4800,
    type: "Plot", status: "Ready to Move", purpose: "Sale",
    amenities: ["Gated layout", "Clubhouse access", "24/7 security"], priority: "Organic", tags: ["Plot"],
    image: HOMEPAGE_IMAGES.landPlot, galleryImages: [HOMEPAGE_IMAGES.landPlot, HOMEPAGE_IMAGES.villa],
    developer: "Puravankara", developerVerified: true, developerMemberSince: "Apr 2013", pos: 46, segment: "Land & Luxury Villa",
  },
  {
    id: "p47", title: "Oberoi Garden City Villa — 5 BHK", location: "Candolim, Goa", city: "Goa",
    price: "₹ 6.7 Cr", priceCr: 6.7, pricePerSqft: "₹ 13,140/sq.ft", beds: 5, baths: 6, area: "5,100 sq.ft", areaSqft: 5100,
    type: "Villa", status: "Ready to Move", purpose: "Sale",
    amenities: ["Private pool", "Beach proximity", "Landscaped garden", "24/7 security"], priority: "Featured", tags: ["Featured", "Beachside"],
    image: HOMEPAGE_IMAGES.villa, galleryImages: [HOMEPAGE_IMAGES.villa, HOMEPAGE_IMAGES.heroTwilightVilla],
    developer: "Oberoi Realty", developerVerified: true, developerMemberSince: "Jun 2012", pos: 47, segment: "Land & Luxury Villa",
  },
  {
    id: "p48", title: "Hiranandani Coastal Retreat — 4 BHK Villa", location: "Karjat", city: "Karjat",
    price: "₹ 3.4 Cr", priceCr: 3.4, pricePerSqft: "₹ 10,625/sq.ft", beds: 4, baths: 4, area: "3,200 sq.ft", areaSqft: 3200,
    type: "Villa", status: "Under Construction", purpose: "Sale",
    amenities: ["River view", "Private pool", "24/7 security"], priority: "Organic", tags: ["Weekend Home"],
    image: HOMEPAGE_IMAGES.heroTwilightVilla, galleryImages: [HOMEPAGE_IMAGES.heroTwilightVilla, HOMEPAGE_IMAGES.estate],
    developer: "Hiranandani Group", developerVerified: true, developerMemberSince: "Mar 2011", pos: 48, segment: "Land & Luxury Villa",
  },
  {
    id: "p49", title: "Runwal Greenfield Estate Plot", location: "Coonoor, Nilgiris", city: "Coonoor",
    price: "₹ 1.2 Cr", priceCr: 1.2, pricePerSqft: "₹ 2,000/sq.ft", beds: 0, baths: 0, area: "6,000 sq.ft", areaSqft: 6000,
    type: "Plot", status: "Ready to Move", purpose: "Sale",
    amenities: ["Hill view", "Gated layout", "24/7 security"], priority: "Organic", tags: ["Plot"],
    image: HOMEPAGE_IMAGES.landPlot, galleryImages: [HOMEPAGE_IMAGES.landPlot, HOMEPAGE_IMAGES.heroTwilightVilla],
    developer: "Runwal Group", developerVerified: true, developerMemberSince: "Nov 2016", pos: 49, segment: "Land & Luxury Villa",
  },

  // — Global Properties nav vertical (3) —
  {
    id: "p50", title: "Burj Residences — 3 BHK Sky Apartment", location: "Downtown Dubai, UAE", city: "Dubai",
    price: "₹ 4.8 Cr", priceCr: 4.8, pricePerSqft: "₹ 19,600/sq.ft", beds: 3, baths: 4, area: "2,450 sq.ft", areaSqft: 2450,
    type: "Apartment", status: "Ready to Move", purpose: "Sale",
    amenities: ["Burj Khalifa view", "Infinity pool", "Concierge service", "Smart home system", "24/7 security"], priority: "Sponsored", tags: ["Sponsored", "Global", "Skyline View"],
    image: HOMEPAGE_IMAGES.globalDubai, galleryImages: [HOMEPAGE_IMAGES.globalDubai, HOMEPAGE_IMAGES.heroPenthouse],
    developer: "Emaar Properties", developerVerified: true, developerMemberSince: "May 2015", pos: 50, segment: "Global",
  },
  {
    id: "p51", title: "Marina One Residences — 4 BHK Waterfront Penthouse", location: "Marina Bay, Singapore", city: "Singapore",
    price: "₹ 9.6 Cr", priceCr: 9.6, pricePerSqft: "₹ 30,970/sq.ft", beds: 4, baths: 5, area: "3,100 sq.ft", areaSqft: 3100,
    type: "Penthouse", status: "Ready to Move", purpose: "Sale",
    amenities: ["Waterfront view", "Infinity pool", "Concierge service", "24/7 security"], priority: "Sponsored", tags: ["Sponsored", "Global", "Waterfront"],
    image: HOMEPAGE_IMAGES.globalSingapore, galleryImages: [HOMEPAGE_IMAGES.globalSingapore, HOMEPAGE_IMAGES.heroPenthouse],
    developer: "CapitaLand", developerVerified: true, developerMemberSince: "Jul 2014", pos: 51, segment: "Global",
  },
  {
    id: "p52", title: "Nine Elms Riverside — 3 BHK Apartment", location: "Nine Elms, London, UK", city: "London",
    price: "₹ 6.3 Cr", priceCr: 6.3, pricePerSqft: "₹ 35,390/sq.ft", beds: 3, baths: 3, area: "1,780 sq.ft", areaSqft: 1780,
    type: "Apartment", status: "Under Construction", purpose: "Sale",
    amenities: ["River Thames view", "Concierge service", "Gym & spa", "24/7 security"], priority: "Featured", tags: ["Featured", "Global", "River View"],
    image: HOMEPAGE_IMAGES.globalLondon, galleryImages: [HOMEPAGE_IMAGES.globalLondon, HOMEPAGE_IMAGES.apartmentInterior],
    developer: "Berkeley Group", developerVerified: true, developerMemberSince: "Sep 2013", pos: 52, segment: "Global",
  },
]

export type City = {
  /** URL-safe id for /cities/[slug] — e.g. "delhi-ncr". */
  slug: string
  name: string
  image: string
  blurb: string
}

// listing counts / starting prices are intentionally NOT stored here — every
// display site computes them live via `propertiesInCity()`/`cityStartingPriceCr()`
// (or `projectsInCity()`), so they can never drift into invented numbers.
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

/** Real properties in a city — the honest source of truth for city pages, never the fake `listings` string above. */
export function propertiesInCity(cityName: string): Property[] {
  return properties.filter((p) => p.city === cityName)
}

/** Real starting price in a city, computed from actual listings — undefined when there are none (honest, not a fake "from ₹0"). */
export function cityStartingPriceCr(cityName: string): number | undefined {
  const inCity = propertiesInCity(cityName)
  if (inCity.length === 0) return undefined
  return Math.min(...inCity.map((p) => p.priceCr))
}

export function getCityBySlug(slug: string): City | undefined {
  return popularCities.find((c) => c.slug === slug)
}

export type Developer = {
  name: string
  initials: string
  projects: number
  cities: number
  rating: string
  tagline: string
  featured?: boolean
}

export const featuredDevelopers: Developer[] = [
  { name: "Lodha Group", initials: "L", projects: 48, cities: 6, rating: "4.8", tagline: "Crafting landmarks since 1980", featured: true },
  { name: "Runwal Group", initials: "R", projects: 32, cities: 4, rating: "4.7", tagline: "Seniors-first luxury living", featured: true },
  { name: "Godrej Properties", initials: "G", projects: 39, cities: 12, rating: "4.7", tagline: "Sustainable design, premium finishes" },
  { name: "Sobha Limited", initials: "S", projects: 27, cities: 7, rating: "4.6", tagline: "Backward-integrated craftsmanship" },
  { name: "Prestige Group", initials: "P", projects: 41, cities: 8, rating: "4.7", tagline: "Bengaluru's most-trusted developer" },
  { name: "Hiranandani Group", initials: "H", projects: 22, cities: 5, rating: "4.5", tagline: "Township pioneers of Thane" },
  { name: "Oberoi Realty", initials: "O", projects: 19, cities: 3, rating: "4.7", tagline: "Mumbai's benchmark for design-led luxury" },
  { name: "Kalpataru Group", initials: "K", projects: 25, cities: 5, rating: "4.5", tagline: "Five decades of trusted construction" },
  { name: "Brigade Group", initials: "B", projects: 34, cities: 6, rating: "4.6", tagline: "South India's integrated township pioneer" },
  { name: "Puravankara", initials: "P", projects: 29, cities: 9, rating: "4.5", tagline: "Four decades of Bengaluru residences" },
  { name: "DLF", initials: "D", projects: 52, cities: 4, rating: "4.7", tagline: "India's largest listed real estate developer" },
  { name: "My Home Group", initials: "M", projects: 17, cities: 2, rating: "4.6", tagline: "Hyderabad's skyline, redefined" },
]

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

export type LeadStage = {
  stage: string
  description: string
  color: string
}

export const leadPipeline: LeadStage[] = [
  { stage: "New", description: "Lead captured from a property click, enquiry, or callback request.", color: "#bd9935" },
  { stage: "Contacted", description: "First outreach made via call or WhatsApp within 9 minutes.", color: "#bd9935" },
  { stage: "Follow-up", description: "Scheduled callback or second touch to qualify intent.", color: "#a8851d" },
  { stage: "Site Visit", description: "Buyer booked for an on-site or virtual tour of the property.", color: "#816720" },
  { stage: "Negotiation", description: "Active price/terms discussion between buyer and owner.", color: "#6b5d3f" },
  { stage: "Booking", description: "Token amount received; deal moved to formal paperwork.", color: "#3a2c08" },
  { stage: "Closed", description: "Deal concluded — won or lost, with reason captured.", color: "#0a0a0a" },
]

export type LeadSource = {
  source: string
  count: number
  share: number
}

export const leadSources: LeadSource[] = [
  { source: "Property Click", count: 4280, share: 34 },
  { source: "Contact Request", count: 2140, share: 17 },
  { source: "Sponsored Click", count: 1980, share: 16 },
  { source: "Listing Enquiry", count: 1620, share: 13 },
  { source: "Callback Request", count: 1340, share: 11 },
  { source: "Site Visit", count: 720, share: 6 },
  { source: "Ad Click", count: 480, share: 3 },
]

export type Testimonial = {
  name: string
  role: string
  city: string
  quote: string
  rating: number
  initials: string
}

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

export function matchesBudget(priceCr: number, bucketId: string): boolean {
  const bucket = BUDGET_BUCKETS.find((b) => b.id === bucketId)
  if (!bucket) return true
  return priceCr >= bucket.min && priceCr <= bucket.max
}

/** Maps the hero search console's "Residence" select labels to real Property.type values. */
export const RESIDENCE_TYPE_MAP: Record<string, Property["type"] | undefined> = {
  "Any residence": undefined,
  Apartment: "Apartment",
  Villa: "Villa",
  Penthouse: "Penthouse",
  Plot: "Plot",
  Office: "Commercial",
}

/** Maps the landing page's "Ways of living" categories to a best-effort property filter. */
export const LIVING_CATEGORY_FILTER: Record<string, { type?: Property["type"]; status?: Property["status"] }> = {
  "Luxury Flats": { type: "Apartment" },
  Farmhouse: { type: "Villa" },
  "Land / Plot": { type: "Plot" },
  Rent: {},
  "New Projects": { status: "Under Construction" },
}

/** Full filter grammar per the docs (07-Frontend.md §10.1): q, city, propertyType, bhk, priceMin, priceMax, areaMin, areaMax, amenities, purpose, badges, sort. */
export const CITIES: string[] = Array.from(new Set(properties.map((p) => p.city))).sort()

export const BHK_OPTIONS = [2, 3, 4, 5] as const

export const PURPOSE_OPTIONS: Property["purpose"][] = ["Sale", "Rent"]

export const AMENITIES_MASTER: string[] = [
  "Concierge service", "Private parking", "Swimming pool", "Gym & spa",
  "24/7 security", "Smart home system", "Garden terrace", "Sea view", "High-speed elevators",
]

export const PRICE_RANGE_CR = {
  min: 0,
  max: Math.ceil(Math.max(...properties.map((p) => p.priceCr))),
}

export const AREA_RANGE_SQFT = {
  min: Math.floor(Math.min(...properties.map((p) => p.areaSqft)) / 100) * 100,
  max: Math.ceil(Math.max(...properties.map((p) => p.areaSqft)) / 100) * 100,
}
