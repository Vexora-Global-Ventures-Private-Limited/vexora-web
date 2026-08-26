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
  if (!error || typeof error !== "object" || !("data" in error)) return undefined
  const data = (error as { data?: unknown }).data
  if (!data || typeof data !== "object" || !("error" in data)) return undefined
  const inner = (data as { error?: unknown }).error
  if (!inner || typeof inner !== "object" || !("message" in inner)) return undefined
  const message = (inner as { message?: unknown }).message
  return typeof message === "string" ? message : undefined
}
