import { baseApi } from "./baseApi"

// Envelope note: every success here is { success: true, data } — but errors
// never carry success:false. Never branch on `success`; use HTTP status +
// error.code (KNOWN-ISSUES #42). transformResponse just reads `data`.

export type LeadChannel = "whatsapp" | "call" | "callback" | "site_visit" | "enquiry_form"
export type LeadDelivery = "delivered" | "undelivered"
export type MercuryStatus = "new" | "contacted" | "visit_scheduled" | "negotiating" | "closed"

export type CreateLeadResult = {
  lead: { id: string; channel: LeadChannel; delivery: LeadDelivery }
  /** Only for whatsapp + delivered; null otherwise. */
  whatsappUrl: string | null
  /** null means unlimited (paid member) — never coerce to 0. */
  quotaRemaining: number | null
  /** Only on the undelivered path — same positive tone by design (BR-25). */
  confirmation?: string
}

export type Lead = {
  _id: string
  listingId: string
  buyerId: string
  sellerId: string
  channel: LeadChannel
  delivery: LeadDelivery
  mercuryStatus?: MercuryStatus
  stageId?: string | null
  message?: string
  preferredTime?: string
  createdAt: string
  updatedAt: string
  // CRM list rows may carry joined buyer/listing details.
  [key: string]: unknown
}

export type LeadActivity = { _id: string; leadId: string; type?: string; note?: string; payload?: { note?: string }; createdAt: string }

export type CrmStage = { _id: string; name: string; order?: number; board?: string; [key: string]: unknown }

export type CrmSummary = {
  byMercuryStatus: { status: MercuryStatus; count: number }[]
  byStage: { stageId: string; count: number }[]
  /** How a lapsed seller learns leads are waiting — no push for undelivered leads. */
  undeliveredCount: number
}

export type CrmLeadsParams = {
  delivery?: LeadDelivery
  channel?: LeadChannel
  status?: MercuryStatus
  stageId?: string
  listingId?: string
  cursor?: string
  limit?: number
}

export const leadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Gates, in order: MOBILE_NOT_VERIFIED (403), PROFILE_INCOMPLETE (403),
    // CONTACT_BLOCKED_LISTING_EXPIRED (403), QUOTA_EXHAUSTED (402).
    createLead: builder.mutation<CreateLeadResult, { listingId: string; channel: LeadChannel; message?: string; preferredTime?: string }>({
      query: (body) => ({ url: "/api/v1/leads", method: "POST", body }),
      transformResponse: (res: { data: CreateLeadResult }) => res.data,
      invalidatesTags: ["Quota", "CrmLeads"],
    }),
    // Masked call — only for a delivered lead (409 INVALID_STATE_TRANSITION otherwise).
    callLead: builder.mutation<{ virtualNumber: string; expiresAt: string }, string>({
      query: (id) => ({ url: `/api/v1/leads/${id}/call`, method: "POST" }),
      transformResponse: (res: { data: { virtualNumber: string; expiresAt: string } }) => res.data,
    }),
    // Either side of the lead can read it.
    getLead: builder.query<{ lead: Lead; activities: LeadActivity[] }, string>({
      query: (id) => ({ url: `/api/v1/leads/${id}` }),
      transformResponse: (res: { data: { lead: Lead; activities: LeadActivity[] } }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Lead", id }],
    }),

    // Real cursor pagination (one of the few endpoints that has it).
    getCrmLeads: builder.query<{ leads: Lead[]; nextCursor: string | null }, CrmLeadsParams>({
      query: (params) => ({
        url: "/api/v1/crm/leads",
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")),
      }),
      transformResponse: (res: { data: { leads: Lead[]; nextCursor: string | null } }) => res.data,
      providesTags: ["CrmLeads"],
    }),
    getCrmSummary: builder.query<CrmSummary, void>({
      query: () => ({ url: "/api/v1/crm/summary" }),
      transformResponse: (res: { data: CrmSummary }) => res.data,
      providesTags: ["CrmLeads"],
    }),
    // Jupiter/Venus only — the caller's own tier decides the board.
    getCrmStages: builder.query<CrmStage[], void>({
      query: () => ({ url: "/api/v1/crm/stages" }),
      transformResponse: (res: { data: CrmStage[] | { stages: CrmStage[] } }) =>
        Array.isArray(res.data) ? res.data : res.data.stages,
    }),
    // Mercury only.
    updateLeadStatus: builder.mutation<{ status: MercuryStatus }, { id: string; status: MercuryStatus }>({
      query: ({ id, status }) => ({ url: `/api/v1/crm/leads/${id}/status`, method: "PATCH", body: { status } }),
      transformResponse: (res: { data: { status: MercuryStatus } }) => res.data,
      invalidatesTags: (_r, _e, { id }) => ["CrmLeads", { type: "Lead", id }],
    }),
    // Jupiter/Venus only.
    updateLeadStage: builder.mutation<{ stageId: string }, { id: string; stageId: string }>({
      query: ({ id, stageId }) => ({ url: `/api/v1/crm/leads/${id}/stage`, method: "PATCH", body: { stageId } }),
      transformResponse: (res: { data: { stageId: string } }) => res.data,
      invalidatesTags: (_r, _e, { id }) => ["CrmLeads", { type: "Lead", id }],
    }),
    addLeadActivity: builder.mutation<LeadActivity, { id: string; note: string }>({
      query: ({ id, note }) => ({ url: `/api/v1/crm/leads/${id}/activities`, method: "POST", body: { note } }),
      transformResponse: (res: { data: LeadActivity }) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Lead", id }],
    }),
  }),
})

export const {
  useCreateLeadMutation,
  useCallLeadMutation,
  useGetLeadQuery,
  useLazyGetLeadQuery,
  useGetCrmLeadsQuery,
  useLazyGetCrmLeadsQuery,
  useGetCrmSummaryQuery,
  useGetCrmStagesQuery,
  useUpdateLeadStatusMutation,
  useUpdateLeadStageMutation,
  useAddLeadActivityMutation,
} = leadsApi
