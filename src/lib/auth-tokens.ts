const ACCESS_TOKEN_KEY = "vxp-access-token"
const REFRESH_TOKEN_KEY = "vxp-refresh-token"

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(tokens: { accessToken: string; refreshToken: string }): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

/**
 * The access token's claims (unverified — only for client-side decisions
 * like "is this token stale?", never for authorisation). null when there's
 * no token or it can't be read.
 */
export function getAccessTokenClaims(): Record<string, unknown> | null {
  const token = getAccessToken()
  const payload = token?.split(".")[1]
  if (!payload) return null
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(payload.length / 4) * 4, "=")
    return JSON.parse(atob(base64)) as Record<string, unknown>
  } catch {
    return null
  }
}
