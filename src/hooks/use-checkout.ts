"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { skipToken } from "@reduxjs/toolkit/query/react"
import {
  useGetOrderQuery,
  useLazyGetOrderQuery,
  useCreateOrderMutation,
  type Order,
  useVerifyOrderMutation,
  type CreatedOrder,
  type OrderStatus,
} from "@/store/api/billingApi"
import { baseApi, forceRefreshSession } from "@/store/api/baseApi"
import { useAppDispatch } from "@/store/hooks"
import { useLoadSession } from "@/hooks/use-auth"
import { useNav } from "@/lib/nav-store"
import { collectPayment, isFreeOrder, type RazorpayResult } from "@/lib/razorpay"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import {
  clearPendingOrder,
  getPendingOrder,
  setPendingOrder,
  subscribePendingOrders,
  type PendingOrder,
} from "@/lib/pending-orders"

/**
 * "review"  — order created, its server-side price is shown, waiting for the
 *             buyer to confirm (only when start() is called with review: true)
 * "paying"  — the Razorpay window is open
 * "free_pending" — a ₹0 order was requested; there's nothing to pay and an
 *             admin activates it (see isFreeOrder)
 */
export type CheckoutPhase = "idle" | "creating" | "review" | "paying" | "confirming" | "paid" | "failed" | "timeout" | "free_pending"

// 10-UX-Flows Flow 4: poll every 2s, back off to 5s after 30s. Past 60s the
// UI switches to "still confirming — safe to leave" (phase "timeout").
const POLL_FAST_MS = 2000
const POLL_SLOW_MS = 5000
const POLL_BACKOFF_AFTER_MS = 30_000
const POLL_TIMEOUT_MS = 60_000

// ── Pending orders, remembered across reloads ──────────────────────────────
// Stored per account on this device (lib/pending-orders.ts); the server is
// always the source of truth. Every remembered order is re-checked here.

export type { PendingOrder } from "@/lib/pending-orders"

// Re-check a remembered order this often while a screen shows it.
const PENDING_RECHECK_MS = 60_000
// Past this, the notice says it's taking unusually long and offers a way out
// (the dev API never confirms on its own; in production the webhook lands in
// seconds, so a 15-minute wait means something needs support's attention).
const PENDING_OVERDUE_MS = 15 * 60_000
// Razorpay retries webhooks for ~24h; past that the entry only blocks the UI.
const PENDING_MAX_AGE_MS = 24 * 60 * 60_000

// One activation refresh per order, however many components show it.
const settledOrders = new Set<string>()

export type TrackedPendingOrder = PendingOrder & {
  /** Waiting longer than expected — show support info. */
  overdue: boolean
  /** The order as the server last reported it (undefined until the first check). */
  order?: Order
  /** `created` = checkout was started but never paid (Razorpay window closed). */
  unpaid: boolean
}

/** Refresh everything a just-activated purchase changes (tier lives in the JWT). */
function useFinishPaid() {
  const dispatch = useAppDispatch()
  const loadSession = useLoadSession()
  return useCallback(async () => {
    // New tier only lands in the JWT on refresh.
    await forceRefreshSession().catch(() => false)
    dispatch(
      baseApi.util.invalidateTags(["Membership", "Quota", "ListingQuota", "MyListings", "Receipts", "Ads"]),
    )
    await loadSession().catch(() => {})
  }, [dispatch, loadSession])
}

/**
 * The signed-in account's remembered still-confirming order for `key`
 * (null when `key` is undefined or nothing is pending). Checks it with
 * GET /billing/orders/{id} on mount and every minute while shown, and
 * forgets it once it's paid (refreshing the session), failed, not this
 * account's (403/404) or older than a day.
 */
