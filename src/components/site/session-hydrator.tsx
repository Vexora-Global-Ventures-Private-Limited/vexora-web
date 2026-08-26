"use client"

import { useEffect } from "react"
import { useNav } from "@/lib/nav-store"
import { useContactStore } from "@/lib/contact-store"
import { useNotificationsStore } from "@/lib/notifications-store"
import { useListingsStore } from "@/lib/listings-store"
import { useLeadsStore } from "@/lib/leads-store"
import { useProjectsStore } from "@/lib/projects-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { useLazyGetMeQuery } from "@/store/api/authApi"
import { mapApiUserToNavUser } from "@/hooks/use-auth"
import { getAccessToken } from "@/lib/auth-tokens"

/** Rehydrates the persisted mock session + demo state after mount (persist uses skipHydration to avoid SSR mismatch). */
export function SessionHydrator() {
  const hasHydrated = useNav((s) => s.hasHydrated)
  const setNavUser = useNav((s) => s.login)
  const [triggerGetMe] = useLazyGetMeQuery()

  useEffect(() => {
    useNav.persist?.rehydrate()
    useContactStore.persist?.rehydrate()
    useNotificationsStore.persist?.rehydrate()
    useListingsStore.persist?.rehydrate()
    useLeadsStore.persist?.rehydrate()
    useProjectsStore.persist?.rehydrate()
    useShortlistStore.persist?.rehydrate()
  }, [])

  // On every hard reload, re-fetch the real profile from the server instead
  // of trusting whatever the localStorage snapshot says — so name/avatar
  // changes made elsewhere (or on another device) show up immediately in the
  // navbar and everywhere else that reads useNav().user. Skipped entirely
  // when there's no access token: that means either a logged-out visitor or
  // a client-only demo account, and calling a bearer-authenticated endpoint
  // with no token would just 401 and (via the reauth wrapper) log the demo
  // session out for no reason.
  useEffect(() => {
    if (!hasHydrated || !getAccessToken()) return
    triggerGetMe()
      .unwrap()
      .then((me) => {
        setNavUser(mapApiUserToNavUser(me.data.user, me.data.profile, useNav.getState().user))
      })
      .catch(() => {
        // A real failure (expired/invalid session) is already handled by the
        // reauth wrapper in baseApi.ts, which clears tokens and logs out.
        // Anything else (e.g. offline) just leaves the last-known state.
      })
  }, [hasHydrated, triggerGetMe, setNavUser])

  return null
}
