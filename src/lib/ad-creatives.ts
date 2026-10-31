"use client"

/**
 * Each ad's creative (image + click-through link), remembered on the device
 * that uploaded it. The API never returns creatives to the owner — GET
 * /ads/mine and GET /ads/{id} leave them out (verified 2026-10-31,
 * UNRESOLVED-ISSUES #25) — so the Advertiser dashboard reads them from here,
 * or from the live home banner when it's this ad. Once the API includes
 * creatives, `adCreative()` prefers them.
 */
const KEY = "vxp-ad-creatives"

export type StoredCreative = { imageUrl: string; targetUrl: string | null }

function readAll(): Record<string, StoredCreative> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, StoredCreative>
  } catch {
    return {}
  }
}

export function rememberAdCreative(adId: string, creative: StoredCreative) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [adId]: creative }))
  } catch {
    // Storage blocked — the dashboard just won't have a thumbnail.
  }
}

export function getRememberedCreative(adId: string): StoredCreative | null {
  if (typeof window === "undefined") return null
  return readAll()[adId] ?? null
}
