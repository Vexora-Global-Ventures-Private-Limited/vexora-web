"use client"

import { useEffect, useRef } from "react"
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

/**
 * Inverse of useSessionGuard — for guest-only pages (login/signup): bounces a
 * visitor who's *already* signed in away to `redirectTo` instead of showing
 * them the sign-in form again.
 *
 * Deliberately checks only ONCE, right when hydration finishes, instead of
 * reacting to `user` on every change like useSessionGuard does: login-page
 * and signup-page set `user` themselves the moment a fresh sign-in completes
 * *on that same page*, to show their own "Signed in!" success screen for a
 * beat before navigating away. A guard that kept watching `user` would fire
 * on that exact change and yank the visitor off to `redirectTo` immediately,
 * skipping the success screen entirely.
 */
export function useGuestGuard(redirectTo: string) {
  const router = useRouter()
  const hasHydrated = useNav((s) => s.hasHydrated)
  const ready = useNav.persist ? hasHydrated : true
  const checked = useRef(false)

  useEffect(() => {
    if (!ready || checked.current) return
    checked.current = true
    if (useNav.getState().user) router.replace(redirectTo)
  }, [ready, redirectTo, router])

  return { ready }
}
