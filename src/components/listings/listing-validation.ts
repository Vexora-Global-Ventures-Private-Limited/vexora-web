import { INDIAN_STATES, isValidCity, isValidPincode, isValidState } from "@/lib/profile-options"

/**
 * Field rules for the listing wizard and Venus inventory forms. The backend
 * validates almost none of these — verified live 2026-10-24 it stored a
 * 2,000-char title, pricePaise -500 / 12.5 / 1e20, purpose "lease", a plot
 * with a BHK, areaSqft -5, city "   ", state "12345", pincode "abc" and
 * media URLs like "javascript:alert(1)" — so these checks are the only gate.
 */

export { INDIAN_STATES, isValidCity, isValidPincode, isValidState }

export const TITLE_MIN = 10
export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 5000
export const LOCALITY_MAX = 80
export const ADDRESS_MAX = 200
export const MAX_PHOTOS = 20

/** ₹1,000 – ₹1,000 Cr. Whole rupees only, so paise stay exact integers. */
export const PRICE_MIN_RUPEES = 1_000
export const PRICE_MAX_RUPEES = 10_000_000_000
/** Area in sq.ft — large enough for land parcels. */
export const AREA_MIN = 50
export const AREA_MAX = 10_000_000
export const TOWER_FLOORS_MAX = 200
export const UNIT_NUMBER_MAX = 12

/** Types that never carry a BHK (the backend would happily store one anyway). */
export const NO_BHK_TYPES = new Set(["plot", "commercial", "office", "warehouse"])

export function isValidTitle(value: string) {
  const v = value.trim()
  return v.length >= TITLE_MIN && v.length <= TITLE_MAX
}

/** `digits` is the raw digit-only input. */
export function isValidPriceRupees(digits: string) {
  if (!/^\d+$/.test(digits)) return false
  const n = Number(digits)
  return n >= PRICE_MIN_RUPEES && n <= PRICE_MAX_RUPEES
}

/** Rupees (digit string) → integer paise. Integer math only — no float rounding. */
export function rupeesDigitsToPaise(digits: string): number {
  return Number(digits) * 100
}

export function isValidArea(digits: string) {
  if (!/^\d+$/.test(digits)) return false
  const n = Number(digits)
  return n >= AREA_MIN && n <= AREA_MAX
}

/** Locality / sub-locality / tower name: letters, digits and common punctuation. */
export function isValidPlaceName(value: string, max = LOCALITY_MAX) {
  const v = value.trim()
  return v.length >= 2 && v.length <= max && /^[\p{L}\p{M}\d][\p{L}\p{M}\d\s.,'/&()-]*$/u.test(v)
}

/** Photos/logos must be real https image links (no javascript:, data:, or mixed-content http). */
export function isHttpsUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === "https:" && !!url.hostname.includes(".")
  } catch {
    return false
  }
}

export function isValidUnitNumber(value: string) {
  const v = value.trim()
  return v.length >= 1 && v.length <= UNIT_NUMBER_MAX && /^[A-Za-z0-9][A-Za-z0-9/-]*$/.test(v)
}

export function isValidFloors(digits: string) {
  if (!/^\d+$/.test(digits)) return false
  const n = Number(digits)
  return n >= 1 && n <= TOWER_FLOORS_MAX
}

/** Strips everything but digits and caps the length (prevents 1e20-style input). */
export const digitsOnly = (value: string, maxLength = 11) => value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, maxLength)
