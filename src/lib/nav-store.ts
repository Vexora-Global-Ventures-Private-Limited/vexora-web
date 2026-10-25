"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type Tier = "F" | "M" | "J" | "V"

export type User = {
  /** Backend user id — absent only on the client-only demo accounts below. */
  id?: string
  name: string
  email: string
  phone?: string
  initials: string
  tier: Tier
  tierName: string
  avatarColor: string
  /** Profile photo (https URL) — initials are shown when absent. */
  avatarUrl?: string | null
}

type NavState = {
  user: User | null
  hasHydrated: boolean
  login: (user: User) => void
  logout: () => void
  setUserTier: (tier: Tier) => void
  setHasHydrated: (v: boolean) => void
}

export const tierName = (t: Tier) => {
  if (t === "F") return "Free Member"
  if (t === "M") return "Mercury Partner"
  if (t === "J") return "Jupiter Partner"
  return "Venus Partner"
}

/** Tier ladder for upgrade/downgrade comparisons — matches the docs' `user < mercury < jupiter < venus` rule. */
export const TIER_RANK: Record<Tier, number> = { F: 0, M: 1, J: 2, V: 3 }

/**
 * Whether this user has seller tools (My Listings, Lead Pipeline, etc.)
 * available. Free never does — it has zero listing quota, nothing to sell
 * with. Mercury/Jupiter/Venus always do — a seller there can still buy
 * elsewhere too, so owning listings never locks anyone out of browsing.
 */
export function canSell(user: User | null): boolean {
  if (!user) return false
  return user.tier !== "F"
}

/**
 * Mock session store. There's no real backend/auth here — this is a
 * client-persisted demo session only, so a page refresh doesn't lose the
 * logged-in user. `skipHydration` avoids a hydration mismatch, since SSR
 * always renders `user: null`; `SessionHydrator` triggers the real
 * rehydration once mounted client-side.
 *
 * `hasHydrated` lives in the store itself (rather than being tracked via
 * persist's external `onFinishHydration` listener) because localStorage is
 * synchronous: `rehydrate()` can finish before a *different* component's
 * effect gets a chance to register a listener for it, so that listener would
 * silently miss the event and the page would hang blank forever waiting on
 * it. Reading `hasHydrated` as normal store state instead goes through
 * zustand's regular subscription path, which every subscriber (regardless of
 * mount order) reliably picks up — the same path `user` already relies on.
 */
export const useNav = create<NavState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,

      login: (user) => set({ user }),
      logout: () => set({ user: null }),

      setUserTier: (tier) =>
        set((state) => {
          if (!state.user) return {}
          return { user: { ...state.user, tier, tierName: tierName(tier) } }
        }),

      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "vxp-session",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)

const mkUser = (over: Partial<User> & { tier: Tier }): User => ({
  name: "Aarav Mehta",
  email: "aarav.mehta@gmail.com",
  phone: "+91 98765 43210",
  initials: "AM",
  avatarColor: "#bd9935",
  tierName: tierName(over.tier),
  ...over,
})

/** Mock users per tier — used by the auth flows. F never has seller tools; M/J/V always do (see canSell()). */
export const mockUsers: Record<Tier, User> = {
  F: mkUser({ tier: "F", name: "Priya Desai", initials: "PD", email: "priya.desai@gmail.com", avatarColor: "#6b5d48" }),
  M: mkUser({ tier: "M", name: "Aarav Mehta", initials: "AM" }),
  J: mkUser({ tier: "J", name: "Anjali Iyer", initials: "AI" }),
  V: mkUser({ tier: "V", name: "Vikram Shah", initials: "VS" }),
}
