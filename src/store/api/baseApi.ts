import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react"
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth-tokens"
import { useNav } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  prepareHeaders: (headers) => {
    const accessToken = getAccessToken()
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
    return headers
  },
})

type RefreshResponse = { data: { accessToken: string; refreshToken: string } }

// Refresh tokens are single-use/rotating server-side (api.json: reusing one
// triggers "Token reuse detected — all sessions revoked"). If more than one
// authenticated request is in flight when the access token expires, each
// would otherwise race to call /auth/refresh with the same stale refresh
// token — the first to land rotates it, and every other concurrent attempt
// would then look like reuse and nuke the session. This module-level
// promise makes all concurrent callers await the same single in-flight
// refresh instead of each starting their own.
let refreshPromise: Promise<boolean> | null = null

async function refreshTokens(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      // No refresh token doesn't necessarily mean a real session just died —
      // it's also the normal state for a demo/mock account (nav user set,
      // but no backend tokens ever issued). Only clear the stray access
      // token; don't blow away useNav's user here, since that would log a
      // demo session out for hitting a 401 it was never going to avoid. A
      // real session dying is handled below, after an actual refresh attempt
      // is confirmed to fail.
      clearTokens()
      return false
    }

    const refreshResult = await rawBaseQuery(
      { url: "/api/v1/auth/refresh", method: "POST", body: { refreshToken } },
      api,
      extraOptions,
    )

    if (refreshResult.data) {
      const { accessToken, refreshToken: newRefreshToken } = (refreshResult.data as RefreshResponse).data
      setTokens({ accessToken, refreshToken: newRefreshToken })
      return true
    }

    clearTokens()
    useNav.getState().logout()
    if (typeof window !== "undefined") window.location.href = ROUTES.login
    return false
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

/**
 * Wraps fetchBaseQuery to transparently refresh the access token on a 401 and
 * retry the original request once. If the refresh itself fails (expired/reused
 * refresh token), the session is unrecoverable — clear it and hard-redirect to
 * /login rather than leaving the app in a half-authenticated state.
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    const refreshed = await refreshTokens(api, extraOptions)
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions)
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: "vexoraApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Profile"],
  endpoints: () => ({}),
})