export function usePendingOrder(key: string | undefined): TrackedPendingOrder | null {
  const userId = useNav((s) => s.user?.id ?? null)
  const raw = useSyncExternalStore(
    subscribePendingOrders,
    () => (key && userId ? JSON.stringify(getPendingOrder(key, userId)) : "null"),
    () => "null",
  )
  const entry = useMemo(() => JSON.parse(raw) as PendingOrder | null, [raw])
  const age = entry ? Date.now() - new Date(entry.createdAt).getTime() : 0
  const expired = !!entry && !(age < PENDING_MAX_AGE_MS)

  const { data: order, error } = useGetOrderQuery(entry && !expired ? entry.orderId : skipToken, {
    pollingInterval: PENDING_RECHECK_MS,
    refetchOnMountOrArgChange: true,
  })
  const finishPaid = useFinishPaid()

  useEffect(() => {
    if (!entry || !key) return
    const status = order?._id === entry.orderId ? order.status : undefined
    const code = getApiErrorCode(error)
    if (status === "paid" || status === "manually_activated") {
      clearPendingOrder(key, entry.orderId)
      if (!settledOrders.has(entry.orderId)) {
        settledOrders.add(entry.orderId)
        void finishPaid()
      }
    } else if (status === "failed" || expired || code === "FORBIDDEN" || code === "NOT_FOUND") {
      clearPendingOrder(key, entry.orderId)
    }
  }, [entry, key, order, error, expired, finishPaid])

  if (!entry || expired) return null
  if (order?._id === entry.orderId && order.status !== "processing" && order.status !== "created") return null
  const current = order?._id === entry.orderId ? order : undefined
  return { ...entry, overdue: age > PENDING_OVERDUE_MS, order: current, unpaid: current?.status === "created" }
}

/**
 * A fresh idempotency key. crypto.randomUUID() only exists in secure
 * contexts (https / localhost) — on the LAN dev address (http://192.168…)
 * it's undefined — so fall back to getRandomValues, which works everywhere.
 */
