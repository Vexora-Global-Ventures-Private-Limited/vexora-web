import { baseApi } from "./baseApi"

export type ReferralCode = {
  code: string
  shareUrl?: string
  totalReferred?: number
  totalRewardDays?: number
  [key: string]: unknown
}
export type ReferralValidation = { valid: boolean; rewardDays?: number; referrerName?: string }
export type ReferralRedemption = {
  _id?: string
  id?: string
  refereeName?: string
  rewardDays?: number
  status?: string
  createdAt: string
  [key: string]: unknown
}

export const referralsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Paid members only (402 MEMBERSHIP_REQUIRED otherwise).
    getMyReferralCode: builder.query<ReferralCode, void>({
      query: () => ({ url: "/api/v1/referrals/my-code" }),
      transformResponse: (res: { data: ReferralCode }) => res.data,
      providesTags: ["Referrals"],
    }),
    getReferralHistory: builder.query<ReferralRedemption[], void>({
      query: () => ({ url: "/api/v1/referrals/history" }),
      // Cursor-paginated per the docs; the first page is all this UI shows.
      transformResponse: (res: { data: ReferralRedemption[] | { history?: ReferralRedemption[]; items?: ReferralRedemption[]; referrals?: ReferralRedemption[] } }) =>
        Array.isArray(res.data) ? res.data : res.data.history ?? res.data.items ?? res.data.referrals ?? [],
      providesTags: ["Referrals"],
    }),
    // Preview check before checkout — 422 REFERRAL_INVALID for a bad code.
    validateReferralCode: builder.mutation<ReferralValidation, string>({
      query: (code) => ({ url: "/api/v1/referrals/validate", method: "POST", body: { code } }),
      transformResponse: (res: { data: ReferralValidation }) => res.data,
    }),
    // BR-06 — needs a reason (≤40 chars) and a listingId or reportedUserId.
    reportAbuse: builder.mutation<{ id: string; status: string }, { listingId?: string; reportedUserId?: string; reason: string; details?: string }>({
      query: (body) => ({ url: "/api/v1/abuse-reports", method: "POST", body }),
      transformResponse: (res: { data: { id: string; status: string } }) => res.data,
    }),
  }),
})

export const {
  useGetMyReferralCodeQuery,
  useGetReferralHistoryQuery,
  useValidateReferralCodeMutation,
  useReportAbuseMutation,
} = referralsApi
