"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  useLazyGetOrderQuery,
  useVerifyOrderMutation,
  type CreatedOrder,
  type OrderStatus,
} from "@/store/api/billingApi"
import { baseApi, forceRefreshSession } from "@/store/api/baseApi"
import { useAppDispatch } from "@/store/hooks"
import { useLoadSession } from "@/hooks/use-auth"
import { useNav } from "@/lib/nav-store"
import { collectPayment } from "@/lib/razorpay"

/**
 * "review"  — order created, its server-side price is shown, waiting for the
 *             buyer to confirm (only when start() is called with review: true)
 * "paying"  — the Razorpay window is open
 */
export type CheckoutPhase = "idle" | "creating" | "review" | "paying" | "confirming" | "paid" | "failed" | "timeout"

// 10-UX-Flows Flow 4: poll every 2s, back off to 5s after 30s. Past 60s the
// UI switches to "still confirming — safe to leave" (phase "timeout").
const POLL_FAST_MS = 2000
const POLL_SLOW_MS = 5000
const POLL_BACKOFF_AFTER_MS = 30_000
const POLL_TIMEOUT_MS = 60_000

// ── Pending orders, remembered across reloads ──────────────────────────────
// On the dev API (and briefly in production) a paid order can sit in
// "processing" until the webhook lands. The thing being bought doesn't show
// that state anywhere (an ad stays "draft", /memberships/me stays as it was),
// and there's no "list my orders" endpoint — so without this, a reload makes
// a payment that's still confirming look unpaid and invites paying twice.
// Per-device convenience only; the backend stays the source of truth.

const PENDING_KEY = "vxp-pending-orders"

export type PendingOrder = { orderId: string; createdAt: string }

function readPending(): Record<string, PendingOrder> {
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_KEY) ?? "{}") as Record<string, PendingOrder>
  } catch {
    return {}
  }
}

function writePending(next: Record<string, PendingOrder>) {
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked (private mode etc.) — the in-page flow still works.
  }
}

export function getPendingOrder(key: string): PendingOrder | null {
  if (typeof window === "undefined") return null
  return readPending()[key] ?? null
}

// localStorage has no change events within the same tab, so this re-reads on
// every render (cheap) — and never on the server, avoiding hydration drift.
const subscribeNoop = () => () => {}

/** The remembered still-confirming order for `key`, if any (null when `key` is undefined). */
export function usePendingOrder(key: string | undefined): PendingOrder | null {
  const raw = useSyncExternalStore(
    subscribeNoop,
    () => (key ? JSON.stringify(getPendingOrder(key)) : "null"),
    () => "null",
  )
  return JSON.parse(raw) as PendingOrder | null
}

function setPendingOrder(key: string, orderId: string) {
  writePending({ ...readPending(), [key]: { orderId, createdAt: new Date().toISOString() } })
}

function clearPendingOrder(key: string) {
  const all = readPending()
  delete all[key]
  writePending(all)
}

/** Pending-order key for an ad's payment. */
export const adPendingKey = (adId: string) => `ad:${adId}`
/** Pending-order key for a membership purchase (one at a time per account/device). */
export const MEMBERSHIP_PENDING_KEY = "membership"

/**
 * The shared async payment flow every purchase uses (memberships, slots,
 * listing renewals, ads):
 *
 *   create order → verify (just flips to "processing")
 *     → poll GET /billing/orders/:id until "paid" / "manually_activated"
 *     → POST /auth/refresh so the access token carries the new tier
 *       (tier is baked into the JWT — KNOWN-ISSUES #17)
 *     → reload the session (header tier, etc.)
 *
 * Payment is collected in Razorpay's own checkout window (lib/razorpay.ts).
 * On the dev API Razorpay is in demo mode, so the window is skipped and a
 * stand-in result is verified instead. Activation still needs the webhook
 * (or an admin's manual activation in vexora-admin), so an order can
 * legitimately sit in "processing" — that surfaces as phase "timeout"
 * ("still confirming, check back shortly"), never as a failure.
 *
 * Closing the Razorpay window → phase "failed" with a PaymentDismissedError.
 * The idempotency key is kept, so "Try again" re-opens the SAME order.
 *
 * Idempotency (verified live 2026-10-24: same key → same order, new key →
 * a second order): the key is generated once per purchase attempt and kept
 * across retries of that attempt (`start` again after a network/API error),
 * so a request that actually reached the server can never create a second
 * order. It's only dropped when the order settles (paid / failed) or on
 * `reset`, which starts a genuinely new attempt.
 *
 * `pendingKey` (optional) remembers the order across reloads — see above.
 */