function newIdempotencyKey(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40 // version 4
  b[8] = (b[8] & 0x3f) | 0x80 // RFC 4122 variant
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** The open order's id, from 409 ORDER_ALREADY_IN_PROGRESS's message. */
function openOrderId(err: unknown): string | null {
  return /\b[a-f0-9]{24}\b/i.exec(getApiErrorMessage(err) ?? "")?.[0] ?? null
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
  // The payment Razorpay returned for an order, kept until it settles, so a
  // failed verify is retried without opening Razorpay again.
  const collectedPayment = useRef<{ orderId: string; result: RazorpayResult } | null>(null)
  const inFlight = useRef(false)
  // The created order waiting in "review" (or being paid).
  const [reviewOrder, setReviewOrder] = useState<CreatedOrder | null>(null)
  const description = useRef<string | undefined>(undefined)
  // Stops the poll loop (and any state updates) once the component is gone.
  const alive = useRef(true)
  const [verifyOrder] = useVerifyOrderMutation()
  const [createOrder] = useCreateOrderMutation()
  const [getOrder] = useLazyGetOrderQuery()
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

  const finishPaid = useFinishPaid()

  const settle = useCallback(
    async (status: OrderStatus | "timeout" | "cancelled") => {
      if (status === "cancelled") return
      if (status === "paid" || status === "manually_activated") {
        if (pendingKey) clearPendingOrder(pendingKey)
        idempotencyKey.current = null
        collectedPayment.current = null
        await finishPaid()
        if (alive.current) setPhase("paid")
      } else if (status === "failed") {
        // A failed order is never retried — the next attempt gets a fresh key.
        if (pendingKey) clearPendingOrder(pendingKey)
        idempotencyKey.current = null
        collectedPayment.current = null
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
      if (isFreeOrder(created)) {
        // Nothing to pay — remember the request so the page shows it's waiting.
        if (pendingKey) setPendingOrder(pendingKey, created.orderId)
        if (alive.current) setPhase("free_pending")
        return
      }
      // Already paid in Razorpay but verify didn't get through (network
      // drop)? Re-send verify with the same payment — never ask for money
      // twice. The idempotency key only prevents a second ORDER.
      const collected = collectedPayment.current?.orderId === created.orderId ? collectedPayment.current.result : null
      let result: RazorpayResult
      if (collected) {
        result = collected
      } else {
        setPhase("paying")
        const user = useNav.getState().user
        result = await collectPayment(created, {
          description: description.current,
          prefill: user ? { name: user.name || undefined, email: user.email || undefined, contact: user.phone || undefined } : undefined,
        })
        collectedPayment.current = { orderId: created.orderId, result }
      }
      // Only now is there money in flight worth remembering across reloads —
      // a created-but-unpaid order (window closed, review abandoned) isn't.
      if (pendingKey) setPendingOrder(pendingKey, created.orderId)
      if (alive.current) setPhase("confirming")
      // Safe to repeat with the same payment (backend, 2026-10-31): a repeat
      // returns the order's real current status — already `paid` if the
      // webhook got there first, so no polling is needed then.
      const verified = await verifyOrder({ orderId: created.orderId, ...result }).unwrap()
      const status = verified?.status
      await settle(status === "paid" || status === "manually_activated" || status === "failed" ? status : await pollUntilSettled(created.orderId))
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
  /**
   * For a 409 ORDER_ALREADY_IN_PROGRESS: if the open order is unpaid
   * (`created`) and for the same thing (`match`), return its idempotency key
   * so the caller can replay the create and get that same order back.
   */
  const reuseOpenOrder = useCallback(async (err: unknown, match?: { purpose: string; planId?: string }): Promise<string | null> => {
    if (!match || getApiErrorCode(err) !== "ORDER_ALREADY_IN_PROGRESS") return null
    const id = openOrderId(err)
    if (!id) return null
    const open = await getOrder(id).unwrap().catch(() => null)
    if (!open || open.status !== "created" || !open.idempotencyKey) return null
    if (open.purpose !== match.purpose || (open.planId ?? undefined) !== (match.planId ?? undefined)) return null
    return open.idempotencyKey
  }, [getOrder])

  const start = useCallback(
    async (
      createOrder: (idempotencyKey: string) => Promise<CreatedOrder>,
      options: {
        review?: boolean
        description?: string
        /**
         * What this order is for. If the backend refuses because the member
         * already has an UNPAID order for exactly this (409
         * ORDER_ALREADY_IN_PROGRESS), that order is reused instead of
         * failing: its own idempotency key is replayed, which returns the
         * same order (verified live 2026-10-31), and checkout carries on.
         */
        resumable?: { purpose: string; planId?: string }
      } = {},
    ) => {
      // Guards a double-click landing before the phase re-render hides the button.
      if (inFlight.current) return
      inFlight.current = true
      setError(null)
      description.current = options.description
      if (!idempotencyKey.current) idempotencyKey.current = newIdempotencyKey()
      setPhase("creating")
      try {
        let created: CreatedOrder
        try {
          created = await createOrder(idempotencyKey.current)
        } catch (err) {
          const reused = await reuseOpenOrder(err, options.resumable)
          if (!reused) throw err
          idempotencyKey.current = reused
          created = await createOrder(reused)
        }
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
        // A different open order (another plan, or already paid and
        // confirming) — remember it like our own so the page locks buying
        // and tracks it until it's confirmed, paid or rejected.
        if (pendingKey && getApiErrorCode(err) === "ORDER_ALREADY_IN_PROGRESS") {
          const existingId = openOrderId(err)
          if (existingId) setPendingOrder(pendingKey, existingId)
        }
        fail(err)
      } finally {
        inFlight.current = false
      }
    },
    [pay, fail, pendingKey, reuseOpenOrder],
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

  /**
   * Finish paying an order that was started but never paid (status
   * `created` — e.g. the Razorpay window was closed, on any device). The
   * backend blocks new membership orders while it's open (409
   * ORDER_ALREADY_IN_PROGRESS), so this is how the member gets unstuck.
   * Replaying the create with the order's own idempotency key returns that
   * same order with its Razorpay key (verified live 2026-10-31).
   */
  const resume = useCallback(
    (order: Order, options: { description?: string } = {}) => {
      if (!order.idempotencyKey || !order.purpose.startsWith("membership_")) return Promise.resolve()
      idempotencyKey.current = order.idempotencyKey
      return start(
        (key) =>
          createOrder({
            purpose: order.purpose,
            planId: order.planId,
            ...(order.referralCode ? { referralCode: order.referralCode } : {}),
            idempotencyKey: key,
          }).unwrap(),
        options,
      )
    },
    [start, createOrder],
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
    collectedPayment.current = null
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
    resume,
    /** The created order (amount etc.) — set from "review" onwards. */
    order: reviewOrder,
    recheck,
    reset,
    forgetPending,
    isBusy: phase === "creating" || phase === "paying" || phase === "confirming",
  }
}
