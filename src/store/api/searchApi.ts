import { baseApi } from "./baseApi"

/**
 * One search hit / property detail. Every key is snake_case on purpose
 * (Meilisearch convention, per the backend's indexer) — unlike the rest of
 * the API, which is camelCase.
 *
 * `photos` added by the backend 2026-10-31 (was missing entirely before
 * that — the 2026-10-24 note below is stale, cards no longer need the
 * placeholder fallback for a listing that actually has photos).
 */
export type SearchDocument = {
  id: string
  title: string
  slug: string
  purpose: "sale" | "rent" | string
  property_type: string
  bhk: number | null
  /** Paise. */
  price: number
  price_display: string
  area_sqft: number | null
  city: string
  district: string | null
  state: string
  locality: string
  sub_locality: string | null
  description: string | null
  status: string
  /** 0 sponsored · 1 featured · 2 organic · 3 expired. */
  rank_bucket: 0 | 1 | 2 | 3
  badges: string[]
  published_at: number | null
  boosted_at: number | null
  expires_at: number | null
  seller_id: string
  renewal_count: number
  created_at: number
  /** Real image URLs, cover first. Empty array if the listing has none yet. */
  photos: string[]
}

export type SearchSort = "relevance" | "price_asc" | "price_desc" | "newest"

// Flat params (not filter[...]), offset pagination. Prices in paise.
export type SearchParams = {
  q?: string
  city?: string
  property_type?: string
  bhk?: number
  price_min?: number
  price_max?: number
  page?: number
  limit?: number
  sort?: SearchSort
}

export type SearchResult = {
  hits: SearchDocument[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type PublicConfig = {
  allowedBhkValues: number[]
  allowedPropertyTypes: string[]
  /** G8 kyc_document_types — what POST /kyc/submissions accepts (e.g. pan, aadhaar, cin, gst). */
  allowedKycDocumentTypes?: string[]
}

export type Location = {
  id: string
  name: string
  type: "country" | "state" | "district" | "city" | "locality" | string
  parentId: string | null
  displayPath: string
  state: string | null
}

function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  ) as Partial<T>
}

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    search: builder.query<SearchResult, SearchParams>({
      query: (params) => ({ url: "/api/v1/search", params: cleanParams(params) }),
      transformResponse: (res: { data: SearchResult }) => res.data,
    }),
    // Suggestions are listing TITLES, not place names. Under 2 chars → [].
    suggest: builder.query<string[], string>({
      query: (q) => ({ url: "/api/v1/search/suggest", params: { q } }),
      transformResponse: (res: { data: { suggestions: string[] } }) => res.data.suggestions,
    }),
    // Live listings only — anything else (draft/expired/removed) is a 404.
    getPropertyBySlug: builder.query<SearchDocument, string>({
      query: (slug) => ({ url: `/api/v1/properties/${encodeURIComponent(slug)}` }),
      transformResponse: (res: { data: SearchDocument }) => res.data,
    }),
    // Admin-configured BHK values + property types — source dropdowns from
    // here, never a hardcoded list the backend might reject.
    getPublicConfig: builder.query<PublicConfig, void>({
      query: () => ({ url: "/api/v1/config/public" }),
      transformResponse: (res: { data: PublicConfig }) => res.data,
      keepUnusedDataFor: 3600,
    }),
    // Location Master — the reliable source for a city picker (search itself
    // never validates `city`; a typo just returns zero hits).
    getActiveLocations: builder.query<Location[], void>({
      query: () => ({ url: "/api/v1/locations/active" }),
      transformResponse: (res: { data: { locations: Location[] } }) => res.data.locations,
      keepUnusedDataFor: 3600,
    }),
  }),
})

export const {
  useSearchQuery,
  useSuggestQuery,
  useGetPropertyBySlugQuery,
  useGetPublicConfigQuery,
  useGetActiveLocationsQuery,
} = searchApi
