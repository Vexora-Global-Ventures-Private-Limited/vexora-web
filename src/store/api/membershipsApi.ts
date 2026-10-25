import { baseApi } from "./baseApi"
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

export const membershipsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyMembership: builder.query<MyMembership, void>({
      query: () => ({ url: "/api/v1/memberships/me", method: "GET" }),
      transformResponse: (res: { data: MyMembership }) => res.data,
      providesTags: ["Membership"],
    }),
  }),
})

export const { useGetMyMembershipQuery, useLazyGetMyMembershipQuery } = membershipsApi
