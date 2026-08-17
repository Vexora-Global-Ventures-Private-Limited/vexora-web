"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useNav, type User } from "@/lib/nav-store"

/**
 * Waits for the persisted mock session to rehydrate from localStorage, then
 * redirects if `predicate` fails. There's no real backend here — this only
 * guards client-side view access for the demo, not actual authorization.
 *
 * `ready` reads the store's own `hasHydrated` field (set by `SessionHydrator`
 * via `rehydrate()`) rather than persist's external `onFinishHydration`
 * listener — see the comment on `hasHydrated` in nav-store.ts for why that
 * listener is racy and this isn't.
 *
 * `useNav.persist` is guarded with optional chaining: some bundler/module
 * combinations (observed with Turbopack's SSR build of zustand's ESM entry
 * points) fail to attach the `persist` API to the store. When that happens
 * we degrade gracefully to "always ready" instead of hanging forever waiting
 * on a rehydration that will never be triggered.
 */
export function useSessionGuard(predicate: (user: User | null) => boolean, redirectTo: string) {
  const user = useNav((s) => s.user)
  const hasHydrated = useNav((s) => s.hasHydrated)
  const router = useRouter()
  const ready = useNav.persist ? hasHydrated : true

  useEffect(() => {
    if (ready && !predicate(user)) {
      router.replace(redirectTo)
    }
  }, [ready, user, predicate, redirectTo, router])

  return { ready, user }
}
