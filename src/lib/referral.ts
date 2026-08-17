import type { User } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"

/**
 * Deterministic (no randomness) so the same user always gets the same code
 * across renders/SSR — first name + tier letter + a fixed 4-digit suffix.
 */
export function getReferralCode(user: User): string {
  const firstName = user.name.split(" ")[0].toUpperCase()
  return `${firstName}-${user.tier}2026`
}

export function getReferralShareUrl(code: string): string {
  return `${ROUTES.membership}?ref=${code}`
}