export function useCheckout({ pendingKey }: { pendingKey?: string } = {}) {
  const [phase, setPhase] = useState<CheckoutPhase>("idle")
  const [error, setError] = useState<unknown>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const idempotencyKey = useRef<string | null>(null)
  const inFlight = useRef(false)
  // The created order waiting in "review" (or being paid).
  const [reviewOrder, setReviewOrder] = useState<CreatedOrder | null>(null)
  const description = useRef<string | undefined>(undefined)
  // Stops the poll loop (and any state updates) once the component is gone.
  const alive = useRef(true)
  const [verifyOrder] = useVerifyOrderMutation()
  const [getOrder] = useLazyGetOrderQuery()
  const loadSession = useLoadSession()
  const dispatch = useAppDispatch()

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const pollUntilSettled = useCallback(
    async (id: string): Promise<OrderStatus | "timeout" | "cancelled"> => {
      const startedAt = Date.now()
      while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
        if (!alive.current) return "cancelled"
        const res = await getOrder(id).unwrap().catch(() => null)
        const status = res?.status
        if (status === "paid" || status === "manually_activated" || status === "failed") return status
        const wait = Date.now() - startedAt < POLL_BACKOFF_AFTER_MS ? POLL_FAST_MS : POLL_SLOW_MS
        await new Promise((r) => setTimeout(r, wait))
      }
      return "timeout"
    },
    [getOrder],
  )

  const finishPaid = useCallback(async () => {
    // New tier only lands in the JWT on refresh.
    await forceRefreshSession().catch(() => false)
    dispatch(
      baseApi.util.invalidateTags(["Membership", "Quota", "ListingQuota", "MyListings", "Receipts", "Ads"]),
    )
    await loadSession().catch(() => {})
  }, [dispatch, loadSession])

  const settle = useCallback(
    async (status: OrderStatus | "timeout" | "cancelled") => {
      if (status === "cancelled") return
      if (status === "paid" || status === "manually_activated") {
        if (pendingKey) clearPendingOrder(pendingKey)
        idempotencyKey.current = null
        await finishPaid()
        if (alive.current) setPhase("paid")
      } else if (status === "failed") {
        // A failed order is never retried — the next attempt gets a fresh key.
        if (pendingKey) clearPendingOrder(pendingKey)
        idempotencyKey.current = null
        setReviewOrder(null)
        if (alive.current) setPhase("failed")
      } else if (alive.current) {
        setPhase("timeout")
      }
    },
    [pendingKey, finishPaid],
  )

  // Razorpay window → verify (flips to "processing") → poll.
  const pay = useCallback(
    async (created: CreatedOrder) => {
      setPhase("paying")
      const user = useNav.getState().user
      const result = await collectPayment(created, {
        description: description.current,
        prefill: user ? { name: user.name || undefined, email: user.email || undefined, contact: user.phone || undefined } : undefined,
      })
      // Only now is there money in flight worth remembering across reloads —
      // a created-but-unpaid order (window closed, review abandoned) isn't.
      if (pendingKey) setPendingOrder(pendingKey, created.orderId)
      if (alive.current) setPhase("confirming")
      await verifyOrder({ orderId: created.orderId, ...result }).unwrap()
      await settle(await pollUntilSettled(created.orderId))
    },
    [pendingKey, verifyOrder, pollUntilSettled, settle],
  )

  const fail = useCallback((err: unknown) => {
    // Key deliberately kept: retrying this attempt must reuse it (same order).
    if (alive.current) {
      setError(err)
      setPhase("failed")
    }
  }, [])

  /**
   * Create the order and collect payment. `review: true` stops after the
   * order is created (phase "review") so the server's price can be shown
   * before paying — call `confirm()` to continue.
   */
  const start = useCallback(
    async (
      createOrder: (idempotencyKey: string) => Promise<CreatedOrder>,
      options: { review?: boolean; description?: string } = {},
    ) => {
      // Guards a double-click landing before the phase re-render hides the button.
      if (inFlight.current) return
      inFlight.current = true
      setError(null)
      description.current = options.description
      if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID()
      setPhase("creating")
      try {
        const created = await createOrder(idempotencyKey.current)
        if (alive.current) {
          setOrderId(created.orderId)
          setReviewOrder(created)
        }
        if (options.review) {
          if (alive.current) setPhase("review")
          return
        }
        await pay(created)
      } catch (err) {
        fail(err)
      } finally {
        inFlight.current = false
      }
    },
    [pay, fail],
  )

  /** Continue from "review": pay for the order that was just created. */
  const confirm = useCallback(async () => {
    if (!reviewOrder || inFlight.current) return
    inFlight.current = true
    setError(null)
    try {
      await pay(reviewOrder)
    } catch (err) {
      fail(err)
    } finally {
      inFlight.current = false
    }
  }, [reviewOrder, pay, fail])

  /** Re-poll an order still "processing" — this one, or one remembered from an earlier visit. */
  const recheck = useCallback(
    async (existingOrderId?: string) => {
      const id = existingOrderId ?? orderId
      if (!id || inFlight.current) return
      inFlight.current = true
      setOrderId(id)
      setError(null)
      setPhase("confirming")
      try {
        await settle(await pollUntilSettled(id))
      } finally {
        inFlight.current = false
      }
    },
    [orderId, pollUntilSettled, settle],
  )

  /** Start a genuinely new purchase attempt (fresh idempotency key). */
  const reset = useCallback(() => {
    idempotencyKey.current = null
    setOrderId(null)
    setReviewOrder(null)
    setError(null)
    setPhase("idle")
  }, [])

  /** Forget a remembered order (e.g. it turned out paid/failed elsewhere). */
  const forgetPending = useCallback(() => {
    if (pendingKey) clearPendingOrder(pendingKey)
  }, [pendingKey])

  return {
    phase,
    error,
    orderId,
    start,
    confirm,
    /** The created order (amount etc.) — set from "review" onwards. */
    order: reviewOrder,
    recheck,
    reset,
    forgetPending,
    isBusy: phase === "creating" || phase === "paying" || phase === "confirming",
  }
}
