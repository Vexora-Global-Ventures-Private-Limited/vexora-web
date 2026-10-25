import { baseApi } from "./baseApi"

export type OtpChannel = "mobile" | "email"
export type OtpPurpose = "login" | "mobile_verify" | "email_verify"

export type OtpRequestBody = {
  destination: string
  channel: OtpChannel
  purpose: OtpPurpose
}

export type OtpRequestResponse = {
  data: {
    otpId: string
    expiresInSeconds: number
  }
}

export type VerifyOtpBody = {
  otpId: string
  code: string
}

export type ApiUser = {
  id: string
  email?: string
  mobile?: string
  status: string
  // Present on GET /auth/me (verified against the live dev API); omitted
  // from the login/verify responses.
  mobileVerifiedAt?: string | null
  createdAt?: string
}

export type VerifyOtpResponse = {
  data: {
    accessToken: string
    refreshToken: string
    user: ApiUser
  }
}

export type GoogleMode = "login" | "signup"

export type GoogleLoginBody = {
  code: string
  redirectUri: string
  // NEW (PARTNER-AUTH-INTEGRATION.md §2) — Google has no OTP step, so this is
  // the only signal that tells the backend which screen sent the request:
  // "login" 404s as NOT_REGISTERED if the email isn't a known account yet;
  // "signup" 409s as ALREADY_REGISTERED if it already is.
  mode: GoogleMode
}

export type GoogleLoginResponse = {
  data: {
    accessToken: string
    refreshToken: string
    user: ApiUser
    isNewUser: boolean
  }
}

// /auth/signup is a distinct endpoint from /auth/otp/request — no `purpose`
// field (signup itself is the purpose) — verified against the live dev API
// for both channels: {"destination":"+91...","channel":"mobile"} and
// {"destination":"...@...","channel":"email"} both 200 with the same
// {otpId, expiresInSeconds} shape as an OTP request. Verification still goes
// through the shared /auth/otp/verify below.
export type SignupBody = {
  destination: string
  channel: OtpChannel
}

export type RefreshTokenBody = {
  refreshToken: string
}

export type RefreshTokenResponse = {
  data: {
    accessToken: string
    refreshToken: string
  }
}

export type LogoutBody = {
  refreshToken: string
  allDevices?: boolean
}

// GET /auth/me's `profile` is sparse — only fields that have actually been
// set are present at all, and it's null for a brand-new account (verified
// against the live dev API). The full resource is GET /users/me/profile.
export type GetMeResponse = {
  data: {
    user: ApiUser
    profile: {
      fullName?: string | null
      city?: string | null
      state?: string | null
      intent?: string | null
      avatarUrl?: string | null
      completedAt?: string | null
    } | null
  }
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    requestOtp: builder.mutation<OtpRequestResponse, OtpRequestBody>({
      query: (body) => ({ url: "/api/v1/auth/otp/request", method: "POST", body }),
    }),
    verifyOtp: builder.mutation<VerifyOtpResponse, VerifyOtpBody>({
      query: (body) => ({ url: "/api/v1/auth/otp/verify", method: "POST", body }),
    }),
    resendOtp: builder.mutation<OtpRequestResponse, OtpRequestBody>({
      query: (body) => ({ url: "/api/v1/auth/otp/resend", method: "POST", body }),
    }),
    signup: builder.mutation<OtpRequestResponse, SignupBody>({
      query: (body) => ({ url: "/api/v1/auth/signup", method: "POST", body }),
    }),
    googleLogin: builder.mutation<GoogleLoginResponse, GoogleLoginBody>({
      query: (body) => ({ url: "/api/v1/auth/google", method: "POST", body }),
    }),
    // Used directly only by the reauth wrapper in baseApi.ts — exported for completeness/testing.
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenBody>({
      query: (body) => ({ url: "/api/v1/auth/refresh", method: "POST", body }),
    }),
    logout: builder.mutation<void, LogoutBody>({
      query: (body) => ({ url: "/api/v1/auth/logout", method: "POST", body }),
    }),
    getMe: builder.query<GetMeResponse, void>({
      query: () => ({ url: "/api/v1/auth/me", method: "GET" }),
      providesTags: ["Profile"],
    }),
  }),
})

export const {
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useSignupMutation,
  useGoogleLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
} = authApi
