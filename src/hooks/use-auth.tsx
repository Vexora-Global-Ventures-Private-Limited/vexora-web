"use client"

import { useCallback, type ReactNode } from "react"
import { useGoogleLogin } from "@react-oauth/google"
import {
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useSignupMutation,
  useGoogleLoginMutation,
  useLogoutMutation,
  useLazyGetMeQuery,
  type ApiUser,
  type GetMeResponse,
  type OtpChannel,
  type OtpPurpose,
  type GoogleLoginResponse,
  type GoogleMode,
} from "@/store/api/authApi"
import { setTokens, clearTokens, getRefreshToken } from "@/lib/auth-tokens"
import { useNav, tierName, type Tier, type User } from "@/lib/nav-store"
import { useLazyGetMyMembershipQuery, toNavTier } from "@/store/api/membershipsApi"
import { baseApi } from "@/store/api/baseApi"
import { useAppDispatch } from "@/store/hooks"
import { useShortlistStore } from "@/lib/shortlist-store"
import { useContactStore } from "@/lib/contact-store"

/**
 * Builds the nav-store user from the backend's pieces. fullName isn't on the
 * login/verify responses (it lives on the profile resource), and tier isn't
 * on /auth/me at all — it comes from GET /memberships/me. When `tier` isn't
 * passed (e.g. that call failed), whatever tier was already set locally is
 * kept rather than resetting a paying member back to Free.
 */
// Exported so SessionHydrator can reuse it to refresh the nav user from
// GET /auth/me on hard reload, not just right after login.
export function mapApiUserToNavUser(
  apiUser: ApiUser,
  profile?: GetMeResponse["data"]["profile"],
  previousUser?: User | null,
  tier?: Tier,
): User {
  const displayName = profile?.fullName || apiUser.email || apiUser.mobile || "New Member"
  const initials =
    displayName
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "NM"
  const resolvedTier = tier ?? previousUser?.tier ?? "F"

  return {
    id: apiUser.id,
    name: displayName,
    email: apiUser.email ?? "",
    phone: apiUser.mobile,
    initials,
    tier: resolvedTier,
    tierName: tierName(resolvedTier),
    avatarColor: previousUser?.avatarColor ?? "#bd9935",
    // Completeness is NOT mirrored here: the app's rule (profile-options.ts)
    // is stricter than the backend's completedAt, so screens compute it fresh.
    avatarUrl: profile?.avatarUrl ?? null,
  }
}

/**
 * Session assembly — /auth/me no longer bundles tier/quota/badges, so the
 * identity and the tier are fetched in parallel and merged here. Tokens must
 * already be stored. Quota is deliberately not part of the session (it goes
 * stale on every contact — screens fetch it fresh), and /users/{id}/badges
 * isn't deployed on the API yet.
 */
export function useLoadSession() {
  const [triggerGetMe] = useLazyGetMeQuery()
  const [triggerGetMembership] = useLazyGetMyMembershipQuery()
  const setNavUser = useNav((s) => s.login)

  return useCallback(
    async (fallbackUser?: ApiUser) => {
      const [me, membership] = await Promise.allSettled([
        triggerGetMe().unwrap(),
        triggerGetMembership().unwrap(),
      ])
      const tier = membership.status === "fulfilled" ? toNavTier(membership.value) : undefined
      const previous = useNav.getState().user
      if (me.status === "fulfilled") {
        setNavUser(mapApiUserToNavUser(me.value.data.user, me.value.data.profile, previous, tier))
        void useShortlistStore.getState().syncFromServer()
      } else if (fallbackUser) {
        // Better to finish login with a phone-number display name than to block it.
        setNavUser(mapApiUserToNavUser(fallbackUser, null, previous, tier))
      } else {
        throw me.reason
      }
    },
    [triggerGetMe, triggerGetMembership, setNavUser],
  )
}

