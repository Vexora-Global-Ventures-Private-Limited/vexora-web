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

/**
 * What GET /ad-serving/home-banner actually returns (verified live
 * 2026-10-31): `{ id, targetUrl, creative: { mediaType, cloudinaryPublicId } }`
 * — `id` not `_id`, ONE `creative`, no `targetCity`. Normalised here so
 * the slots never fall back to a sample image or link to ".../undefined/...".
 */
export type ServedAd = {
  id: string
  /** The advertiser's https landing page; null = the banner isn't clickable. */
  targetUrl: string | null
  /** The uploaded creative (https), or null if none. */
  imageUrl: string | null
  targetCity: string | null
}

const httpsOrNull = (v: unknown) => (typeof v === "string" && /^https:\/\//i.test(v.trim()) ? v.trim() : null)

function toServedAd(raw: Record<string, unknown> | null | undefined): ServedAd | null {
  if (!raw) return null
  const id = typeof raw.id === "string" ? raw.id : typeof raw._id === "string" ? raw._id : null
  if (!id) return null
  const creative = (raw.creative ?? (Array.isArray(raw.creatives) ? raw.creatives[0] : null)) as Record<string, unknown> | null
  return {
    id,
    targetUrl: httpsOrNull(raw.targetUrl) ?? httpsOrNull(creative?.targetUrl),
    imageUrl: httpsOrNull(creative?.cloudinaryPublicId) ?? httpsOrNull(creative?.url),
    targetCity: typeof raw.targetCity === "string" && raw.targetCity ? raw.targetCity : null,
  }
}

export type AdPackage = {
  _id: string
  product: AdProduct
  name: string
  durationDays: number
  pricePaise: number
  isActive: boolean
  version?: number
  createdAt?: string
}

/**
 * Editing a package in the admin creates a NEW version with a new _id but
 * leaves the old one active (backend bug — vexora-admin UNRESOLVED #7), so
 * the same package can appear twice with two prices. Show sellers only the
 * newest active version of each package (same product + name).
 */
export function latestActivePackages(packages: AdPackage[] | undefined): AdPackage[] {
  const newest = new Map<string, AdPackage>()
  for (const pkg of packages ?? []) {
    if (!pkg.isActive) continue
    const key = `${pkg.product}:${pkg.name.trim().toLowerCase()}`
    const current = newest.get(key)
    const rank = (p: AdPackage) => [p.version ?? 0, Date.parse(p.createdAt ?? "") || 0] as const
    if (!current || rank(pkg)[0] > rank(current)[0] || (rank(pkg)[0] === rank(current)[0] && rank(pkg)[1] > rank(current)[1])) {
      newest.set(key, pkg)
    }
  }
  return [...newest.values()].sort((a, b) => a.pricePaise - b.pricePaise)
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
    getHomeBanner: builder.query<ServedAd | null, void>({
      query: () => ({ url: "/api/v1/ad-serving/home-banner" }),
      transformResponse: (res: { data: { ad: Record<string, unknown> | null } }) => toServedAd(res.data.ad),
    }),
  }),
})

/**
 * Count a click: POST /ad-serving/{id}/click (GET is a 404 — verified
 * 2026-10-31). Sent as a beacon so it survives the new tab opening; the
 * API's 302 is ignored — the caller opens the ad's own targetUrl.
 */
export function recordAdClick(adId: string) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}/api/v1/ad-serving/${encodeURIComponent(adId)}/click`
  try {
    if (navigator.sendBeacon?.(url)) return
  } catch {
    // Fall through to fetch.
  }
  void fetch(url, { method: "POST", keepalive: true, mode: "no-cors" }).catch(() => {})
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
