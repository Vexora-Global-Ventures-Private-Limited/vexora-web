import { baseApi, forceRefreshSession } from "./baseApi"
import { getAccessTokenClaims } from "@/lib/auth-tokens"
import type { Tier } from "@/lib/nav-store"

export type ApiTier = "mercury" | "jupiter" | "venus"

// GET /memberships/me — `{ tier: null }` is the normal Free User response,
// not an error. Only members get status/expiresAt/plan.
export type MyMembership = {
  tier: ApiTier | null
  status?: string
  expiresAt?: string
  plan?: unknown
}

const TIER_FROM_API: Record<ApiTier, Tier> = { mercury: "M", jupiter: "J", venus: "V" }

/** Maps the backend tier name to the app's single-letter tier. Lapsed/expired memberships count as Free. */
export function toNavTier(membership: MyMembership | null | undefined): Tier {
  if (!membership?.tier || (membership.status && membership.status !== "active")) return "F"
  return TIER_FROM_API[membership.tier] ?? "F"
}

/**
 * The membership tier is baked into the access token (`tier` claim; the
 * backend's guards read it, not the database), so after any activation —
 * checkout, an admin's manual activation, a late webhook, a renewal or a
 * lapse — the token must be rotated with POST /auth/refresh. Checkout
 * already does this itself (use-checkout → forceRefreshSession); this
 * covers every other path: whenever /memberships/me is fetched and its
 * tier disagrees with the token's, get new tokens. Once per account+tier,
 * so a backend that doesn't embed the tier can't cause a refresh loop.
 * Returns true when tokens were rotated.
 */
const tierSyncAttempted = new Set<string>()

function normaliseTier(value: unknown): Tier {
  if (typeof value !== "string" || !value) return "F"
  const lower = value.toLowerCase()
  if (lower in TIER_FROM_API) return TIER_FROM_API[lower as ApiTier]
  const upper = value.toUpperCase()
  return upper === "M" || upper === "J" || upper === "V" ? upper : "F"
}

async function syncTokenTier(membership: MyMembership): Promise<boolean> {
  const claims = getAccessTokenClaims()
  if (!claims) return false
  const expected = toNavTier(membership)
  if (normaliseTier(claims.tier) === expected) return false
  const key = `${String(claims.sub)}:${expected}`
  if (tierSyncAttempted.has(key)) return false
  tierSyncAttempted.add(key)
  return forceRefreshSession().catch(() => false)
}

export const membershipsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyMembership: builder.query<MyMembership, void>({
      query: () => ({ url: "/api/v1/memberships/me", method: "GET" }),
      transformResponse: (res: { data: MyMembership }) => res.data,
      providesTags: ["Membership"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          if (await syncTokenTier(data)) {
            // Anything fetched with the old token may reflect the old tier.
            dispatch(baseApi.util.invalidateTags(["Quota", "ListingQuota", "MyListings", "Receipts", "Ads", "CrmLeads", "Referrals"]))
          }
        } catch {
          // Membership fetch failed — nothing to compare.
        }
      },
    }),
  }),
})

export const { useGetMyMembershipQuery, useLazyGetMyMembershipQuery } = membershipsApi
