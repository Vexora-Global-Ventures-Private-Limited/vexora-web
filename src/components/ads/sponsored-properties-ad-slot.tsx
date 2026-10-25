"use client"

/**
 * "Sponsored" isn't a separate slot on the backend: an approved sponsored ad
 * boosts its listing's `rank_bucket` to 0, so it surfaces at the top of
 * GET /search results themselves (tagged "Sponsored" by the card mapper).
 * There's no serving endpoint for a standalone strip, so this renders
 * nothing — kept so existing call sites don't need to change.
 */
export function SponsoredPropertiesAdSlot() {
  return null
}
