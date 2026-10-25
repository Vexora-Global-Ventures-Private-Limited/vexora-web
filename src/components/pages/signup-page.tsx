"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Lock, Mail, Check, Sparkles, User,
} from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useAuth, GoogleSignInButton } from "@/hooks/use-auth"
import { useGetProfileQuery } from "@/store/api/usersApi"
import { useNav } from "@/lib/nav-store"
import { ProfileDetailsForm } from "@/components/settings/profile-details-form"
import { describeAuthError, getApiErrorCode, safeReturnTo } from "@/lib/api-error"
import { isValidEmail, isValidIndianMobile } from "@/lib/profile-options"
import { OtpCodeInput, emptyOtp, formatCountdown } from "@/components/site/otp-code-input"
import { GoogleIcon } from "@/components/icons/google-icon"
import { useGuestGuard } from "@/lib/use-session-guard"
import type { OtpChannel } from "@/store/api/authApi"


const SIGNUP_LABEL_CLASS = "text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50"
const SIGNUP_INPUT_CLASS =
  "mt-1.5 w-full border border-brand-border-light bg-card px-4 py-3 text-sm font-medium text-brand-secondary outline-none focus:border-brand-primary-dark disabled:text-brand-secondary/60 aria-[invalid=true]:border-red-400"

const RESEND_COOLDOWN_S = 30

type Step = "method" | "email" | "otp" | "profile" | "google-loading"

