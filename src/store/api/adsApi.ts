import { baseApi } from "./baseApi"
import type { CreatedOrder } from "./billingApi"

export type AdProduct = "banner" | "sponsored" | "featured" | "project_promotion"

export type AdCreative = { mediaType: string; cloudinaryPublicId: string; targetUrl?: string }

export type Ad = {
  _id: string
  ownerId: string
  product: AdProduct
  listingId?: string
  projectId?: string
  targetCity?: string
  status: "draft" | "pending_payment" | "pending_review" | "active" | "paused" | "rejected" | "expired" | string
  packageId?: string
  /** Price snapshotted from the package when it was picked. */
  amountPaise?: number
  startsAt?: string
  endsAt?: string
  rejectionReason?: string
  createdAt: string
  [key: string]: unknown
}

export type AdPackage = {
  _id: string
  product: AdProduct
  name: string
  durationDays: number
  pricePaise: number
  isActive: boolean
}

export type AdMetrics = {
  daily: { date: string; impressions: number; clicks: number; ctr: number }[]
  totals: { impressions: number; clicks: number; ctr: number }
  receiptId?: string | null
}

export const adsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // One-time terms acceptance, required before any product (even banner).
    activateAdvertiser: builder.mutation<{ advertiserActivated: boolean }, void>({
      query: () => ({ url: "/api/v1/ads/activate-advertiser", method: "POST", body: { acceptTerms: true } }),
      transformResponse: (res: { data: { advertiserActivated: boolean } }) => res.data,
    }),
    createAd: builder.mutation<Ad, { product: AdProduct; listingId?: string; projectId?: string; targetCity?: string }>({
      query: (body) => ({ url: "/api/v1/ads", method: "POST", body }),
      transformResponse: (res: { data: Ad }) => res.data,
      invalidatesTags: ["Ads"],
    }),
    // banner / project_promotion only — the others reject a creative.
    // Returns the saved creatives (not the ad) — verified live.
    setAdCreative: builder.mutation<AdCreative[], { id: string; creatives: AdCreative[] }>({
      query: ({ id, creatives }) => ({ url: `/api/v1/ads/${id}/creative`, method: "PATCH", body: { creatives } }),
      transformResponse: (res: { data: AdCreative[] }) => res.data,
      invalidatesTags: ["Ads"],
    }),
    // Snapshots the price — later admin price changes never affect this ad.
    setAdPackage: builder.mutation<Ad, { id: string; packageId: string }>({
      query: ({ id, packageId }) => ({ url: `/api/v1/ads/${id}/package`, method: "PATCH", body: { packageId } }),
      transformResponse: (res: { data: Ad }) => res.data,
      invalidatesTags: ["Ads"],
    }),
    // Same async billing flow as memberships — poll via useCheckout.
    payForAd: builder.mutation<CreatedOrder, { id: string; idempotencyKey: string }>({
      query: ({ id, idempotencyKey }) => ({
        url: `/api/v1/ads/${id}/pay`,
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse: (res: { data: CreatedOrder }) => res.data,
    }),
    // Rejected → back to review with no second payment (BR-63); creatives optional.
    resubmitAd: builder.mutation<Ad, { id: string; creatives?: AdCreative[] }>({
      query: ({ id, creatives }) => ({ url: `/api/v1/ads/${id}/resubmit`, method: "POST", body: creatives ? { creatives } : {} }),
      transformResponse: (res: { data: Ad }) => res.data,
      invalidatesTags: ["Ads"],
    }),
    getMyAds: builder.query<Ad[], void>({
      query: () => ({ url: "/api/v1/ads/mine" }),
      transformResponse: (res: { data: Ad[] }) => res.data,
      providesTags: ["Ads"],
    }),
    getAd: builder.query<Ad, string>({
      query: (id) => ({ url: `/api/v1/ads/${id}` }),
      transformResponse: (res: { data: Ad }) => res.data,
      providesTags: ["Ads"],
    }),
    getAdMetrics: builder.query<AdMetrics, { id: string; from?: string; to?: string }>({
      query: ({ id, ...params }) => ({ url: `/api/v1/ads/${id}/metrics`, params }),
      transformResponse: (res: { data: AdMetrics }) => res.data,
    }),
    pauseAd: builder.mutation<Ad, string>({
      query: (id) => ({ url: `/api/v1/ads/${id}/pause`, method: "POST" }),
      transformResponse: (res: { data: Ad }) => res.data,
      invalidatesTags: ["Ads"],
    }),
    resumeAd: builder.mutation<Ad, string>({
      query: (id) => ({ url: `/api/v1/ads/${id}/resume`, method: "POST" }),
      transformResponse: (res: { data: Ad }) => res.data,
      invalidatesTags: ["Ads"],
    }),
    // Needs a Bearer token despite being described as public.
    getAdPackages: builder.query<AdPackage[], AdProduct>({
      query: (product) => ({ url: "/api/v1/ad-packages", params: { product } }),
      transformResponse: (res: { data: AdPackage[] }) => res.data,
    }),
    // Public. { ad: null } is normal (no active campaign).
    getHomeBanner: builder.query<Ad | null, void>({
      query: () => ({ url: "/api/v1/ad-serving/home-banner" }),
      transformResponse: (res: { data: { ad: Ad | null } }) => res.data.ad,
    }),
  }),
})

/** Click-through is a 302 to the ad's target — render it as a plain link. */
export function adClickHref(adId: string) {
  return `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/v1/ad-serving/${adId}/click`
}

export const {
  useActivateAdvertiserMutation,
  useCreateAdMutation,
  useSetAdCreativeMutation,
  useSetAdPackageMutation,
  usePayForAdMutation,
  useResubmitAdMutation,
  useGetMyAdsQuery,
  useGetAdQuery,
  useGetAdMetricsQuery,
  usePauseAdMutation,
  useResumeAdMutation,
  useGetAdPackagesQuery,
  useGetHomeBannerQuery,
} = adsApi
