"use client"

import { useNav } from "@/lib/nav-store"

/**
 * Payments that were collected but haven't confirmed yet, remembered across
 * reloads so a "processing" order doesn't look unpaid and invite paying
 * twice. There's no "list my orders" endpoint, so the device has to
 * remember the order id — but it's only a hint: `usePendingOrder` (in
 * use-checkout.ts) re-checks every entry with the server and drops it as
 * soon as the order settles, isn't this account's, or is too old.
 *
 * Stored per account (`vxp-pending-orders:<userId>`) so one account's
 * payment never blocks another account signed in on the same browser.
 */

const STORAGE_PREFIX = "vxp-pending-orders"
// Before 2026-10-30 entries were stored under one key for every account.
const LEGACY_KEY = STORAGE_PREFIX

export type PendingOrder = { orderId: string; createdAt: string }
type PendingMap = Record<string, PendingOrder>

const listeners = new Set<() => void>()
let legacyCleared = false

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

function currentUserId(): string | null {
  return useNav.getState().user?.id ?? null
}

function read(userId: string): PendingMap {
  try {
    // Legacy entries can't be tied to an account (they blocked every account
    // on the browser, including brand-new ones) — discard them.
    if (!legacyCleared) {
      window.localStorage.removeItem(LEGACY_KEY)
      legacyCleared = true
    }
    return JSON.parse(window.localStorage.getItem(storageKey(userId)) ?? "{}") as PendingMap
  } catch {
    return {}
  }
}

function write(userId: string, next: PendingMap) {
  try {
    if (Object.keys(next).length === 0) window.localStorage.removeItem(storageKey(userId))
    else window.localStorage.setItem(storageKey(userId), JSON.stringify(next))
  } catch {
    // Storage blocked (private mode etc.) — the in-page flow still works.
  }
  listeners.forEach((notify) => notify())
}

export function getPendingOrder(key: string, userId = currentUserId()): PendingOrder | null {
  if (typeof window === "undefined" || !userId) return null
  return read(userId)[key] ?? null
}

export function setPendingOrder(key: string, orderId: string) {
  const userId = currentUserId()
  if (!userId) return
  write(userId, { ...read(userId), [key]: { orderId, createdAt: new Date().toISOString() } })
}

/** Forget `key` — only if it still points at `orderId`, when given (a newer payment may have replaced it). */
export function clearPendingOrder(key: string, orderId?: string) {
  const userId = currentUserId()
  if (!userId) return
  const all = read(userId)
  if (!all[key] || (orderId && all[key].orderId !== orderId)) return
  delete all[key]
  write(userId, all)
}

/** For useSyncExternalStore: this tab's writes plus other tabs' (the `storage` event). */
export function subscribePendingOrders(notify: () => void) {
  listeners.add(notify)
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith(STORAGE_PREFIX)) notify()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(notify)
    window.removeEventListener("storage", onStorage)
  }
}
