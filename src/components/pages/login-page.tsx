"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, Lock, Phone, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2,
} from "lucide-react"
import { useNav, mockUsers, type User } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { useAuth, GoogleSignInButton } from "@/hooks/use-auth"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { GoogleIcon } from "@/components/icons/google-icon"

type AuthMethod = "select" | "google-loading" | "mobile" | "email" | "otp"

export function LoginPage() {
  const { login } = useNav()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Only ever follow an internal, relative path here -- a raw external URL in
  // ?returnTo would turn this into an open redirect.
  const returnToParam = searchParams.get("returnTo")
  const returnTo = returnToParam && returnToParam.startsWith("/") ? returnToParam : null
  const destination = returnTo || ROUTES.dashboard
  const [method, setMethod] = useState<AuthMethod>("select")
  const [phone, setPhone] = useState("")
  // Backend OTPs are 6 digits (api.json: "6-digit OTP code", e.g. "111111").
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [submitted, setSubmitted] = useState(false)
  const [otpId, setOtpId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const {
    requestOtp, resendOtp, verifyOtp,
    isRequestingOtp, isVerifyingOtp,
  } = useAuth()

  // Demo-only path (no email+password endpoint exists on the backend yet) and
  // the quick-switch demo accounts below both still write directly to the
  // mock session store.
  const finishMockLogin = (user: Parameters<typeof login>[0]) => {
    login(user)
    setSubmitted(true)
  }

  // Auto-continue to the destination shortly after a successful sign-in --
  // back to whatever gated page sent the visitor here, or the dashboard by default.
  useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => router.push(destination), 1400)
    return () => clearTimeout(t)
  }, [submitted, router, destination])

  // Ticks resendCooldown down to 0 once a second while the OTP screen is up.
  // One interval for the whole visit to this screen (not recreated every
  // tick) — the functional update form means it doesn't need resendCooldown
  // itself as a dependency, and naturally stays at 0 once it gets there.
  useEffect(() => {
    if (method !== "otp") return
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [method])

  const handleSendOtp = async () => {
    if (phone.length !== 10) return
    setFormError(null)
    try {
      const result = await requestOtp(`+91${phone}`, "mobile", "login")
      setOtpId(result.data.otpId)
      setOtp(["", "", "", "", "", ""])
      setMethod("otp")
      setResendCooldown(30)
    } catch (error) {
      setFormError(getApiErrorMessage(error) ?? "Couldn't send the OTP. Please check the number and try again.")
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setFormError(null)
    try {
      const result = await resendOtp(`+91${phone}`, "mobile", "login")
      setOtpId(result.data.otpId)
      setResendCooldown(30)
    } catch (error) {
      setFormError(getApiErrorMessage(error) ?? "Couldn't resend the OTP. Please try again.")
    }
  }

  const handleMobileOtpSubmit = async () => {
    if (!otpId || !otp.every((d) => d)) return
    setFormError(null)
    try {
      await verifyOtp(otpId, otp.join(""))
      setSubmitted(true)
    } catch (error) {
      setFormError(getApiErrorMessage(error) ?? "That code didn't match. Please try again.")
    }
  }

  const handleEmailSubmit = () => finishMockLogin(mockUsers.J)

  const demoAccounts: { label: string; user: User }[] = [
    { label: "Free", user: mockUsers.F },
    { label: "Mercury", user: mockUsers.M },
    { label: "Jupiter", user: mockUsers.J },
    { label: "Venus", user: mockUsers.V },
  ]

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
                  <h2 className="mt-4 font-serif text-2xl font-bold text-brand-secondary">Sign-in received</h2>
                  <p className="mt-2 text-sm text-brand-secondary/65">
                    Your credentials were submitted successfully. {returnTo ? "Taking you back to continue…" : "Taking you to your dashboard…"}
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
                      onSuccess={() => setSubmitted(true)}
                      onError={(error) => {
                        // PARTNER-AUTH-INTEGRATION.md §2 — mode:"login" 404s as
                        // NOT_REGISTERED when the Google email has no VXP
                        // account yet. The "New to VXP? Create an account"
                        // link is already right below this button, so the
                        // message alone is enough to point them at it.
                        const code = getApiErrorCode(error)
                        const message =
                          code === "NOT_REGISTERED"
                            ? "No account found for that Google account — please sign up below."
                            : getApiErrorMessage(error) ??
                              (error instanceof Error ? error.message : "Google sign-in failed. Please try again.")
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
                      onClick={() => setMethod("mobile")}
                      className="flex w-full items-center justify-center gap-3 border border-brand-border-light bg-card py-3.5 text-sm font-bold text-brand-secondary transition-colors hover:border-brand-primary-dark hover:bg-brand-surface"
                    >
                      <Phone className="h-4 w-4 text-brand-primary-dark" /> Mobile + OTP
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMethod("email")}
                      className="flex w-full items-center justify-center gap-3 border border-brand-border-light bg-card py-3.5 text-sm font-bold text-brand-secondary transition-colors hover:border-brand-primary-dark hover:bg-brand-surface"
                    >
                      <Mail className="h-4 w-4 text-brand-primary-dark" /> Email + Password
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

                  {/* Demo accounts — each a real, distinct tier reached via its own
                      button here at sign-in, not by switching tiers after logging in. */}
                  <div className="mt-6 border-t border-brand-border-light pt-5">
                    <p className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-brand-secondary/40">
                      Or preview a demo account
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {demoAccounts.map(({ label, user }) => (
                        <button
                          key={label}
                          onClick={() => finishMockLogin(user)}
                          className="border border-brand-border-light bg-card py-2 text-xs font-bold text-brand-secondary hover:border-brand-primary-dark hover:bg-brand-surface"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
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
                      Authenticating your account securely…
                    </motion.p>
                    <div className="mt-8 w-full space-y-2 text-left">
                      {[
                        { label: "Requesting Google sign-in", delay: 0 },
                        { label: "Verifying credentials", delay: 600 },
                        { label: "Loading your VXP profile", delay: 1200 },
                      ].map((s, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + s.delay / 1000 }}
                          className="flex items-center gap-2 text-xs text-brand-secondary/70"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-primary-dark" /> {s.label}
                        </motion.div>
                      ))}
                    </div>
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
                  <div className="mt-6">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">
                      Mobile number
                    </label>
                    <div className="mt-1.5 flex items-center gap-2 border border-brand-border-light bg-card px-4 py-3 focus-within:border-brand-primary-dark">
                      <span className="text-sm font-semibold text-brand-secondary/70">+91</span>
                      <span className="h-5 w-px bg-brand-border-light" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="98765 43210"
                        className="w-full bg-transparent text-sm font-medium text-brand-secondary outline-none placeholder:text-brand-secondary/40"
                      />
                    </div>
                  </div>
                  {formError && (
                    <p className="mt-3 text-xs font-semibold text-red-500">{formError}</p>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSendOtp}
                    disabled={phone.length !== 10 || isRequestingOtp}
                    className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isRequestingOtp ? "Sending…" : "Send OTP"} <ArrowRight className="h-4 w-4" />
                    </span>
                  </motion.button>
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
                    onClick={() => setMethod("mobile")}
                    className="mb-4 flex items-center gap-2 text-xs font-semibold text-brand-secondary/55 hover:text-brand-secondary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Change number
                  </button>
                  <h2 className="font-serif text-3xl font-bold text-brand-secondary">Verify OTP</h2>
                  <p className="mt-2 text-sm text-brand-secondary/60">
                    Enter the 6-digit code sent to <span className="font-bold text-brand-secondary">+91 {phone || "98765 43210"}</span>
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 1)
                          const next = [...otp]
                          next[i] = v
                          setOtp(next)
                          if (v && i < otp.length - 1) document.getElementById(`otp-${i + 1}`)?.focus()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus()
                        }}
                        id={`otp-${i}`}
                        className="h-12 w-12 border border-brand-border-light bg-card text-center font-serif text-xl font-bold text-brand-secondary outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-primary-dark/20"
                      />
                    ))}
                  </div>
                  <div className="mt-4 text-center text-xs text-brand-secondary/55">
                    Didn&apos;t receive?{" "}
                    {resendCooldown > 0 ? (
                      <span className="font-bold text-brand-secondary/40">
                        Resend in 0:{String(resendCooldown).padStart(2, "0")}
                      </span>
                    ) : (
                      <button onClick={handleResendOtp} className="font-bold text-brand-primary-dark hover:underline">Resend</button>
                    )}
                  </div>
                  {formError && (
                    <p className="mt-3 text-center text-xs font-semibold text-red-500">{formError}</p>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleMobileOtpSubmit}
                    disabled={!otp.every((d) => d) || isVerifyingOtp}
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
                  <h2 className="font-serif text-3xl font-bold text-brand-secondary">Email + Password</h2>
                  <p className="mt-2 text-sm text-brand-secondary/60">Welcome back — sign in with your email.</p>
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">Email</label>
                      <div className="mt-1.5 flex items-center gap-2 border border-brand-border-light bg-card px-4 py-3 focus-within:border-brand-primary-dark">
                        <Mail className="h-4 w-4 text-brand-primary-dark" />
                        <input type="email" defaultValue="aarav.mehta@gmail.com" className="w-full bg-transparent text-sm font-medium text-brand-secondary outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">Password</label>
                      <div className="mt-1.5 flex items-center gap-2 border border-brand-border-light bg-card px-4 py-3 focus-within:border-brand-primary-dark">
                        <Lock className="h-4 w-4 text-brand-primary-dark" />
                        <input type="password" defaultValue="demo-password" className="w-full bg-transparent text-sm font-medium text-brand-secondary outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-brand-secondary/60">
                      <input type="checkbox" className="h-3 w-3 accent-brand-primary-dark" /> Remember me
                    </label>
                    <button className="font-semibold text-brand-primary-dark hover:underline">Forgot?</button>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEmailSubmit}
                    className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Sign in <ArrowRight className="h-4 w-4" />
                    </span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
