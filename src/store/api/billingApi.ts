import { baseApi } from "./baseApi"

export type MembershipPlan = {
  _id: string
  tier: "mercury" | "jupiter" | "venus"
  name: string
  pricePaise: number
  durationDays: number
  listingQuota: number
  features: { crmBoard?: boolean; badges?: boolean; coBroker?: boolean; [key: string]: boolean | undefined }
  isActive: boolean
  version?: number
  updatedAt?: string
}

/**
 * The plan buyers should see for a tier: the newest active one. Normally
 * there's exactly one, but plan edits can version and the admin can end up
 * with two active plans for a tier — never charge the older price.
 */
export function activePlanForTier(plans: MembershipPlan[] | undefined, tier: MembershipPlan["tier"]): MembershipPlan | undefined {
  return (plans ?? [])
    .filter((p) => p.isActive && p.tier === tier)
    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0) || (Date.parse(b.updatedAt ?? "") || 0) - (Date.parse(a.updatedAt ?? "") || 0))[0]
}

export type OrderPurpose =
  | "membership_new"
  | "membership_renewal"
  | "membership_upgrade"
  | "listing_renewal"
  | "listing_slot_addon"
  | "ad_banner"
  | "ad_sponsored"
  | "ad_featured"
  | "ad_project_promotion"

export type CreateOrderBody = {
  purpose: OrderPurpose
  planId?: string
  referenceId?: string
  referralCode?: string
  quantity?: number
}

/**
 * What POST /billing/orders (and /billing/slots, /ads/:id/pay) really return
 * — verified live 2026-10-24. Note it's `orderId`, not `id`/`_id`; passing
 * anything else to verify/poll gets "Invalid id format".
 */
export type CreatedOrder = {
  orderId: string
  razorpayOrderId: string
  amountPaise: number
  razorpayKeyId: string
}

export type OrderStatus = "created" | "processing" | "paid" | "failed" | "manually_activated"

export type Order = {
  _id: string
  purpose: OrderPurpose
  planId?: string
  referenceId?: string
  quantity: number
  amountPaise: number
  currency: string
  status: OrderStatus
  createdAt: string
  razorpayOrderId?: string
  /** Replaying POST /billing/orders with this key returns this same order (with razorpayKeyId) — how an unfinished payment is resumed. */
  idempotencyKey?: string
  referralCode?: string
}

export type Receipt = {
  _id: string
  receiptNumber?: string
  amountPaise?: number
  purpose?: string
  /** Relative path on the API host (demo mode) — prefix with the API base URL. */
  pdfUrl?: string
  createdAt: string
  [key: string]: unknown
}

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public, rarely changes — safe to cache for the session.
    getMembershipPlans: builder.query<MembershipPlan[], void>({
      query: () => ({ url: "/api/v1/membership-plans" }),
      transformResponse: (res: { data: MembershipPlan[] }) => res.data,
      keepUnusedDataFor: 3600,
    }),
    // idempotencyKey: one UUID per checkout ATTEMPT — reuse it on a retry of
    // the same attempt so a network blip can never double-charge.
    createOrder: builder.mutation<CreatedOrder, CreateOrderBody & { idempotencyKey: string }>({
      query: ({ idempotencyKey, ...body }) => ({
        url: "/api/v1/billing/orders",
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse: (res: { data: CreatedOrder }) => res.data,
    }),
    buySlots: builder.mutation<CreatedOrder, { quantity: number; idempotencyKey: string }>({
      query: ({ idempotencyKey, quantity }) => ({
        url: "/api/v1/billing/slots",
        method: "POST",
        body: { quantity },
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      transformResponse: (res: { data: CreatedOrder }) => res.data,
    }),
    // NOT the finish line — only flips the order to "processing". Activation
    // happens via the Razorpay webhook; poll getOrder for the real result.
    verifyOrder: builder.mutation<{ status: OrderStatus }, { orderId: string; razorpayPaymentId: string; razorpaySignature: string }>({
      query: ({ orderId, ...body }) => ({ url: `/api/v1/billing/orders/${orderId}/verify`, method: "POST", body }),
      transformResponse: (res: { data: { status: OrderStatus } }) => res.data,
    }),
    getOrder: builder.query<Order, string>({
      query: (orderId) => ({ url: `/api/v1/billing/orders/${orderId}` }),
      transformResponse: (res: { data: Order }) => res.data,
      keepUnusedDataFor: 0,
    }),
    getReceipts: builder.query<Receipt[], void>({
      query: () => ({ url: "/api/v1/billing/receipts" }),
      // A bare array today; 06-API.md documents this list as cursor-paginated,
      // so accept a { receipts | items } page shape too rather than crash.
      transformResponse: (res: { data: Receipt[] | { receipts?: Receipt[]; items?: Receipt[] } }) =>
        Array.isArray(res.data) ? res.data : res.data?.receipts ?? res.data?.items ?? [],
      providesTags: ["Receipts"],
    }),
  }),
})

export const {
  useGetMembershipPlansQuery,
  useCreateOrderMutation,
  useBuySlotsMutation,
  useVerifyOrderMutation,
  useGetOrderQuery,
  useLazyGetOrderQuery,
  useGetReceiptsQuery,
} = billingApi

/** Absolute link for a receipt's relative pdfUrl. */
export function receiptHref(pdfUrl: string | undefined): string | undefined {
  if (!pdfUrl) return undefined
  if (/^https?:\/\//.test(pdfUrl)) return pdfUrl
  return `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}${pdfUrl}`
}
