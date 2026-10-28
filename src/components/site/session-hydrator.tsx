"use client"

import { useEffect } from "react"
import { useNav } from "@/lib/nav-store"
import { useContactStore } from "@/lib/contact-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { useLoadSession } from "@/hooks/use-auth"
import { getAccessToken } from "@/lib/auth-tokens"
import { baseApi } from "@/store/api/baseApi"
import { useAppDispatch } from "@/store/hooks"

// localStorage keys written by nav-store / auth-tokens / shortlist-store.
const SESSION_KEYS = new Set(["vxp-session", "vxp-access-token", "vxp-refresh-token", "vxp-shortlist-demo"])

/** Rehydrates the persisted session + local stores after mount (persist uses skipHydration to avoid SSR mismatch). */
export function SessionHydrator() {
  const hasHydrated = useNav((s) => s.hasHydrated)
  const loadSession = useLoadSession()
  const dispatch = useAppDispatch()

  useEffect(() => {
    useNav.persist?.rehydrate()
    useContactStore.persist?.rehydrate()
    useShortlistStore.persist?.rehydrate()
  }, [])

  // On every hard reload, re-fetch the real profile + tier from the server instead
  // of trusting whatever the localStorage snapshot says — so name/avatar
  // changes made elsewhere (or on another device) show up immediately in the
  // navbar and everywhere else that reads useNav().user. Skipped entirely
  // when there's no access token: that means either a logged-out visitor or
  // a client-only demo account, and calling a bearer-authenticated endpoint
  // with no token would just 401 and (via the reauth wrapper) log the demo
  // session out for no reason.
  useEffect(() => {
    if (!hasHydrated || !getAccessToken()) return
    loadSession().catch(() => {
      // A real failure (expired/invalid session) is already handled by the
      // reauth wrapper in baseApi.ts, which clears tokens and logs out.
      // Anything else (e.g. offline) just leaves the last-known state.
    })
  }, [hasHydrated, loadSession])

  // Any sign-out — the user's own, or baseApi ending a dead session after a
  // failed refresh — drops the account's per-device data and every cached
  // API response, so nothing from the old account can show for the next one.
  // (baseApi can't do this itself: importing these stores there would be a
  // circular import through the Redux store.)
  useEffect(() => {
    if (!hasHydrated) return
    return useNav.subscribe((state, prev) => {
      if (prev.user && !state.user) {
        useShortlistStore.setState({ accountId: null, shortlistedIds: [], snapshots: {} })
        useContactStore.getState().clearApiLeads()
        dispatch(baseApi.util.resetApiState())
      }
    })
  }, [hasHydrated, dispatch])

  // Signing in or out in another tab only writes localStorage; this tab's
  // in-memory stores wouldn't notice and would keep showing a dead (or
  // stale) session. The `storage` event fires in every OTHER tab on each
  // write, so re-read the session from it. key === null means storage was
  // cleared wholesale.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && !SESSION_KEYS.has(e.key)) return
      const before = useNav.getState().user?.id ?? null
      useNav.persist?.rehydrate()
      useShortlistStore.persist?.rehydrate()
      const after = useNav.getState().user?.id ?? null
      if (before !== after) {
        // Different account (or none): never let cached data from the old one show.
        dispatch(baseApi.util.resetApiState())
        if (after && getAccessToken()) loadSession().catch(() => {})
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [dispatch, loadSession])

  return null
}
