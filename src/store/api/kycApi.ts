import { baseApi } from "./baseApi"

/**
 * KYC (Stage 13) — ID verification that grants a trust badge:
 *  - `verified`: first badge, any paid tier.
 *  - `verified_developer`: Venus only, after `verified` (company documents).
 * The backend decides which badge a submission is for (targetBadge); Free
 * Users get 403 KYC_MEMBERS_ONLY. Documents are `{ type, cloudinaryPublicId }`
 * — the web uploads to Cloudinary and sends the https URL.
 */

export type KycStatusValue = "not_submitted" | "submitted" | "approved" | "rejected" | (string & {})
export type BadgeType = "verified" | "verified_developer" | (string & {})

export type KycStatus = {
  status: KycStatusValue
  submittedAt: string | null
  rejectionReason: string | null
  /** This tier must pass KYC before listings can be submitted (G8 kyc_required_tiers). */
  requiredForTier: boolean
  currentBadge: BadgeType | null
  /** Venus + already `verified` → can apply for `verified_developer`. */
  canApplyForDeveloperBadge: boolean
}

export type KycDocumentInput = { type: string; cloudinaryPublicId: string }
export type UserBadge = { type: BadgeType; grantedAt: string | null }

export const BADGE_LABEL: Record<string, string> = { verified: "Verified", verified_developer: "Verified Developer" }
export const KYC_DOCUMENT_LABEL: Record<string, string> = { pan: "PAN card", aadhaar: "Aadhaar card", cin: "Company CIN", gst: "GST certificate" }

export const kycApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getKycStatus: builder.query<KycStatus, void>({
      query: () => ({ url: "/api/v1/kyc/status" }),
      transformResponse: (res: { data: KycStatus }) => res.data,
      providesTags: ["Kyc"],
    }),
    submitKyc: builder.mutation<{ status: string; targetBadge?: BadgeType }, KycDocumentInput[]>({
      query: (documents) => ({ url: "/api/v1/kyc/submissions", method: "POST", body: { documents } }),
      transformResponse: (res: { data: { status: string; targetBadge?: BadgeType } }) => res.data,
      invalidatesTags: ["Kyc"],
    }),
    // Public — no login needed. At most one entry.
    getUserBadges: builder.query<UserBadge[], string>({
      query: (userId) => ({ url: `/api/v1/users/${userId}/badges` }),
      transformResponse: (res: { data: { badges?: UserBadge[] } }) => res.data?.badges ?? [],
      providesTags: (_r, _e, userId) => [{ type: "Badges", id: userId }],
    }),
  }),
})

export const { useGetKycStatusQuery, useSubmitKycMutation, useGetUserBadgesQuery } = kycApi
