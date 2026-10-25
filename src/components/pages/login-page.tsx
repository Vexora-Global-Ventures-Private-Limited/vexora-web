"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, Lock, Phone, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2,
} from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useAuth, GoogleSignInButton } from "@/hooks/use-auth"
import { describeAuthError, getApiErrorCode, safeReturnTo } from "@/lib/api-error"
import { isValidEmail, isValidIndianMobile } from "@/lib/profile-options"
import { useNav } from "@/lib/nav-store"
import { useLazyGetProfileQuery, missingProfileFields } from "@/store/api/usersApi"
import { GoogleIcon } from "@/components/icons/google-icon"
import { OtpCodeInput, emptyOtp, formatCountdown } from "@/components/site/otp-code-input"
import { useGuestGuard } from "@/lib/use-session-guard"
import type { OtpChannel } from "@/store/api/authApi"

type AuthMethod = "select" | "google-loading" | "mobile" | "email" | "otp"

const RESEND_COOLDOWN_S = 30

/** Why the visitor was sent here (set by baseApi when a session dies). */
const REASON_MESSAGE: Record<string, string> = {
  expired: "Your session has ended. Please sign in again.",
  suspended: "This account has been suspended. Contact support if you think this is a mistake.",
}

export function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Only ever follow a same-site path — see safeReturnTo.
  const returnTo = safeReturnTo(searchParams.get("returnTo"))
  const destination = returnTo || ROUTES.dashboard
  useGuestGuard(destination)
  // ?mobile= / ?email= prefill — set by signup's "log in instead" link.
  const prefillMobile = (searchParams.get("mobile") ?? "").replace(/\D/g, "").slice(0, 10)
  const prefillEmail = searchParams.get("email") ?? ""
  const [method, setMethod] = useState<AuthMethod>(prefillMobile ? "mobile" : prefillEmail ? "email" : "select")
  const [phone, setPhone] = useState(prefillMobile)
  const [email, setEmail] = useState(prefillEmail)
  const [channel, setChannel] = useState<OtpChannel>("mobile")
  const [otp, setOtp] = useState(emptyOtp)
  const [submitted, setSubmitted] = useState(false)
  const [nextHref, setNextHref] = useState(destination)
  const [otpId, setOtpId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(() => REASON_MESSAGE[searchParams.get("reason") ?? ""] ?? null)
  // Login attempt for a number/email with no account — offer signup instead of a dead end.
  const [notRegistered, setNotRegistered] = useState(false)
  // The current code can't succeed any more (expired / used / too many tries).
  const [codeLocked, setCodeLocked] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [expiresIn, setExpiresIn] = useState(0)
  const verifying = useRef(false)

  const {
    requestOtp, resendOtp, verifyOtp,
    isRequestingOtp, isResendingOtp, isVerifyingOtp,
  } = useAuth()
  const [fetchProfile] = useLazyGetProfileQuery()

  const trimmedEmail = email.trim()
  const otpDestination = channel === "mobile" ? `+91${phone}` : trimmedEmail
  const phoneValid = isValidIndianMobile(phone)
  const emailValid = isValidEmail(trimmedEmail)

  // Auto-continue shortly after a successful sign-in.
  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => router.push(nextHref), 1400)
    return () => clearTimeout(t)
  }, [submitted, router, nextHref])

  // One ticking interval while the OTP screen is up: resend cooldown and the
  // code's own 5-minute expiry (from expiresInSeconds) count down together.
  useEffect(() => {
    if (method !== "otp") return
    const t = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1))
      setExpiresIn((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [method])

  const startOtp = (result: { data: { otpId: string; expiresInSeconds: number } }, ch: OtpChannel) => {
    setOtpId(result.data.otpId)
    setOtp(emptyOtp())
    setChannel(ch)
    setCodeLocked(false)
    setExpiresIn(result.data.expiresInSeconds)
    setResendCooldown(RESEND_COOLDOWN_S)
    setMethod("otp")
  }

  const handleRequestError = (error: unknown, fallback: string) => {
    if (getApiErrorCode(error) === "NOT_REGISTERED") {
      setNotRegistered(true)
      setFormError(null)
      return
    }
    setFormError(describeAuthError(error, fallback).message)
  }

  const handleSendMobileOtp = async () => {
    if (!phoneValid || isRequestingOtp) return
    setFormError(null)
    setNotRegistered(false)
    try {
      startOtp(await requestOtp(`+91${phone}`, "mobile", "login"), "mobile")
    } catch (error) {
      handleRequestError(error, "Couldn't send the OTP. Please check the number and try again.")
    }
  }

  const handleSendEmailOtp = async () => {
    if (!emailValid || isRequestingOtp) return
    setFormError(null)
    setNotRegistered(false)
    try {
      startOtp(await requestOtp(trimmedEmail, "email", "login"), "email")
    } catch (error) {
      handleRequestError(error, "Couldn't send the OTP. Please check the address and try again.")
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResendingOtp) return
    setFormError(null)
    try {
      // Always verify against the newest otpId — a resend invalidates the old one.
      startOtp(await resendOtp(otpDestination, channel, "login"), channel)
    } catch (error) {
      setFormError(describeAuthError(error, "Couldn't resend the OTP. Please try again.").message)
    }
  }

  /**
   * Where to go after signing in. An account whose profile isn't complete
   * (profile-options rules) finishes it first — then continues to wherever
   * it was headed. A failed check never blocks sign-in.
   */
  const resolveNextHref = async () => {
    const user = useNav.getState().user
    const profile = await fetchProfile(undefined, false).unwrap().catch(() => null)
    if (profile && user && missingProfileFields(profile, { phone: user.phone, email: user.email }).length > 0) {
      return `${ROUTES.signup}?${new URLSearchParams({ step: "profile", returnTo: destination })}`
    }
    return destination
  }

  const finishSignIn = async () => {
    setNextHref(await resolveNextHref())
    setSubmitted(true)
  }

  const handleOtpSubmit = async (code = otp.join("")) => {
    // A ref, not state: auto-submit on the 6th digit and a tap on the button
    // can land in the same tick — a second verify of the same code would
    // fail with OTP_CONSUMED.
    if (!otpId || code.length !== 6 || codeLocked || verifying.current) return
    verifying.current = true
    setFormError(null)
    try {
      await verifyOtp(otpId, code)
      await finishSignIn()
    } catch (error) {
      const { message, lockCode } = describeAuthError(error, "That code didn't match. Please try again.")
      setFormError(message)
      setOtp(emptyOtp())
      if (lockCode) setCodeLocked(true)
    } finally {
      verifying.current = false
    }
  }

  const signupHref = () => {
    const params = new URLSearchParams()
    if (returnTo) params.set("returnTo", returnTo)
    if (method === "mobile" && phone) params.set("mobile", phone)
    if (method === "email" && trimmedEmail) params.set("email", trimmedEmail)
    const qs = params.toString()
    return qs ? `${ROUTES.signup}?${qs}` : ROUTES.signup
  }

  const notRegisteredNotice = notRegistered && (
    <div className="mt-3 border border-brand-primary/40 bg-brand-primary/10 px-3 py-2 text-xs text-brand-secondary" role="status">
      No VXP account uses this {method === "email" ? "email" : "number"} yet.{" "}
      <button onClick={() => router.push(signupHref())} className="font-bold text-brand-primary-dark underline">
        Sign up instead →
      </button>
    </div>
  )

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-black">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-primary-dark/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-primary-dark/10 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
          <div className="absolute inset-0">
            <Image
              src="/images/hero-dubai-sunset.png"
              alt="Premium real estate"
              fill
              sizes="50vw"
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-ink-black/80 via-ink-black/60 to-brand-primary-dark/20" />
          </div>

          <div className="relative">
            <button
              onClick={() => router.push(ROUTES.home)}
              className="group flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-white"
            >
              <span className="grid h-9 w-9 place-items-center border border-white/20 backdrop-blur-sm transition-colors group-hover:border-brand-primary-dark">
                <ArrowLeft className="h-4 w-4" />
              </span>
              Back to home
            </button>
          </div>

          <div className="relative">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center bg-gradient-to-br from-brand-primary-dark via-brand-primary-dark to-gold-700 shadow-lg shadow-brand-primary-dark/30">
                <span className="font-serif text-2xl font-bold text-brand-secondary">V</span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-white">VXP</div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-brand-primary-dark">Elite Real Estate</div>
              </div>
            </div>
            <h1 className="font-serif text-5xl font-bold leading-tight text-white">
              Welcome back to <span className="text-gold-gradient italic">India&apos;s elite</span> marketplace.
            </h1>
            <p className="mt-4 max-w-md text-white/65">
              Unlock verified luxury listings, contact owners directly, and access your CRM-powered lead pipeline.
            </p>
            <div className="mt-8 flex items-center gap-6 text-xs text-white/50">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-brand-primary-dark" /> RERA-verified</span>
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-brand-primary-dark" /> Bank-grade encryption</span>
              <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-brand-primary-dark" /> No spam, ever</span>
            </div>
          </div>
        </div>

        {/* Right auth panel */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <button
              onClick={() => router.push(ROUTES.home)}
              className="mb-6 flex items-center gap-2 text-sm font-semibold text-white/70 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" /> Back to home
            </button>

            <AnimatePresence mode="wait">
              {submitted && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-card p-8 text-center shadow-2xl shadow-brand-primary-dark/10"
                >
                  <CheckCircle2 className="mx-auto h-12 w-12 text-brand-primary-dark" />
                  <h2 className="mt-4 font-serif text-2xl font-bold text-brand-secondary">You&apos;re signed in</h2>
                  <p className="mt-2 text-sm text-brand-secondary/65">
                    {nextHref !== destination
                      ? "One more step — let's finish your profile…"
                      : returnTo
                        ? "Taking you back to continue…"
                        : "Taking you to your dashboard…"}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(nextHref)}
                    className="btn-gold mt-6 w-full overflow-hidden py-3.5 text-sm font-bold"
                  >
                    <span className="relative z-10">{returnTo || nextHref !== destination ? "Continue →" : "Go to dashboard →"}</span>
                  </motion.button>
                </motion.div>
              )}

              {!submitted && method === "select" && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card p-8 shadow-2xl shadow-brand-primary-dark/10"
                >
                  <div className="mb-1 text-center">
                    <h2 className="font-serif text-3xl font-bold text-brand-secondary">Sign in to VXP</h2>
                    <p className="mt-2 text-sm text-brand-secondary/60">Choose your preferred method to continue</p>
                  </div>

                  {formError && (
                    <p className="mt-4 text-center text-xs font-semibold text-red-500">{formError}</p>
                  )}

                  <div className="mt-8 space-y-3">
                    <GoogleSignInButton
                      mode="login"
                      onSuccess={() => {
                        void finishSignIn()
                      }}
                      onError={(error) => {
                        // PARTNER-AUTH-INTEGRATION.md §2 — mode:"login" 404s as
                        // NOT_REGISTERED when the Google email has no VXP
                        // account yet. The "New to VXP? Create an account"
                        // link is right below this button.
                        const message =
                          getApiErrorCode(error) === "NOT_REGISTERED"
                            ? "No account found for that Google account — please sign up below."
                            : error instanceof Error && !getApiErrorCode(error)
                              ? error.message
                              : describeAuthError(error, "Google sign-in failed. Please try again.").message
                        setFormError(message)
                        setMethod("select")
                      }}
                    >
                      {({ trigger, disabled }) => (
                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setFormError(null)
                            setMethod("google-loading")
                            trigger()
                          }}
                          disabled={disabled}
                          title={disabled ? "Google sign-in is not configured yet" : undefined}
                          className="flex w-full items-center justify-center gap-3 border border-brand-border-light bg-card py-3.5 text-sm font-bold text-brand-secondary transition-colors hover:border-brand-primary-dark hover:bg-brand-surface disabled:opacity-50"
                        >
                          <GoogleIcon />
                          Continue with Google
                        </motion.button>
                      )}
                    </GoogleSignInButton>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setFormError(null)
                        setNotRegistered(false)
                        setMethod("mobile")
                      }}
                      className="flex w-full items-center justify-center gap-3 border border-brand-border-light bg-card py-3.5 text-sm font-bold text-brand-secondary transition-colors hover:border-brand-primary-dark hover:bg-brand-surface"
                    >
                      <Phone className="h-4 w-4 text-brand-primary-dark" /> Mobile + OTP
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setFormError(null)
                        setNotRegistered(false)
                        setMethod("email")
                      }}
                      className="flex w-full items-center justify-center gap-3 border border-brand-border-light bg-card py-3.5 text-sm font-bold text-brand-secondary transition-colors hover:border-brand-primary-dark hover:bg-brand-surface"
                    >
                      <Mail className="h-4 w-4 text-brand-primary-dark" /> Continue with Email
                    </motion.button>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-brand-border-light" />
                    <span className="text-[10px] uppercase tracking-wider text-brand-secondary/40">or</span>
                    <div className="h-px flex-1 bg-brand-border-light" />
                  </div>

                  <button
                    onClick={() => router.push(returnTo ? ROUTES.signupWithReturn(returnTo) : ROUTES.signup)}
                    className="mt-5 w-full text-center text-sm font-semibold text-brand-primary-dark hover:text-brand-secondary"
                  >
                    New to VXP? Create an account →
                  </button>

                  <p className="mt-6 text-center text-[11px] leading-relaxed text-brand-secondary/50">
                    By continuing you agree to VXP&apos;s Terms &amp; Privacy Policy.
                    <br />
                    No commissions. No settlement. Visibility &amp; leads only.
                  </p>
                </motion.div>
              )}

              {!submitted && method === "google-loading" && (
                <motion.div
                  key="google-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-card p-12 shadow-2xl shadow-brand-primary-dark/10"
                >
                  <div className="flex flex-col items-center text-center">
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, ease: "backOut" }}
                      className="relative mb-6 grid h-20 w-20 place-items-center rounded-full bg-card shadow-xl ring-1 ring-brand-border-light"
                    >
                      <GoogleIcon size={36} />
                      <motion.div
                        className="absolute -inset-2 rounded-full border-2 border-brand-primary-dark border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="font-serif text-2xl font-bold text-brand-secondary"
                    >
                      Connecting to Google
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mt-2 text-sm text-brand-secondary/60"
                    >
                      Finish signing in in the Google window…
                    </motion.p>
                  </div>
                </motion.div>
              )}

              {!submitted && method === "mobile" && (
                <motion.div
                  key="mobile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card p-8 shadow-2xl shadow-brand-primary-dark/10"
                >
                  <button
                    onClick={() => setMethod("select")}
                    className="mb-4 flex items-center gap-2 text-xs font-semibold text-brand-secondary/55 hover:text-brand-secondary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> All sign-in options
                  </button>
                  <h2 className="font-serif text-3xl font-bold text-brand-secondary">Mobile + OTP</h2>
                  <p className="mt-2 text-sm text-brand-secondary/60">
                    Enter your mobile number — we&apos;ll send a 6-digit OTP.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void handleSendMobileOtp()
                    }}
                    noValidate
                  >
                    <div className="mt-6">
                      <label htmlFor="login-mobile" className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">
                        Mobile number
                      </label>
                      <div className="mt-1.5 flex items-center gap-2 border border-brand-border-light bg-card px-4 py-3 focus-within:border-brand-primary-dark">
                        <span className="text-sm font-semibold text-brand-secondary/70">+91</span>
                        <span className="h-5 w-px bg-brand-border-light" />
                        <input
                          id="login-mobile"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          autoFocus
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                            setNotRegistered(false)
                          }}
                          aria-invalid={phone.length === 10 && !phoneValid}
                          placeholder="98765 43210"
                          className="w-full bg-transparent text-sm font-medium text-brand-secondary outline-none placeholder:text-brand-secondary/40"
                        />
                      </div>
                      {phone.length === 10 && !phoneValid && (
                        <p className="mt-1 text-[11px] text-red-500">Indian mobile numbers start with 6, 7, 8 or 9.</p>
                      )}
                    </div>
                    {notRegisteredNotice}
                    {formError && (
                      <p className="mt-3 text-xs font-semibold text-red-500" role="alert">{formError}</p>
                    )}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!phoneValid || isRequestingOtp}
                      className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold disabled:opacity-50"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {isRequestingOtp ? "Sending…" : "Send OTP"} <ArrowRight className="h-4 w-4" />
                      </span>
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {!submitted && method === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card p-8 shadow-2xl shadow-brand-primary-dark/10"
                >
                  <button
                    onClick={() => {
                      setFormError(null)
                      setMethod(channel)
                    }}
                    className="mb-4 flex items-center gap-2 text-xs font-semibold text-brand-secondary/55 hover:text-brand-secondary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> {channel === "mobile" ? "Change number" : "Change email"}
                  </button>
                  <h2 className="font-serif text-3xl font-bold text-brand-secondary">Verify OTP</h2>
                  <p className="mt-2 text-sm text-brand-secondary/60">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-bold text-brand-secondary">
                      {channel === "mobile" ? `+91 ${phone}` : trimmedEmail}
                    </span>
                  </p>
                  <OtpCodeInput
                    value={otp}
                    onChange={(next) => {
                      setOtp(next)
                      if (formError && !codeLocked) setFormError(null)
                    }}
                    onComplete={(code) => void handleOtpSubmit(code)}
                    disabled={codeLocked || isVerifyingOtp}
                    invalid={!!formError}
                  />
                  <p className="mt-3 text-center text-[11px] text-brand-secondary/50" aria-live="polite">
                    {codeLocked
                      ? "Request a new code to continue."
                      : expiresIn > 0
                        ? `Code expires in ${formatCountdown(expiresIn)}`
                        : "This code has expired — request a new one."}
                  </p>
                  <div className="mt-2 text-center text-xs text-brand-secondary/55">
                    Didn&apos;t receive it?{" "}
                    {resendCooldown > 0 ? (
                      <span className="font-bold text-brand-secondary/40">Resend in {formatCountdown(resendCooldown)}</span>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        disabled={isResendingOtp}
                        className="font-bold text-brand-primary-dark hover:underline disabled:opacity-50"
                      >
                        {isResendingOtp ? "Sending…" : "Resend code"}
                      </button>
                    )}
                  </div>
                  {formError && (
                    <p className="mt-3 text-center text-xs font-semibold text-red-500" role="alert">{formError}</p>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => void handleOtpSubmit()}
                    disabled={!otp.every((d) => d) || isVerifyingOtp || codeLocked || expiresIn === 0}
                    className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isVerifyingOtp ? "Verifying…" : "Verify & Continue"} <ArrowRight className="h-4 w-4" />
                    </span>
                  </motion.button>
                </motion.div>
              )}

              {!submitted && method === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-card p-8 shadow-2xl shadow-brand-primary-dark/10"
                >
                  <button
                    onClick={() => setMethod("select")}
                    className="mb-4 flex items-center gap-2 text-xs font-semibold text-brand-secondary/55 hover:text-brand-secondary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> All sign-in options
                  </button>
                  <h2 className="font-serif text-3xl font-bold text-brand-secondary">Email</h2>
                  <p className="mt-2 text-sm text-brand-secondary/60">
                    Enter your email — we&apos;ll send a 6-digit OTP.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void handleSendEmailOtp()
                    }}
                    noValidate
                  >
                    <div className="mt-6">
                      <label htmlFor="login-email" className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">
                        Email address
                      </label>
                      <div className="mt-1.5 flex items-center gap-2 border border-brand-border-light bg-card px-4 py-3 focus-within:border-brand-primary-dark">
                        <Mail className="h-4 w-4 text-brand-primary-dark" />
                        <input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          autoFocus
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            setNotRegistered(false)
                          }}
                          placeholder="you@email.com"
                          className="w-full bg-transparent text-sm font-medium text-brand-secondary outline-none placeholder:text-brand-secondary/40"
                        />
                      </div>
                    </div>
                    {notRegisteredNotice}
                    {formError && (
                      <p className="mt-3 text-xs font-semibold text-red-500" role="alert">{formError}</p>
                    )}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={!emailValid || isRequestingOtp}
                      className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold disabled:opacity-50"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {isRequestingOtp ? "Sending…" : "Send OTP"} <ArrowRight className="h-4 w-4" />
                      </span>
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
