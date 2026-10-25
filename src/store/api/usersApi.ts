import { baseApi } from "./baseApi"
import {
  INTENT_OPTIONS,
  isValidCity,
  isValidFullName,
  isValidPincode,
  isValidState,
} from "@/lib/profile-options"

// Backend stores whatever string is sent (no enum validation, verified live
// 2026-10-24) — these are the 4 values 05-Database.md documents for the
// column, so the UI only ever offers these.
export type ProfileIntent = "buyer" | "seller" | "broker" | "developer"

// GET /users/me/profile is a FLAT object (not { profile, missingFields }) —
// every field null until set, except country which defaults to "IN".
export type Profile = {
  fullName: string | null
  city: string | null
  state: string | null
  country: string | null
  pincode: string | null
  intent: ProfileIntent | null
  avatarUrl: string | null
  completedAt: string | null
}

export type UpdateProfileBody = Partial<Omit<Profile, "completedAt">>

export type Quota = { used: number; limit: number; remaining: number }

/** The 3 fields the backend itself requires before it sets `completedAt`. */
export const BACKEND_REQUIRED_PROFILE_FIELDS = ["fullName", "city", "intent"] as const

/**
 * Product rule (stricter than the backend's): a profile only counts as
 * complete once every profile field below is filled AND the account has
 * both a verified mobile and a verified email. Enforced on the frontend in
 * Settings, the signup profile step, and before contacting a seller — the
 * backend still only gates PROFILE_INCOMPLETE on the 3 fields above.
 */
export const REQUIRED_PROFILE_FIELDS = ["fullName", "intent", "city", "state", "pincode"] as const

export type ProfileRequirement = (typeof REQUIRED_PROFILE_FIELDS)[number] | "mobile" | "email"

export const REQUIREMENT_LABEL: Record<ProfileRequirement, string> = {
  fullName: "full name",
  intent: "I am a",
  city: "city",
  state: "state",
  pincode: "6-digit pincode",
  mobile: "verified mobile",
  email: "verified email",
}

const FIELD_VALID: Record<(typeof REQUIRED_PROFILE_FIELDS)[number], (v: string | null | undefined) => boolean> = {
  fullName: isValidFullName,
  intent: (v) => INTENT_OPTIONS.some((o) => o.value === v),
  city: isValidCity,
  state: isValidState,
  pincode: isValidPincode,
}

/**
 * There's no `missingFields[]` from the backend — computed here instead.
 * A field counts as missing when it's empty OR fails its format check
 * (profile-options.ts), since the backend validates nothing. Mobile/email
 * only exist on the account once OTP-verified, so their presence on the
 * session user is what counts.
 *
 * Also note (verified live 2026-10-24): `completedAt` is only stamped when a
 * single PATCH carries fullName + city + intent at once, so every profile
 * save in this app sends them together.
 */
export function missingProfileFields(
  profile: Partial<Record<(typeof REQUIRED_PROFILE_FIELDS)[number], string | null>> | null | undefined,
  account?: { phone?: string | null; email?: string | null },
): ProfileRequirement[] {
  const missing: ProfileRequirement[] = REQUIRED_PROFILE_FIELDS.filter((key) => !FIELD_VALID[key](profile?.[key]))
  if (account) {
    if (!account.phone) missing.push("mobile")
    if (!account.email) missing.push("email")
  }
  return missing
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<Profile, void>({
      query: () => ({ url: "/api/v1/users/me/profile", method: "GET" }),
      transformResponse: (res: { data: Profile }) => res.data,
      providesTags: ["Profile"],
    }),
    updateProfile: builder.mutation<Profile, UpdateProfileBody>({
      query: (body) => ({ url: "/api/v1/users/me/profile", method: "PATCH", body }),
      transformResponse: (res: { data: Profile }) => res.data,
      // Write the saved profile straight into the cache instead of waiting on
      // a refetch — otherwise anything comparing against the cached copy
      // (Settings' "edited?" check) briefly sees stale data after a save.
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(usersApi.util.upsertQueryData("getProfile", undefined, data))
        } catch {
          // Failed save — the cache still holds the last real server copy.
        }
      },
    }),
    // Never cached long-term — changes on every contact, re-fetched whenever shown.
    getQuota: builder.query<Quota, void>({
      query: () => ({ url: "/api/v1/users/me/quota", method: "GET" }),
      transformResponse: (res: { data: Quota }) => res.data,
      providesTags: ["Quota"],
      keepUnusedDataFor: 0,
    }),
    // Bare listing ids only — not listing cards.
    getShortlistIds: builder.query<string[], void>({
      query: () => ({ url: "/api/v1/users/me/shortlists", method: "GET" }),
      transformResponse: (res: { data: { listingIds: string[] } }) => res.data.listingIds,
      providesTags: ["Shortlist"],
    }),
    isShortlisted: builder.query<boolean, string>({
      query: (listingId) => ({ url: `/api/v1/users/me/shortlists/${listingId}`, method: "GET" }),
      transformResponse: (res: { data: { isShortlisted: boolean } }) => res.data.isShortlisted,
      providesTags: (_r, _e, id) => [{ type: "Shortlist", id }],
    }),
    // PUT/DELETE are both idempotent ("already_saved" / "not_saved" are successes).
    addShortlist: builder.mutation<{ action: string }, string>({
      query: (listingId) => ({ url: `/api/v1/users/me/shortlists/${listingId}`, method: "PUT" }),
      transformResponse: (res: { data: { action: string } }) => res.data,
      invalidatesTags: (_r, _e, id) => ["Shortlist", { type: "Shortlist", id }],
    }),
    removeShortlist: builder.mutation<{ action: string }, string>({
      query: (listingId) => ({ url: `/api/v1/users/me/shortlists/${listingId}`, method: "DELETE" }),
      transformResponse: (res: { data: { action: string } }) => res.data,
      invalidatesTags: (_r, _e, id) => ["Shortlist", { type: "Shortlist", id }],
    }),
    deleteAccount: builder.mutation<void, void>({
      query: () => ({ url: "/api/v1/users/me", method: "DELETE" }),
    }),
  }),
})

export const {
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useUpdateProfileMutation,
  useGetQuotaQuery,
  useGetShortlistIdsQuery,
  useIsShortlistedQuery,
  useAddShortlistMutation,
  useRemoveShortlistMutation,
  useDeleteAccountMutation,
} = usersApi
