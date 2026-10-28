import { HOMEPAGE_IMAGES } from "@/lib/homepage-images"
import type { ShortlistSnapshot } from "@/lib/shortlist-store"

export type ShortlistItem = {
  kind: "property"
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

/** Resolves shortlisted listing ids into a display-ready list, in the order
 *  they were added. Listings render from the snapshot taken when they were
 *  hearted (the API has no "listing by id" lookup); one without a snapshot —
 *  saved on another device — gets a generic row instead of being silently
 *  dropped. Leftover ids from the old mock catalog ("p1", "prj1"…) are skipped. */
export function buildShortlistItems(shortlistedIds: string[], snapshots: Record<string, ShortlistSnapshot>): ShortlistItem[] {
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
      return null
    })
    .filter((x): x is ShortlistItem => x !== null)
}
