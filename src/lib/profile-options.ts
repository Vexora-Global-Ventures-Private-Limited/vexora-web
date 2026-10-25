import type { ProfileIntent } from "@/store/api/usersApi"

/**
 * Shared option lists + validators for every profile form (Settings and the
 * signup profile step). The backend validates none of these fields — it
 * stored a 600-char name, "   " as a city, "12345" as a state and "000000"
 * as a pincode (verified live 2026-10-24) — so the frontend is the only
 * gate until server-side validation lands.
 */

export const INTENT_OPTIONS: { value: ProfileIntent; label: string }[] = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Owner / Seller" },
  { value: "broker", label: "Broker" },
  { value: "developer", label: "Developer" },
]

/** All 28 states + 8 union territories. Static — there's no states API. */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const

export const NAME_MAX_LENGTH = 60
export const CITY_MAX_LENGTH = 50

/** Letters in any script (incl. Indic vowel signs — \p{M}), spaces, dots, apostrophes, hyphens; 2–60 chars. */
export function isValidFullName(value: string | null | undefined): boolean {
  const v = (value ?? "").trim()
  return v.length >= 2 && v.length <= NAME_MAX_LENGTH && /^[\p{L}][\p{L}\p{M}\s.'-]*$/u.test(v)
}

/** Letters, spaces, dots and hyphens; 2–50 chars. Free text — the Location Master is too sparse to restrict to. */
export function isValidCity(value: string | null | undefined): boolean {
  const v = (value ?? "").trim()
  return v.length >= 2 && v.length <= CITY_MAX_LENGTH && /^[\p{L}][\p{L}\p{M}\s.-]*$/u.test(v)
}

export function isValidState(value: string | null | undefined): boolean {
  return (INDIAN_STATES as readonly string[]).includes((value ?? "").trim())
}

/** Indian PIN codes are 6 digits and never start with 0. */
export function isValidPincode(value: string | null | undefined): boolean {
  return /^[1-9]\d{5}$/.test(value ?? "")
}

/** Indian mobile numbers (without +91) are 10 digits starting 6–9. */
export function isValidIndianMobile(value: string): boolean {
  return /^[6-9]\d{9}$/.test(value)
}

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())

/** Optional field — must be an https image URL when set. */
export function isValidAvatarUrl(value: string | null | undefined): boolean {
  const v = (value ?? "").trim()
  if (!v) return true
  try {
    return new URL(v).protocol === "https:"
  } catch {
    return false
  }
}