export function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Only ever follow a same-site path — see safeReturnTo.
  const returnTo = safeReturnTo(searchParams.get("returnTo"))
  const destination = returnTo || ROUTES.dashboard
  // ?step=profile = an already signed-in account still finishing its profile
  // (this page after OTP/Google, a refresh mid-step, or the portal guard
  // sending an incomplete account back here). Don't bounce those away as
  // "already signed in" — the profile step is compulsory.
  const resumeProfile = searchParams.get("step") === "profile"
  useGuestGuard(destination, { enabled: !resumeProfile })
  const navUser = useNav((s) => s.user)
  const [step, setStepState] = useState<Step>(resumeProfile ? "profile" : "method")
  const setStep = (next: Step) => {
    setStepState(next)
    // Put the profile step in the URL so a refresh resumes it instead of
    // treating the (now signed-in) visitor as done.
    if (next === "profile") {
      const params = new URLSearchParams({ step: "profile", ...(returnTo ? { returnTo } : {}) })
      router.replace(`${ROUTES.signup}?${params}`)
    }
  }
  const { data: savedProfile, isError: profileLoadFailed, refetch: refetchProfile } = useGetProfileQuery(undefined, {
    skip: step !== "profile" || !navUser?.id,
  })
  // ?mobile= / ?email= prefill — set by login's "sign up instead" link.
  const [phone, setPhone] = useState(() => (searchParams.get("mobile") ?? "").replace(/\D/g, "").slice(0, 10))
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "")
  const [channel, setChannel] = useState<OtpChannel>("mobile")
  const [otp, setOtp] = useState(emptyOtp)
  const [submitted, setSubmitted] = useState(false)
  const [otpId, setOtpId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  // Signup attempt for a number/email that already has an account — offer login instead of a dead end.
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  // The current code can't succeed any more (expired / used / too many tries).
  const [codeLocked, setCodeLocked] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [expiresIn, setExpiresIn] = useState(0)
  const verifying = useRef(false)

  const { signup, verifyOtp, isSigningUp, isVerifyingOtp } = useAuth()
  const trimmedEmail = email.trim()
  const otpDestination = channel === "mobile" ? `+91${phone}` : trimmedEmail
  const phoneValid = isValidIndianMobile(phone)
  const emailValid = isValidEmail(trimmedEmail)

  // One ticking interval while the OTP step is up: resend cooldown and the
  // code's own 5-minute expiry (from expiresInSeconds) count down together.
  useEffect(() => {
    if (step !== "otp") return
    const t = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1))
      setExpiresIn((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [step])

  const startOtp = (result: { data: { otpId: string; expiresInSeconds: number } }, ch: OtpChannel) => {
    setOtpId(result.data.otpId)
    setOtp(emptyOtp())
    setChannel(ch)
    setCodeLocked(false)
    setExpiresIn(result.data.expiresInSeconds)
    setResendCooldown(RESEND_COOLDOWN_S)
    setStep("otp")
  }

  const handleRequestError = (error: unknown, fallback: string) => {
    if (getApiErrorCode(error) === "ALREADY_REGISTERED") {
      setAlreadyRegistered(true)
      setFormError(null)
      return
    }
    setFormError(describeAuthError(error, fallback).message)
  }

  const handleSendMobileOtp = async () => {
    if (!phoneValid || isSigningUp) return
    setFormError(null)
    setAlreadyRegistered(false)
    try {
      startOtp(await signup(`+91${phone}`, "mobile"), "mobile")
    } catch (error) {
      handleRequestError(error, "Couldn't send the OTP. Please check the number and try again.")
    }
  }

  const handleSendEmailOtp = async () => {
    if (!emailValid || isSigningUp) return
    setFormError(null)
    setAlreadyRegistered(false)
    try {
      startOtp(await signup(trimmedEmail, "email"), "email")
    } catch (error) {
      handleRequestError(error, "Couldn't send the OTP. Please check the address and try again.")
    }
  }

  const handleVerifyOtp = async (code = otp.join("")) => {
    // A ref, not state: auto-submit on the 6th digit and a tap on the button
    // can land in the same tick — a second verify of the same code would
    // fail with OTP_CONSUMED.
    if (!otpId || code.length !== 6 || codeLocked || verifying.current) return
    verifying.current = true
    setFormError(null)
    try {
      await verifyOtp(otpId, code)
      setStep("profile")
    } catch (error) {
      const { message, lockCode } = describeAuthError(error, "That code didn't match. Please try again.")
      setFormError(message)
      setOtp(emptyOtp())
      if (lockCode) setCodeLocked(true)
    } finally {
      verifying.current = false
    }
  }

  // /auth/signup has no separate resend endpoint -- /auth/otp/resend expects
  // an OtpPurpose and "signup" isn't one, so a fresh code is just another
  // /auth/signup call (it returns a new otpId same as the first one did).
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSigningUp) return
    setFormError(null)
    try {
      startOtp(await signup(otpDestination, channel), channel)
    } catch (error) {
      setFormError(describeAuthError(error, "Couldn't resend the OTP. Please try again.").message)
    }
  }

  const loginHref = (prefill?: { mobile?: string; email?: string }) => {
    const params = new URLSearchParams()
    if (returnTo) params.set("returnTo", returnTo)
    if (prefill?.mobile) params.set("mobile", prefill.mobile)
    if (prefill?.email) params.set("email", prefill.email)
    const qs = params.toString()
    return qs ? `${ROUTES.login}?${qs}` : ROUTES.login
  }

  const alreadyRegisteredNotice = (prefill: { mobile?: string; email?: string }) =>
    alreadyRegistered && (
      <div className="mt-3 border border-brand-primary/40 bg-brand-primary/10 px-3 py-2 text-xs text-brand-secondary" role="status">
        An account already exists for this {prefill.email ? "email" : "number"}.{" "}
        <button onClick={() => router.push(loginHref(prefill))} className="font-bold text-brand-primary-dark underline">
          Log in instead →
        </button>
      </div>
    )

  // Auto-continue to the destination shortly after a successful signup --
  // back to whatever gated page sent the visitor here, or the dashboard by default.
  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => router.push(destination), 1400)
    return () => clearTimeout(t)
  }, [submitted, router, destination])

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-black">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-primary-dark/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-primary-dark/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <button
            onClick={() => router.push(ROUTES.home)}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
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
                <Check className="mx-auto h-12 w-12 text-brand-primary-dark" />
                <h2 className="mt-4 font-serif text-2xl font-bold text-brand-secondary">Account created</h2>
                <p className="mt-2 text-sm text-brand-secondary/65">
                  Welcome to VXP. {returnTo ? "Taking you back to continue…" : "Taking you to your dashboard…"}
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(destination)}
                  className="btn-gold mt-6 w-full overflow-hidden py-3.5 text-sm font-bold"
                >
                  <span className="relative z-10">{returnTo ? "Continue →" : "Go to dashboard →"}</span>
                </motion.button>
              </motion.div>
            )}

            {!submitted && step === "method" && (
              <motion.div
                key="method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-card p-8 shadow-2xl shadow-brand-primary-dark/10"
              >
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-primary-dark" />
                  <h2 className="font-serif text-3xl font-bold text-brand-secondary">Create your VXP account</h2>
                </div>
                <p className="mt-2 text-sm text-brand-secondary/60">
                  Sign up to unlock property details, save listings &amp; submit enquiries.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void handleSendMobileOtp()
                  }}
                  noValidate
                >
                  <div className="mt-6">
                    <label htmlFor="signup-mobile" className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">
                      Mobile number
                    </label>
                    <div className="mt-1.5 flex items-center gap-2 border border-brand-border-light bg-card px-4 py-3 focus-within:border-brand-primary-dark">
                      <span className="text-sm font-semibold text-brand-secondary/70">+91</span>
                      <span className="h-5 w-px bg-brand-border-light" />
                      <input
                        id="signup-mobile"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                          setAlreadyRegistered(false)
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

                  {alreadyRegisteredNotice({ mobile: phone })}
                  {formError && (
                    <p className="mt-3 text-xs font-semibold text-red-500" role="alert">{formError}</p>
                  )}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!phoneValid || isSigningUp}
                    className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isSigningUp ? "Sending…" : "Send OTP"} <ArrowRight className="h-4 w-4" />
                    </span>
                  </motion.button>
                </form>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-brand-border-light" />
                  <span className="text-[10px] uppercase tracking-wider text-brand-secondary/40">or sign up with</span>
                  <div className="h-px flex-1 bg-brand-border-light" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setFormError(null)
                      setAlreadyRegistered(false)
                      setStep("email")
                    }}
                    className="flex items-center justify-center gap-2 border border-brand-border-light bg-card py-3 text-xs font-bold text-brand-secondary hover:bg-brand-surface"
                  >
                    <Mail className="h-3.5 w-3.5 text-brand-primary-dark" /> Email
                  </button>
                  <GoogleSignInButton
                    mode="signup"
                    // Google verifies the email itself — no OTP step
                    // (PARTNER-AUTH-INTEGRATION.md §2) — so a successful
                    // signup goes straight to the profile step, same place
                    // OTP verification lands.
                    onSuccess={() => setStep("profile")}
                    onError={(error) => {
                      // mode:"signup" 409s as ALREADY_REGISTERED when the
                      // Google email is already a VXP account. The "Already
                      // have an account? Sign in" link is right below.
                      const message =
                        getApiErrorCode(error) === "ALREADY_REGISTERED"
                          ? "That Google account already has a VXP account — please sign in below."
                          : error instanceof Error && !getApiErrorCode(error)
                            ? error.message
                            : describeAuthError(error, "Google sign-up failed. Please try again.").message
                      setFormError(message)
                      setStepState("method")
                    }}
                  >
                    {({ trigger, disabled }) => (
                      <button
                        onClick={() => {
                          setFormError(null)
                          setAlreadyRegistered(false)
                          setStep("google-loading")
                          trigger()
                        }}
                        disabled={disabled}
                        title={disabled ? "Google sign-in is not configured yet" : undefined}
                        className="flex items-center justify-center gap-2 border border-brand-border-light bg-card py-3 text-xs font-bold text-brand-secondary hover:bg-brand-surface disabled:opacity-50"
                      >
                        <GoogleIcon size={14} /> Google
                      </button>
                    )}
                  </GoogleSignInButton>
                </div>

                <p className="mt-6 text-center text-[11px] leading-relaxed text-brand-secondary/50">
                  By continuing you agree to VXP&apos;s Terms &amp; Privacy Policy.
                  <br />
                  No commissions. No settlement. Visibility &amp; leads only.
                </p>

                <button
                  onClick={() => router.push(loginHref())}
                  className="mt-4 w-full text-center text-xs font-semibold text-brand-primary-dark hover:text-brand-secondary"
                >
                  Already have an account? Sign in →
                </button>
              </motion.div>
            )}

            {!submitted && step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-card p-8 shadow-2xl shadow-brand-primary-dark/10"
              >
                <button
                  onClick={() => {
                    setFormError(null)
                    setAlreadyRegistered(false)
                    setStep("method")
                  }}
                  className="mb-4 flex items-center gap-2 text-xs font-semibold text-brand-secondary/55 hover:text-brand-secondary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> All sign-up options
                </button>
                <div className="mb-1 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-brand-primary-dark" />
                  <h2 className="font-serif text-3xl font-bold text-brand-secondary">Sign up with email</h2>
                </div>
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
                    <label htmlFor="signup-email" className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">
                      Email address
                    </label>
                    <div className="mt-1.5 flex items-center gap-2 border border-brand-border-light bg-card px-4 py-3 focus-within:border-brand-primary-dark">
                      <Mail className="h-4 w-4 text-brand-primary-dark" />
                      <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setAlreadyRegistered(false)
                        }}
                        placeholder="you@email.com"
                        className="w-full bg-transparent text-sm font-medium text-brand-secondary outline-none placeholder:text-brand-secondary/40"
                      />
                    </div>
                  </div>
                  {alreadyRegisteredNotice({ email: trimmedEmail })}
                  {formError && (
                    <p className="mt-3 text-xs font-semibold text-red-500" role="alert">{formError}</p>
                  )}
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!emailValid || isSigningUp}
                    className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isSigningUp ? "Sending…" : "Send OTP"} <ArrowRight className="h-4 w-4" />
                    </span>
                  </motion.button>
                </form>
              </motion.div>
            )}

            {!submitted && step === "google-loading" && (
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
                  <h3 className="font-serif text-2xl font-bold text-brand-secondary">Connecting to Google</h3>
                  <p className="mt-2 text-sm text-brand-secondary/60">Finish signing up in the Google window…</p>
                </div>
              </motion.div>
            )}

            {!submitted && step === "otp" && (
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
                    setStep(channel === "mobile" ? "method" : "email")
                  }}
                  className="mb-4 flex items-center gap-2 text-xs font-semibold text-brand-secondary/55 hover:text-brand-secondary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> {channel === "mobile" ? "Change number" : "Change email"}
                </button>
                <div className="mb-1 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-brand-primary-dark" />
                  <h2 className="font-serif text-3xl font-bold text-brand-secondary">Verify OTP</h2>
                </div>
                <p className="mt-2 text-sm text-brand-secondary/60">
                  Enter the 6-digit code sent to <b>{channel === "mobile" ? `+91 ${phone}` : trimmedEmail}</b>
                </p>
                <OtpCodeInput
                  value={otp}
                  onChange={(next) => {
                    setOtp(next)
                    if (formError && !codeLocked) setFormError(null)
                  }}
                  onComplete={(code) => void handleVerifyOtp(code)}
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
                      disabled={isSigningUp}
                      className="font-bold text-brand-primary-dark hover:underline disabled:opacity-50"
                    >
                      {isSigningUp ? "Sending…" : "Resend code"}
                    </button>
                  )}
                </div>
                {formError && (
                  <p className="mt-3 text-center text-xs font-semibold text-red-500" role="alert">{formError}</p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => void handleVerifyOtp()}
                  disabled={!otp.every((d) => d) || isVerifyingOtp || codeLocked || expiresIn === 0}
                  className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isVerifyingOtp ? "Verifying…" : "Verify & Continue"} <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>
              </motion.div>
            )}

            {!submitted && step === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-card p-8 shadow-2xl shadow-brand-primary-dark/10"
              >
                <div className="mb-1 flex items-center gap-2">
                  <User className="h-5 w-5 text-brand-primary-dark" />
                  <h2 className="font-serif text-3xl font-bold text-brand-secondary">Complete your profile</h2>
                </div>
                <p className="mt-2 text-sm text-brand-secondary/60">
                  Tell us a bit about yourself — this helps us match the right properties.
                </p>

                {!navUser?.id ? (
                  <p className="mt-6 text-sm text-brand-secondary/65">
                    Your session has ended.{" "}
                    <button onClick={() => setStepState("method")} className="font-bold text-brand-primary-dark underline">
                      Start again
                    </button>
                  </p>
                ) : profileLoadFailed ? (
                  <p className="mt-6 text-sm font-semibold text-red-500">
                    Couldn&apos;t load your profile.{" "}
                    <button onClick={() => refetchProfile()} className="underline">Retry</button>
                  </p>
                ) : !savedProfile ? (
                  <div className="mt-6 space-y-4" aria-busy="true" aria-label="Loading profile">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-12 w-full animate-pulse bg-brand-tertiary/60" />
                    ))}
                  </div>
                ) : (
                  // Seeded from whatever's already saved, so a resumed step keeps earlier input.
                  <ProfileDetailsForm
                    profile={savedProfile}
                    user={navUser}
                    inputClass={SIGNUP_INPUT_CLASS}
                    labelClass={SIGNUP_LABEL_CLASS}
                    layout="stack"
                    submitLabel={
                      <>
                        <Check className="h-4 w-4" /> Create account &amp; continue
                      </>
                    }
                    missingBanner="after-edit"
                    onSaved={() => setSubmitted(true)}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
