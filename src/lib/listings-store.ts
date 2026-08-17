"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { myListings, type Listing } from "@/lib/dashboard-data"

export type ListingInput = {
  title: string
  city: string
  location: string
  type: Listing["type"]
  status: Listing["status"]
  purpose: "Sale" | "Rent"
  priceCr: number
  areaSqft: number
  beds: number
  baths: number
  developer: string
  furnishing: "Furnished" | "Semi-Furnished" | "Unfurnished"
  facing: string
  transactionType: "New" | "Resale"
  reraRegistered: boolean
  reraNumber?: string
  reraUrl?: string
  amenities: string[]
  image: string
  /** Additional photos beyond the cover `image`. */
  galleryImages: string[]
  /** Rest of the fields the public property page's "Area & configuration"
   *  and "Property details" sections show — see `Listing` (dashboard-data.ts)
   *  for why each one is here. */
  carpetAreaSqft: number
  balconies: number
  hasPoojaRoom: boolean
  floorNumber?: number
  totalFloors?: number
  overlooking: string
  possession: string
  ownership: string
  flooring: string
  widthOfFacingRoad: string
  parking: string
  powerBackup: "Full" | "Partial" | "None"
  keyHighlights: string[]
}

function formatListing(input: ListingInput): Omit<Listing, "id" | "propertyId" | "priority" | "verified" | "views" | "enquiries" | "contactsUnlocked" | "createdAt"> {
  const pricePerSqftValue = input.areaSqft > 0 ? Math.round((input.priceCr * 1e7) / input.areaSqft) : 0
  return {
    title: input.title,
    location: input.location,
    city: input.city,
    price: `₹ ${input.priceCr} Cr`,
    pricePerSqft: `₹ ${pricePerSqftValue.toLocaleString("en-IN")}/sq.ft`,
    beds: input.beds,
    baths: input.baths,
    area: `${input.areaSqft.toLocaleString("en-IN")} sq.ft`,
    type: input.type,
    status: input.status,
    purpose: input.purpose,
    image: input.image,
    galleryImages: Array.from(new Set([input.image, ...input.galleryImages])),
    developer: input.developer.trim() || undefined,
    furnishing: input.furnishing,
    facing: input.facing.trim() || undefined,
    transactionType: input.transactionType,
    reraRegistered: input.reraRegistered,
    reraNumber: input.reraRegistered ? input.reraNumber : undefined,
    reraUrl: input.reraRegistered ? input.reraUrl : undefined,
    amenities: input.amenities,
    carpetAreaSqft: input.carpetAreaSqft,
    balconies: input.balconies,
    hasPoojaRoom: input.hasPoojaRoom,
    floorNumber: input.floorNumber,
    totalFloors: input.totalFloors,
    overlooking: input.overlooking.trim() || undefined,
    possession: input.possession.trim() || undefined,
    ownership: input.ownership.trim() || undefined,
    flooring: input.flooring.trim() || undefined,
    widthOfFacingRoad: input.widthOfFacingRoad.trim() || undefined,
    parking: input.parking.trim() || undefined,
    powerBackup: input.powerBackup,
    keyHighlights: input.keyHighlights,
  }
}

type ListingsState = {
  listings: Listing[]
  addListing: (input: ListingInput) => Listing
  updateListing: (id: string, input: ListingInput) => void
  deleteListing: (id: string) => void
  renewListing: (id: string) => void
}

/**
 * Mock seller-listing store. There's no real backend here — this is a
 * client-persisted demo seeded from the static `myListings` fixture, so
 * Add/Edit/Delete on the "My Listings" tab actually mutate what's shown
 * instead of just navigating around a fixed array.
 */
export const useListingsStore = create<ListingsState>()(
  persist(
    (set) => ({
      listings: myListings,

      addListing: (input) => {
        const id = `L-${Date.now()}`
        const listing: Listing = {
          id,
          // Self-referential — this listing has no matching entry in the static
          // seed catalog (vxp-data.ts), so its own id doubles as the property
          // id. PropertyDetailPage falls back to synthesizing a Property from
          // the listing itself (via listingToProperty) when it can't find a
          // static match, so this still resolves to a real page instead of
          // silently landing on whichever property happens to be first.
          propertyId: id,
          priority: "Organic",
          verified: false,
          views: 0,
          enquiries: 0,
          contactsUnlocked: 0,
          createdAt: new Date().toISOString().slice(0, 10),
          ...formatListing(input),
        }
        set((state) => ({ listings: [listing, ...state.listings] }))
        return listing
      },

      updateListing: (id, input) => {
        set((state) => ({
          listings: state.listings.map((l) => (l.id === id ? { ...l, ...formatListing(input) } : l)),
        }))
      },

      deleteListing: (id) => {
        set((state) => ({ listings: state.listings.filter((l) => l.id !== id) }))
      },

      renewListing: (id) => {
        set((state) => ({
          listings: state.listings.map((l) =>
            l.id === id ? { ...l, createdAt: new Date().toISOString().slice(0, 10) } : l,
          ),
        }))
      },
    }),
    {
      name: "vxp-listings-demo",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
)
