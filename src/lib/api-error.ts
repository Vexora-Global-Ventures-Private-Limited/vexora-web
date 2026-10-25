/**
 * Every error response from the Vexora API (verified 2026-08-25 against the
 * live dev API) uses this envelope, e.g.
 * {"error":{"code":"OTP_NOT_FOUND","message":"Invalid OTP request"}}. This
 * isn't documented in api.json (which only lists status codes), so it's
 * confirmed empirically rather than from the spec.
 */
export type ApiErrorBody = { error: { code: string; message: string } }

/** Extracts the backend's own message from a caught RTK Query mutation error, if present. */
export function getApiErrorMessage(error: unknown): string | undefined {
  const message = getErrorEnvelope(error)?.message
  return typeof message === "string" ? message : undefined
}

/** Extracts the backend's own error `code` from a caught RTK Query mutation error, if present. */
export function getApiErrorCode(error: unknown): string | undefined {
  const code = getErrorEnvelope(error)?.code
  return typeof code === "string" ? code : undefined
}

function getErrorEnvelope(error: unknown): { code?: unknown; message?: unknown } | undefined {
  if (!error || typeof error !== "object" || !("data" in error)) return undefined
  const data = (error as { data?: unknown }).data
  if (!data || typeof data !== "object" || !("error" in data)) return undefined
  const inner = (data as { error?: unknown }).error
  if (!inner || typeof inner !== "object") return undefined
  return inner as { code?: unknown; message?: unknown }
}

/**
 * True when the request never got an API answer at all — offline, DNS,
 * CORS, or the client-side timeout in baseApi.ts — as opposed to the
 * backend rejecting it. Callers use this to say "check your connection"
 * instead of showing a misleading validation message.
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("status" in error)) return false
  const status = (error as { status: unknown }).status
  return status === "FETCH_ERROR" || status === "TIMEOUT_ERROR"
}

/**
 * One wording for every OTP / sign-in failure, shared by login, signup and
 * resend. `lockCode` tells the OTP screen the current code can never succeed
 * (expired, used, too many attempts) so it should clear the boxes and push
 * the user to "Resend" instead of letting them keep typing.
 *
 * Codes verified live 2026-10-24. Note the backend returns OTP_CONSUMED (not
 * the documented OTP_NOT_FOUND) for an otpId superseded by a resend, and the
 * 5th wrong code is still OTP_INVALID ("0 attempts remaining") — only the
 * 6th becomes OTP_MAX_ATTEMPTS — so "0 attempts" is treated as locked too.
 */
export function describeAuthError(
  error: unknown,
  fallback: string,
): { message: string; code?: string; lockCode: boolean } {
  const code = getApiErrorCode(error)
  const backendMessage = getApiErrorMessage(error)
  if (isNetworkError(error)) {
    return { message: "Couldn't reach VXP. Check your connection and try again.", lockCode: false }
  }
  switch (code) {
    case "OTP_INVALID":
      if (backendMessage && /\b0 attempts remaining/i.test(backendMessage)) {
        return { code, message: "Too many wrong codes — request a new one.", lockCode: true }
      }
      // The message already carries "N attempts remaining" — there's no structured field for it.
      return { code, message: backendMessage ?? "That code didn't match. Please try again.", lockCode: false }
    case "OTP_MAX_ATTEMPTS":
      return { code, message: "Too many wrong codes — request a new one.", lockCode: true }
    case "OTP_EXPIRED":
      return { code, message: "This code has expired — request a new one.", lockCode: true }
    case "OTP_CONSUMED":
    case "OTP_NOT_FOUND":
      return { code, message: "This code can't be used any more — request a new one.", lockCode: true }
    case "RATE_LIMITED":
      return { code, message: "Too many codes requested. Please wait a few minutes and try again.", lockCode: false }
    case "ACCOUNT_SUSPENDED":
      return {
        code,
        message: "This account has been suspended. Contact support if you think this is a mistake.",
        lockCode: true,
      }
    default:
      return { code, message: backendMessage ?? fallback, lockCode: false }
  }
}

/**
 * ?returnTo values are only followed when they're same-site paths. A bare
 * startsWith("/") check isn't enough: "//evil.com" and "/\evil.com" are
 * protocol-relative URLs browsers happily navigate off-site.
 */
export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null
  try {
    const url = new URL(value, "https://vxp.local")
    return url.origin === "https://vxp.local" ? `${url.pathname}${url.search}${url.hash}` : null
  } catch {
    return null
  }
}
