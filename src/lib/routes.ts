export const ROUTES = {
  home: "/",
  login: "/login",
  /** Use this (not the bare `login` string) wherever "sign in" is gating a
   *  specific action — e.g. contacting a seller — so the visitor lands back
   *  on that exact page after signing in instead of always at /dashboard. */
  loginWithReturn: (returnTo: string) => `/login?returnTo=${encodeURIComponent(returnTo)}`,
  signup: "/signup",
  signupWithReturn: (returnTo: string) => `/signup?returnTo=${encodeURIComponent(returnTo)}`,
  properties: "/properties",
  /** /properties with search params (q, city, propertyType, bhk, …) — empty values dropped. */
  propertiesSearch: (params: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString()
    return qs ? `/properties?${qs}` : "/properties"
  },
  /** Takes the listing's SLUG — the public detail route resolves slugs, not ids. */
  propertyDetail: (slug: string) => `/properties/${slug}`,
  newListing: "/listings/new",
  editListing: (id: string) => `/listings/${id}/edit`,
  projects: "/projects",
  projectDetail: (id: string) => `/projects/${id}`,
  builderDetail: (slug: string) => `/builders/${encodeURIComponent(slug)}`,
  newProject: "/projects/new",
  editProject: (id: string) => `/projects/${id}/edit`,
  cities: "/cities",
  cityDetail: (slug: string) => `/cities/${slug}`,
  membership: "/membership",
  commercial: "/commercial",
  landLuxuryVilla: "/land-luxury-villas",
  globalProperties: "/global-properties",
  smartPool: "/smart-pool",
  rentEarn: "/rent-earn",
  dashboard: "/dashboard",
  dashboardTab: (tab: string) => `/dashboard?tab=${tab}`,
  promote: "/promote",
  advertiser: "/advertiser",
  reports: "/reports",
} as const
