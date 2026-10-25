"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { getAccessToken } from "@/lib/auth-tokens"
import { useNav } from "@/lib/nav-store"
import { store } from "@/store/store"
import { usersApi } from "@/store/api/usersApi"

/** Display copy of a shortlisted card — see `snapshots` below. */
export type ShortlistSnapshot = {
  title: string
  location: string
  price: string
  image: string
  meta: string
  href: string
}

type ShortlistState = {
  /** Which account these ids belong to; null = saved while signed out. */
  accountId: string | null
  shortlistedIds: string[]
  /**
   * The backend's shortlist is bare listing ids, and there's no public
   * "listing by id" endpoint to turn them back into cards (/properties/
   * takes a slug, /listings/:id is owner-only). So whenever a card is
   * hearted, its display data is snapshotted here. Ids saved on another
   * device have no snapshot until hearted again here — the Shortlist tab
   * shows those as a generic "saved listing" row.
   */
  snapshots: Record<string, ShortlistSnapshot>
  /** Listing ids with a PUT/DELETE in flight — repeat clicks are ignored until it settles. */
  pending: string[]
  isShortlisted: (id: string) => boolean
  toggleShortlist: (id: string, snapshot?: ShortlistSnapshot) => void
  /** Replace local ids with the server's list (real sessions only), merging in anything hearted while signed out. */
  syncFromServer: () => Promise<void>
}

// Real listing ids are Mongo ObjectIds; mock prototype ids ("p1", "prj3")
// and project ids never go to the listings shortlist API.
export const isListingId = (id: string) => /^[a-f0-9]{24}$/i.test(id)

const signedInAccountId = () => (getAccessToken() ? useNav.getState().user?.id ?? null : null)

/**
 * Buyer shortlist. For a signed-in real account, listing ids live on the
 * server (PUT/DELETE /users/me/shortlists/:id, both idempotent) and this
 * store is an optimistic mirror of them; anything else (projects, mock
 * listings) stays client-only.
 *
 * Hearts tapped while signed out are kept (accountId null) and pushed to
 * the account on the next sync, instead of being silently dropped. A list
 * that belongs to a DIFFERENT account (a session that ended without a
 * normal logout) is discarded before syncing.
 */
export const useShortlistStore = create<ShortlistState>()(
  persist(
    (set, get) => ({
      accountId: null,
      shortlistedIds: [],
      snapshots: {},
      pending: [],

      isShortlisted: (id) => get().shortlistedIds.includes(id),

      toggleShortlist: (id, snapshot) => {
        if (get().pending.includes(id)) return
        const accountId = signedInAccountId()
        // Signed out, but the list still belongs to an account (logout only
        // clears ids, a dead session not even that) — start a fresh
        // signed-out list rather than adding to someone else's.
        if (!accountId && get().accountId) set({ accountId: null, shortlistedIds: [], snapshots: {} })
        const wasSaved = get().shortlistedIds.includes(id)
        set((state) => ({
          shortlistedIds: wasSaved
            ? state.shortlistedIds.filter((existing) => existing !== id)
            : [...state.shortlistedIds, id],
          snapshots: snapshot ? { ...state.snapshots, [id]: snapshot } : state.snapshots,
        }))

        if (!isListingId(id) || !accountId) return
        set((state) => ({ pending: [...state.pending, id], accountId }))
        const endpoint = wasSaved ? usersApi.endpoints.removeShortlist : usersApi.endpoints.addShortlist
        store
          .dispatch(endpoint.initiate(id))
          .unwrap()
          .catch(() => {
            // Revert the optimistic heart (e.g. LISTING_NOT_FOUND on a listing
            // that expired since the page loaded).
            set((state) => ({
              shortlistedIds: wasSaved
                ? [...state.shortlistedIds, id]
                : state.shortlistedIds.filter((existing) => existing !== id),
            }))
          })
          .finally(() => set((state) => ({ pending: state.pending.filter((p) => p !== id) })))
      },

      syncFromServer: async () => {
        const accountId = signedInAccountId()
        if (!accountId) return
        const state = get()
        // Someone else's leftover list — drop it rather than merging it in.
        if (state.accountId && state.accountId !== accountId) {
          set({ accountId, shortlistedIds: [], snapshots: {} })
        }
        const savedWhileSignedOut = get().accountId === null ? get().shortlistedIds.filter(isListingId) : []
        try {
          const serverIds = await store
            .dispatch(usersApi.endpoints.getShortlistIds.initiate(undefined, { forceRefetch: true }))
            .unwrap()
          const toPush = savedWhileSignedOut.filter((id) => !serverIds.includes(id))
          const pushed = await Promise.all(
            toPush.map((id) =>
              store
                .dispatch(usersApi.endpoints.addShortlist.initiate(id))
                .unwrap()
                .then(() => id)
                .catch(() => null),
            ),
          )
          const merged = [...serverIds, ...pushed.filter((id): id is string => id !== null)]
          // Keep local-only ids (projects/mock), replace listing ids with the server's truth.
          set((s) => ({
            accountId,
            shortlistedIds: [...s.shortlistedIds.filter((id) => !isListingId(id)), ...merged],
          }))
        } catch {
          // Offline / expired session — keep the last-known list.
        }
      },
    }),
    {
      name: "vxp-shortlist-demo",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        accountId: state.accountId,
        shortlistedIds: state.shortlistedIds,
        snapshots: state.snapshots,
      }),
    },
  ),
)
