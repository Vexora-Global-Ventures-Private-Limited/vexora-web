import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react"
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth-tokens"
import { useNav } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  // Without a ceiling a hung backend request (seen live: a malformed otpId
  // never gets a response) leaves the UI spinning forever. Surfaces as
  // status "TIMEOUT_ERROR".
  timeout: 30_000,
  prepareHeaders: (headers) => {
    const accessToken = getAccessToken()
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
    return headers
  },
})

type RefreshResponse = { data: { accessToken: string; refreshToken: string } }

// Routes behind the (portal) session guard — a session dying there has to
// send the visitor to /login; on public pages they can just keep browsing
// signed out.
const PORTAL_PREFIXES = ["/dashboard", "/listings", "/promote", "/advertiser", "/reports"]
const isPortalPath = (path: string) =>
  PORTAL_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`)) ||
  path === "/projects/new" ||
  /^\/projects\/[^/]+\/edit$/.test(path)

/**
 * The session is unrecoverable (refresh token rejected) — clear it everywhere
 * in this tab. Only redirect when the current page needs a session, and say
 * why on the login screen instead of dropping the user there silently.
 */
function endDeadSession(reason: "expired" | "suspended") {
  clearTokens()
  useNav.getState().logout()
  if (typeof window === "undefined") return
  const { pathname, search } = window.location
  if (isPortalPath(pathname)) {
    window.location.href = `${ROUTES.loginWithReturn(`${pathname}${search}`)}&reason=${reason}`
  }
}

// Refresh tokens are single-use/rotating server-side (api.json: reusing one
// triggers "Token reuse detected — all sessions revoked"). If more than one
// authenticated request is in flight when the access token expires, each
// would otherwise race to call /auth/refresh with the same stale refresh
// token — the first to land rotates it, and every other concurrent attempt
// would then look like reuse and nuke the session. This module-level
// promise makes all concurrent callers await the same single in-flight
// refresh instead of each starting their own.
let refreshPromise: Promise<boolean> | null = null

/**
 * Same race, across browser tabs: they share the tokens in localStorage but
 * not `refreshPromise`. A Web Lock serialises refreshes between tabs, and
 * the refresh token is re-read inside it — if another tab already rotated
 * it while this one waited, there's nothing to do but retry with the new
 * tokens. Falls back to no lock where the API doesn't exist.
 */
function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("vxp-token-refresh", fn) as Promise<T>
  }
  return fn()
}

async function refreshTokens(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  const tokenBeforeLock = getRefreshToken()
  refreshPromise = withCrossTabLock(async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearTokens()
      // A signed-in real account with no refresh token can never call the
      // API again — end it instead of leaving a header that says "signed in"
      // over requests that all fail.
      if (useNav.getState().user?.id) endDeadSession("expired")
      return false
    }
    // Another tab rotated the tokens while we waited for the lock.
    if (tokenBeforeLock && refreshToken !== tokenBeforeLock) return true

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

    // Only a real rejection from the API ends the session
    // (TOKEN_REUSE_DETECTED / TOKEN_REVOKED / TOKEN_EXPIRED / INVALID_TOKEN /
    // ACCOUNT_SUSPENDED). A dropped connection, timeout or 5xx proves
    // nothing about the token — keep the session and let the next request
    // try again.
    const status = refreshResult.error?.status
    if (status === 400 || status === 401 || status === 403 || status === 404) {
      const code = (refreshResult.error?.data as { error?: { code?: string } } | undefined)?.error?.code
      endDeadSession(code === "ACCOUNT_SUSPENDED" ? "suspended" : "expired")
    }
    return false
  })

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

/**
 * Forces a token rotation outside the 401 path — used right after a payment
 * is confirmed, since the new membership tier only lands in the JWT on
 * refresh (KNOWN-ISSUES #17). Shares the same single-flight promise as the
 * automatic refresh, so it can never race it into TOKEN_REUSE_DETECTED.
 */
export function forceRefreshSession(): Promise<boolean> {
  const api = { signal: new AbortController().signal, dispatch: () => {}, getState: () => ({}) } as unknown as Parameters<BaseQueryFn>[1]
  return refreshTokens(api, {})
}

/**
 * Requests whose body carries the refresh token itself (logout). After a
 * 401 → refresh → retry, the token captured when the request was built has
 * just been rotated away — replaying it "succeeds" server-side but revokes
 * nothing (verified live: the new token stayed valid). Swap in the fresh one.
 */
function withFreshRefreshToken(args: string | FetchArgs): string | FetchArgs {
  if (typeof args === "string" || !args.body || typeof args.body !== "object") return args
  const body = args.body as Record<string, unknown>
  if (!("refreshToken" in body)) return args
  return { ...args, body: { ...body, refreshToken: getRefreshToken() ?? body.refreshToken } }
}

/**
 * Wraps fetchBaseQuery to transparently refresh the access token on a 401 and
 * retry the original request once. If the refresh itself is rejected, the
 * session is unrecoverable — see endDeadSession.
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  // Anonymous visitors hitting a bearer-only endpoint have no session to
  // refresh; only try when there's a token or a signed-in user to repair.
  if (result.error?.status === 401 && (getRefreshToken() || useNav.getState().user?.id)) {
    const refreshed = await refreshTokens(api, extraOptions)
    if (refreshed) {
      result = await rawBaseQuery(withFreshRefreshToken(args), api, extraOptions)
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: "vexoraApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Profile",
    "Quota",
    "Shortlist",
    "Membership",
    "Listing",
    "ListingMedia",
    "MyListings",
    "ListingQuota",
    "BuilderProfile",
    "Project",
    "Receipts",
    "Lead",
    "CrmLeads",
    "Ads",
    "Notifications",
    "NotificationPrefs",
    "Referrals",
    "Kyc",
    "Badges",
  ],
  endpoints: () => ({}),
})
