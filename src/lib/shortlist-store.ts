"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type ShortlistState = {
  shortlistedIds: string[]
  isShortlisted: (id: string) => boolean
  toggleShortlist: (id: string) => void
}

/**
 * Mock buyer shortlist store. There's no real backend here — this is a
 * client-persisted demo, same pattern as `contact-store.ts`. Starts empty
 * (honest default — a new buyer hasn't shortlisted anything yet) rather than
 * pre-seeded with fake favorites. Holds both property ids ("p*") and project
 * ids ("prj*") in one flat list — the prefixes never collide, so one store
 * covers both without needing to track which kind an id belongs to.
 */
export const useShortlistStore = create<ShortlistState>()(
  persist(
    (set, get) => ({
      shortlistedIds: [],

      isShortlisted: (id) => get().shortlistedIds.includes(id),

      toggleShortlist: (id) => {
        set((state) => ({
          shortlistedIds: state.shortlistedIds.includes(id)
            ? state.shortlistedIds.filter((existing) => existing !== id)
            : [...state.shortlistedIds, id],
        }))
      },
    }),
    {
      name: "vxp-shortlist-demo",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
)
