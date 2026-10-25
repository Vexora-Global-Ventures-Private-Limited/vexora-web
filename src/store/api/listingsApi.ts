import { baseApi } from "./baseApi"

export type ListingStatus = "draft" | "pending_review" | "live" | "rejected" | "expired" | "removed" | string

/** Owner-side listing document (camelCase, unlike SearchDocument). Has no media — media comes back only from the media endpoints. */
export type Listing = {
  _id: string
  sellerId: string
  title: string
  slug: string
  purpose: "sale" | "rent" | string
  propertyType: string
  status: ListingStatus
  /** 1-3 data steps, 4 media, 5 = ready to submit. */
  wizardStep: number
  bhk?: number
  pricePaise?: number
  city?: string
  locality?: string
  subLocality?: string
  address?: string
  state?: string
  district?: string
  pincode?: string
  lat?: number
  lng?: number
  locationId?: string
  areaSqft?: number
  description?: string
  country?: string
  renewalCount: number
  submittedAt?: string
  publishedAt?: string
  expiresAt?: string
  rejectionReason?: string
  /** Set by DELETE — status is untouched by a delete, check this instead. */
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ListingMedia = {
  _id: string
  listingId: string
  type: string
  url: string
  position: number
}

export type Step1Body = { propertyType?: string; bhk?: number; pricePaise?: number; purpose?: string; title?: string }
export type Step2Body = {
  locationId?: string
  city?: string
  locality?: string
  subLocality?: string
  address?: string
  state?: string
  district?: string
  pincode?: string
  lat?: number
  lng?: number
}
export type Step3Body = { areaSqft?: number; description?: string }

export type UploadTicket = { signature: string; timestamp: number; api_key: string; cloud_name: string; folder: string }

export type ListingQuota = { planQuota: number; used: number; remaining: number }

// ── Venus: builder profile + project inventory ─────────────────────────────
export type BuilderProfile = {
  _id: string
  userId?: string
  displayName: string
  slug: string
  logoUrl?: string
  about?: string
  city?: string
  isFeatured?: boolean
  badge?: string | null
  projectCount?: number
  projects?: Project[]
}

export type BuilderProfileBody = {
  displayName?: string
  city?: string | null
  logoUrl?: string | null
  about?: string | null
}

export type Unit = {
  _id: string
  towerId: string
  unitNumber: string
  bhk: number
  areaSqft: number
  pricePaise: number
  status: UnitStatus
}

export type UnitStatus = "available" | "blocked" | "sold" | string
export type Tower = { _id: string; projectId: string; name: string; floors: number; units?: Unit[] }
export type Project = {
  _id: string
  ownerId?: string
  builderProfileId?: string
  name: string
  city: string
  locality: string
  description?: string
  status?: string
  towers?: Tower[]
  createdAt?: string
}

export const listingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Both fields required. Quota is enforced HERE (409 CONFLICT), not at submit.
    createListing: builder.mutation<Listing, { propertyType: string; purpose: string }>({
      query: (body) => ({ url: "/api/v1/listings", method: "POST", body }),
      transformResponse: (res: { data: Listing }) => res.data,
      invalidatesTags: ["MyListings", "ListingQuota"],
    }),
    getListing: builder.query<Listing, string>({
      query: (id) => ({ url: `/api/v1/listings/${id}` }),
      transformResponse: (res: { data: Listing }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Listing", id }],
    }),
    updateListingStep: builder.mutation<Listing, { id: string; step: 1 | 2 | 3; body: Step1Body | Step2Body | Step3Body }>({
      query: ({ id, step, body }) => ({ url: `/api/v1/listings/${id}/steps/${step}`, method: "PATCH", body }),
      transformResponse: (res: { data: Listing }) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Listing", id }, "MyListings"],
    }),
    // null in demo mode (no Cloudinary) — then URLs are saved directly.
    signListingMedia: builder.mutation<UploadTicket | null, string>({
      query: (listingId) => ({ url: "/api/v1/listings/media/sign", method: "POST", body: { listingId } }),
      transformResponse: (res: { data: UploadTicket | null }) => res.data,
    }),
    // This IS wizard step 4 — advances wizardStep to 5.
    saveListingMedia: builder.mutation<{ listing: Listing; media: ListingMedia[] }, { id: string; urls: string[] }>({
      query: ({ id, urls }) => ({ url: `/api/v1/listings/${id}/media`, method: "POST", body: { urls } }),
      transformResponse: (res: { data: { listing: Listing; media: ListingMedia[] } }) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Listing", id }, "MyListings"],
    }),
    reorderListingMedia: builder.mutation<{ media: ListingMedia[] }, { id: string; order: string[] }>({
      query: ({ id, order }) => ({ url: `/api/v1/listings/${id}/media/reorder`, method: "PATCH", body: { order } }),
      transformResponse: (res: { data: { media: ListingMedia[] } }) => res.data,
    }),
    deleteListingMedia: builder.mutation<{ media: ListingMedia[] }, { id: string; mediaId: string }>({
      query: ({ id, mediaId }) => ({ url: `/api/v1/listings/${id}/media/${mediaId}`, method: "DELETE" }),
      transformResponse: (res: { data: { media: ListingMedia[] } }) => res.data,
    }),
    // Needs an active membership (402 MEMBERSHIP_REQUIRED) and wizardStep >= 5.
    submitListing: builder.mutation<Listing, string>({
      query: (id) => ({ url: `/api/v1/listings/${id}/submit`, method: "POST" }),
      transformResponse: (res: { data: Listing }) => res.data,
      // Deliberately NOT the single-listing tag: refetching it mid-flow would
      // flip the edit page to its read-only view and unmount the wizard
      // before its "Submitted for review" screen shows. The edit page
      // re-reads the listing on every open anyway.
      invalidatesTags: ["MyListings", "ListingQuota"],
    }),
    // Soft delete — returns the full doc with deletedAt set.
    deleteListing: builder.mutation<Listing, string>({
      query: (id) => ({ url: `/api/v1/listings/${id}`, method: "DELETE" }),
      transformResponse: (res: { data: Listing }) => res.data,
      // The deleted doc stays readable via GET /listings/:id (verified live),
      // so the cached copy must be refreshed to pick up its deletedAt.
      invalidatesTags: (_r, _e, id) => ["MyListings", "ListingQuota", { type: "Listing", id }],
    }),
    // Flat `status`, offset page/limit, no lead counts.
    getMyListings: builder.query<{ listings: Listing[]; total: number }, { status?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: "/api/v1/listings/mine", params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) }),
      transformResponse: (res: { data: { listings: Listing[]; total: number } }) => res.data,
      providesTags: ["MyListings"],
    }),
    getListingQuota: builder.query<ListingQuota, void>({
      query: () => ({ url: "/api/v1/listings/quota-check" }),
      transformResponse: (res: { data: ListingQuota }) => res.data,
      providesTags: ["ListingQuota"],
    }),

    // Builder profile (Venus/Jupiter). GET /builders/me → null when not created yet.
    getMyBuilderProfile: builder.query<BuilderProfile | null, void>({
      query: () => ({ url: "/api/v1/builders/me" }),
      transformResponse: (res: { data: BuilderProfile | null }) => res.data,
      providesTags: ["BuilderProfile"],
    }),
    createBuilderProfile: builder.mutation<BuilderProfile, BuilderProfileBody>({
      query: (body) => ({ url: "/api/v1/builders/me", method: "POST", body }),
      transformResponse: (res: { data: BuilderProfile }) => res.data,
      invalidatesTags: ["BuilderProfile"],
    }),
    // null clears an optional field (omitting it keeps the old value).
    updateBuilderProfile: builder.mutation<BuilderProfile, BuilderProfileBody>({
      query: (body) => ({ url: "/api/v1/builders/me", method: "PATCH", body }),
      transformResponse: (res: { data: BuilderProfile }) => res.data,
      invalidatesTags: ["BuilderProfile"],
    }),
    // Public. Teaser when anonymous, full profile + inventory when logged in.
    getBuilderBySlug: builder.query<BuilderProfile, string>({
      query: (slug) => ({ url: `/api/v1/builders/${slug}` }),
      transformResponse: (res: { data: BuilderProfile }) => res.data,
    }),
    getFeaturedBuilders: builder.query<BuilderProfile[], void>({
      query: () => ({ url: "/api/v1/builders/featured" }),
      transformResponse: (res: { data: BuilderProfile[] }) => res.data,
    }),

    // Projects → Towers → Units (Venus-only writes).
    createProject: builder.mutation<Project, { name: string; city: string; locality: string; description?: string }>({
      query: (body) => ({ url: "/api/v1/projects", method: "POST", body }),
      transformResponse: (res: { data: Project }) => res.data,
      invalidatesTags: ["Project"],
    }),
    getProject: builder.query<Project, string>({
      query: (id) => ({ url: `/api/v1/projects/${id}` }),
      transformResponse: (res: { data: Project }) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Project", id }],
    }),
    updateProject: builder.mutation<Project, { id: string; body: Partial<Project> }>({
      query: ({ id, body }) => ({ url: `/api/v1/projects/${id}`, method: "PATCH", body }),
      transformResponse: (res: { data: Project }) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Project", id }, "Project"],
    }),
    getPromotedProjects: builder.query<Project[], void>({
      query: () => ({ url: "/api/v1/projects/promoted" }),
      transformResponse: (res: { data: Project[] }) => res.data,
    }),
    createTower: builder.mutation<Tower, { projectId: string; name: string; floors: number }>({
      query: ({ projectId, ...body }) => ({ url: `/api/v1/projects/${projectId}/towers`, method: "POST", body }),
      transformResponse: (res: { data: Tower }) => res.data,
      invalidatesTags: (_r, _e, { projectId }) => [{ type: "Project", id: projectId }],
    }),
    updateTower: builder.mutation<Tower, { id: string; projectId: string; body: Partial<Tower> }>({
      query: ({ id, body }) => ({ url: `/api/v1/towers/${id}`, method: "PATCH", body }),
      transformResponse: (res: { data: Tower }) => res.data,
      invalidatesTags: (_r, _e, { projectId }) => [{ type: "Project", id: projectId }],
    }),
    createUnit: builder.mutation<Unit, { towerId: string; projectId: string; unitNumber: string; bhk: number; areaSqft: number; pricePaise: number; status: string }>({
      query: ({ towerId, projectId: _p, ...body }) => ({ url: `/api/v1/towers/${towerId}/units`, method: "POST", body }),
      transformResponse: (res: { data: Unit }) => res.data,
      invalidatesTags: (_r, _e, { projectId }) => [{ type: "Project", id: projectId }],
    }),
    updateUnit: builder.mutation<Unit, { id: string; projectId: string; body: Partial<Unit> }>({
      query: ({ id, body }) => ({ url: `/api/v1/units/${id}`, method: "PATCH", body }),
      transformResponse: (res: { data: Unit }) => res.data,
      invalidatesTags: (_r, _e, { projectId }) => [{ type: "Project", id: projectId }],
    }),
  }),
})

export const {
  useCreateListingMutation,
  useGetListingQuery,
  useUpdateListingStepMutation,
  useSignListingMediaMutation,
  useSaveListingMediaMutation,
  useReorderListingMediaMutation,
  useDeleteListingMediaMutation,
  useSubmitListingMutation,
  useDeleteListingMutation,
  useGetMyListingsQuery,
  useGetListingQuotaQuery,
  useGetMyBuilderProfileQuery,
  useCreateBuilderProfileMutation,
  useUpdateBuilderProfileMutation,
  useGetBuilderBySlugQuery,
  useGetFeaturedBuildersQuery,
  useCreateProjectMutation,
  useGetProjectQuery,
  useUpdateProjectMutation,
  useGetPromotedProjectsQuery,
  useCreateTowerMutation,
  useUpdateTowerMutation,
  useCreateUnitMutation,
  useUpdateUnitMutation,
} = listingsApi
