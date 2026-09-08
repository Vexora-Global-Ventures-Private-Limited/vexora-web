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
  type OtpChannel,
  type OtpPurpose,
  type GoogleLoginResponse,
  type GoogleMode,
} from "@/store/api/authApi"
import { setTokens, clearTokens, getRefreshToken } from "@/lib/auth-tokens"
import { useNav, type User } from "@/lib/nav-store"

/**
 * The backend (api.json) has no concept of membership tier — every freshly
 * authenticated user starts on the Free tier client-side until a real
 * membership/tier API exists. fullName isn't returned by the login/verify
 * responses themselves (it lives on the separate profile resource), so
 * callers should fetch GET /auth/me right after login and pass its `profile`
 * here — a returning user who already completed their profile gets their
 * real name instead of their raw phone number/email.
 */
// Exported so SessionHydrator can reuse it to refresh the nav user from
// GET /auth/me on hard reload, not just right after login.
export function mapApiUserToNavUser(
  apiUser: ApiUser,
  profile?: { fullName?: string | null } | null,
  previousUser?: User | null,
): User {
  const displayName = profile?.fullName || apiUser.email || apiUser.mobile || "New Member"
  const initials =
    displayName
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "NM"

  return {
    name: displayName,
    email: apiUser.email ?? "",
    phone: apiUser.mobile,
    initials,
    // Tier has no backend concept (see module comment) — preserve whatever
    // was already set locally rather than resetting a Mercury/Jupiter/Venus
    // user back to Free every time this runs.
    tier: previousUser?.tier ?? "F",
    tierName: previousUser?.tierName ?? "Free Member",
    avatarColor: previousUser?.avatarColor ?? "#bd9935",
  }
}

export function useAuth() {
  const { login: setNavUser, logout: clearNavUser } = useNav()
  const [requestOtpMutation, requestOtpState] = useRequestOtpMutation()
  const [verifyOtpMutation, verifyOtpState] = useVerifyOtpMutation()
  const [resendOtpMutation, resendOtpState] = useResendOtpMutation()
  const [signupMutation, signupState] = useSignupMutation()
  const [googleLoginMutation, googleLoginState] = useGoogleLoginMutation()
  const [logoutMutation] = useLogoutMutation()
  const [triggerGetMe] = useLazyGetMeQuery()

  // Tokens must already be set (via setTokens) before this runs, since
  // GET /auth/me is bearer-authenticated. Falls back to the login/verify
  // response's bare user object if /auth/me fails for any reason — better to
  // finish login with a phone-number display name than to block it.
  const finishLogin = useCallback(
    async (apiUser: ApiUser) => {
      try {
        const me = await triggerGetMe().unwrap()
        setNavUser(mapApiUserToNavUser(me.data.user, me.data.profile))
      } catch {
        setNavUser(mapApiUserToNavUser(apiUser))
      }
    },
    [triggerGetMe, setNavUser],
  )

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

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken()
    try {
      if (refreshToken) await logoutMutation({ refreshToken }).unwrap()
    } finally {
      clearTokens()
      clearNavUser()
    }
  }, [logoutMutation, clearNavUser])

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
  })

  return <>{children({ trigger, disabled: false })}</>
}