export function useAuth() {
  const clearNavUser = useNav((s) => s.logout)
  const dispatch = useAppDispatch()
  const [requestOtpMutation, requestOtpState] = useRequestOtpMutation()
  const [verifyOtpMutation, verifyOtpState] = useVerifyOtpMutation()
  const [resendOtpMutation, resendOtpState] = useResendOtpMutation()
  const [signupMutation, signupState] = useSignupMutation()
  const [googleLoginMutation, googleLoginState] = useGoogleLoginMutation()
  const [logoutMutation] = useLogoutMutation()
  const loadSession = useLoadSession()

  // Tokens must already be set (via setTokens) before this runs, since every
  // session call is bearer-authenticated.
  const finishLogin = useCallback((apiUser: ApiUser) => loadSession(apiUser), [loadSession])

  const requestOtp = useCallback(
    (destination: string, channel: OtpChannel, purpose: OtpPurpose) =>
      requestOtpMutation({ destination, channel, purpose }).unwrap(),
    [requestOtpMutation],
  )

  const resendOtp = useCallback(
    (destination: string, channel: OtpChannel, purpose: OtpPurpose) =>
      resendOtpMutation({ destination, channel, purpose }).unwrap(),
    [resendOtpMutation],
  )

  // /auth/signup — distinct from requestOtp's /auth/otp/request: this is
  // what a *new* account should call (no `purpose` field, it IS the
  // purpose), for either channel. Resend still just re-calls this same
  // mutation for a fresh otpId, since /auth/otp/resend expects an OtpPurpose
  // and "signup" isn't one.
  const signup = useCallback(
    (destination: string, channel: OtpChannel) => signupMutation({ destination, channel }).unwrap(),
    [signupMutation],
  )

  const verifyOtp = useCallback(
    async (otpId: string, code: string) => {
      const result = await verifyOtpMutation({ otpId, code }).unwrap()
      setTokens({ accessToken: result.data.accessToken, refreshToken: result.data.refreshToken })
      await finishLogin(result.data.user)
      return result
    },
    [verifyOtpMutation, finishLogin],
  )

  const loginWithGoogle = useCallback(
    async (code: string, redirectUri: string, mode: GoogleMode) => {
      const result = await googleLoginMutation({ code, redirectUri, mode }).unwrap()
      setTokens({ accessToken: result.data.accessToken, refreshToken: result.data.refreshToken })
      await finishLogin(result.data.user)
      return result
    },
    [googleLoginMutation, finishLogin],
  )

  // Never throws: the user's intent ("sign me out of this device, now")
  // always succeeds locally, even when the server-side revoke can't be
  // reached — callers can rely on navigating away afterwards.
  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) await logoutMutation({ refreshToken }).unwrap()
    } catch {
      // Offline / already-dead token — the local clear below is what matters.
    } finally {
      clearTokens()
      clearNavUser()
      // The shortlist belongs to the account, not the device.
      useShortlistStore.setState({ shortlistedIds: [], snapshots: {} })
      useContactStore.getState().clearApiLeads()
      // Drop every cached response (profile, shortlist, membership…) so the
      // next account signed in on this tab never sees the previous one's data.
      dispatch(baseApi.util.resetApiState())
    }
  }, [logoutMutation, clearNavUser, dispatch])

  return {
    requestOtp,
    resendOtp,
    signup,
    verifyOtp,
    loginWithGoogle,
    logout,
    isRequestingOtp: requestOtpState.isLoading,
    isResendingOtp: resendOtpState.isLoading,
    isSigningUp: signupState.isLoading,
    isVerifyingOtp: verifyOtpState.isLoading,
    isGoogleLoggingIn: googleLoginState.isLoading,
    requestOtpError: requestOtpState.error,
    signupError: signupState.error,
    verifyOtpError: verifyOtpState.error,
    googleLoginError: googleLoginState.error,
  }
}

const GOOGLE_NOT_CONFIGURED = new Error(
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set — Google Sign-In cannot run until it is configured.",
)

export type GoogleSignInRenderProps = { trigger: () => void; disabled: boolean }

export type GoogleSignInButtonProps = {
  // PARTNER-AUTH-INTEGRATION.md §2 — pass "login" from the login screen,
  // "signup" from the signup screen. Same account, different screen: the
  // backend decides NOT_REGISTERED vs. ALREADY_REGISTERED off this alone.
  mode: GoogleMode
  onSuccess: (result: GoogleLoginResponse) => void
  onError?: (error: unknown) => void
  children: (props: GoogleSignInRenderProps) => ReactNode
}

/**
 * Renders whatever `children` returns, handing it a `trigger()` to start the
 * Google "auth code" popup flow.
 *
 * @react-oauth/google's useGoogleLogin() calls Google's own
 * accounts.oauth2.initCodeClient() inside a useEffect that fires as soon as
 * its script loads — *not* lazily on click — and that call throws
 * synchronously ("Missing required parameter client_id.") if the client ID
 * is empty. So that hook can only ever be safely called when a real client
 * ID is configured. Rules of Hooks forbid calling it conditionally inline,
 * so instead the "real" trigger lives in a separate component
 * (ConfiguredGoogleTrigger) that is only mounted at all when configured —
 * the unconfigured branch below never touches useGoogleLogin.
 */
export function GoogleSignInButton({ mode, onSuccess, onError, children }: GoogleSignInButtonProps) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return <>{children({ trigger: () => onError?.(GOOGLE_NOT_CONFIGURED), disabled: true })}</>
  }
  return (
    <ConfiguredGoogleTrigger mode={mode} onSuccess={onSuccess} onError={onError}>
      {children}
    </ConfiguredGoogleTrigger>
  )
}

function ConfiguredGoogleTrigger({ mode, onSuccess, onError, children }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth()

  // redirectUri is fixed to "postmessage" — the value Google's client
  // library itself expects when exchanging a popup/auth-code-flow code
  // server-side.
  const trigger = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        const result = await loginWithGoogle(codeResponse.code, "postmessage", mode)
        onSuccess(result)
      } catch (error) {
        onError?.(error)
      }
    },
    onError: (error) => onError?.(error),
    // Anything that isn't an OAuth error from Google's own server — the
    // popup getting blocked, closed by the user before completing, or
    // failing to load — comes through here instead of onError (verified
    // against @react-oauth/google's source: it routes error_callback here,
    // completely separately from the callback onError above reads from).
    // Without this, any of those failures leaves the caller stuck on
    // whatever "connecting…" state it set before calling trigger(), with no
    // error and no way back to the method-select screen.
    onNonOAuthError: (error) => onError?.(error),
  })

  return <>{children({ trigger, disabled: false })}</>
}
