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

// The full profile resource (GET /users/me/profile) isn't integrated here —
// only auth is. This is just the one field the login flow reads off
// GET /auth/me's sparse `profile` (only fields that have actually been set
// are present at all; verified 2026-08-25 against the live dev API).
export type GetMeResponse = {
  data: {
    user: ApiUser
    profile: { fullName?: string | null } | null
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
  useGoogleLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
} = authApi
