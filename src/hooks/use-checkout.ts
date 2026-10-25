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

export type CheckoutPhase = "idle" | "creating" | "confirming" | "paid" | "failed" | "timeout"

const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 30_000

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
 * Razorpay is in demo mode: there's no real checkout modal, and verify
 * accepts any payment id/signature. Activation still needs the webhook (or
 * an admin's manual activation in vexora-admin), so on the dev API an order
 * can legitimately sit in "processing" — that surfaces as phase "timeout"
 * ("still confirming, check back shortly"), never as a failure.
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
      const deadline = Date.now() + POLL_TIMEOUT_MS
      while (Date.now() < deadline) {
        if (!alive.current) return "cancelled"
        const res = await getOrder(id).unwrap().catch(() => null)
        const status = res?.status
        if (status === "paid" || status === "manually_activated" || status === "failed") return status
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
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
        if (alive.current) setPhase("failed")
      } else if (alive.current) {
        setPhase("timeout")
      }
    },
    [pendingKey, finishPaid],
  )

  const start = useCallback(
    async (createOrder: (idempotencyKey: string) => Promise<CreatedOrder>) => {
      // Guards a double-click landing before the phase re-render hides the button.
      if (inFlight.current) return
      inFlight.current = true
      setError(null)
      if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID()
      setPhase("creating")
      try {
        const created = await createOrder(idempotencyKey.current)
        if (alive.current) setOrderId(created.orderId)
        if (pendingKey) setPendingOrder(pendingKey, created.orderId)
        // Demo mode stand-in for Razorpay's checkout modal result.
        await verifyOrder({
          orderId: created.orderId,
          razorpayPaymentId: `pay_demo_${created.razorpayOrderId}`,
          razorpaySignature: "demo_signature",
        }).unwrap()
        if (alive.current) setPhase("confirming")
        await settle(await pollUntilSettled(created.orderId))
      } catch (err) {
        // Key deliberately kept: retrying this attempt must reuse it.
        if (alive.current) {
          setError(err)
          setPhase("failed")
        }
      } finally {
        inFlight.current = false
      }
    },
    [pendingKey, verifyOrder, pollUntilSettled, settle],
  )

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
    recheck,
    reset,
    forgetPending,
    isBusy: phase === "creating" || phase === "confirming",
  }
}
