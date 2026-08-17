"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Lock, Phone, Mail, Check, ShieldCheck, Sparkles,
  User, MapPin,
} from "lucide-react"
import { useNav, mockUsers, type Tier } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"

type Step = "method" | "otp" | "profile"

export function SignupPage() {
  const { login } = useNav()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Only ever follow an internal, relative path here -- a raw external URL in
  // ?returnTo would turn this into an open redirect.
  const returnToParam = searchParams.get("returnTo")
  const returnTo = returnToParam && returnToParam.startsWith("/") ? returnToParam : null
  const destination = returnTo || ROUTES.dashboard
  const [step, setStep] = useState<Step>("method")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", ""])
  const [profile, setProfile] = useState({ name: "", email: "", city: "", role: "Buyer" })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (step === "otp") {
      // Auto-fill OTP after 1s for demo
      const t = setTimeout(() => setOtp(["4", "2", "0", "7"]), 1000)
      return () => clearTimeout(t)
    }
  }, [step])

  const completeSignup = () => {
    const tier: Tier =
      profile.role === "Owner/Seller" ? "M" :
      profile.role === "Broker" ? "J" :
      profile.role === "Developer" ? "V" : "F"
    login({
      ...mockUsers[tier],
      name: profile.name || "New Member",
      email: profile.email || "new@vxp.in",
      initials: (profile.name || "NM").split(" ").map((n) => n.charAt(0)).join("").slice(0, 2).toUpperCase(),
    })
    setSubmitted(true)
  }

  // Auto-continue to the destination shortly after a successful mock signup --
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
                  Your signup was submitted successfully. {returnTo ? "Taking you back to continue…" : "Taking you to your dashboard…"}
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

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => phone.length === 10 && setStep("otp")}
                  disabled={phone.length !== 10}
                  className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Send OTP <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-brand-border-light" />
                  <span className="text-[10px] uppercase tracking-wider text-brand-secondary/40">or sign up with</span>
                  <div className="h-px flex-1 bg-brand-border-light" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-2 border border-brand-border-light bg-card py-3 text-xs font-bold text-brand-secondary hover:bg-brand-surface">
                    <Mail className="h-3.5 w-3.5 text-brand-primary-dark" /> Email
                  </button>
                  <button className="flex items-center justify-center gap-2 border border-brand-border-light bg-card py-3 text-xs font-bold text-brand-secondary hover:bg-brand-surface">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-primary-dark" /> Google
                  </button>
                </div>

                <p className="mt-6 text-center text-[11px] leading-relaxed text-brand-secondary/50">
                  By continuing you agree to VXP&apos;s Terms &amp; Privacy Policy.
                  <br />
                  No commissions. No settlement. Visibility &amp; leads only.
                </p>

                <button
                  onClick={() => router.push(returnTo ? ROUTES.loginWithReturn(returnTo) : ROUTES.login)}
                  className="mt-4 w-full text-center text-xs font-semibold text-brand-primary-dark hover:text-brand-secondary"
                >
                  Already have an account? Sign in →
                </button>
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
                  onClick={() => setStep("method")}
                  className="mb-4 flex items-center gap-2 text-xs font-semibold text-brand-secondary/55 hover:text-brand-secondary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Change number
                </button>
                <div className="mb-1 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-brand-primary-dark" />
                  <h2 className="font-serif text-3xl font-bold text-brand-secondary">Verify OTP</h2>
                </div>
                <p className="mt-2 text-sm text-brand-secondary/60">
                  Enter the 4-digit code sent to <b>+91 {phone || "98765 43210"}</b>
                </p>
                <div className="mt-6 flex justify-center gap-3">
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
                        if (v && i < 3) document.getElementById(`signup-otp-${i + 1}`)?.focus()
                      }}
                      id={`signup-otp-${i}`}
                      className="h-14 w-14 border border-brand-border-light bg-card text-center font-serif text-2xl font-bold text-brand-secondary outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-primary-dark/20"
                    />
                  ))}
                </div>
                <div className="mt-4 text-center text-xs text-brand-secondary/55">
                  Didn&apos;t receive? <button className="font-bold text-brand-primary-dark hover:underline">Resend in 0:28</button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => otp.every((d) => d) && setStep("profile")}
                  disabled={!otp.every((d) => d)}
                  className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Verify &amp; Continue <ArrowRight className="h-4 w-4" />
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

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">Full name</label>
                    <div className="mt-1.5 flex items-center gap-2 border border-brand-border-light bg-card px-4 py-3 focus-within:border-brand-primary-dark">
                      <User className="h-4 w-4 text-brand-primary-dark" />
                      <input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Aarav Mehta"
                        className="w-full bg-transparent text-sm font-medium text-brand-secondary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">Email</label>
                    <div className="mt-1.5 flex items-center gap-2 border border-brand-border-light bg-card px-4 py-3 focus-within:border-brand-primary-dark">
                      <Mail className="h-4 w-4 text-brand-primary-dark" />
                      <input
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder="you@email.com"
                        className="w-full bg-transparent text-sm font-medium text-brand-secondary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">City</label>
                    <div className="mt-1.5 flex items-center gap-2 border border-brand-border-light bg-card px-4 py-3 focus-within:border-brand-primary-dark">
                      <MapPin className="h-4 w-4 text-brand-primary-dark" />
                      <input
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        placeholder="Mumbai"
                        className="w-full bg-transparent text-sm font-medium text-brand-secondary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">I am a...</label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {["Buyer", "Owner/Seller", "Broker", "Developer"].map((r) => (
                        <button
                          key={r}
                          onClick={() => setProfile({ ...profile, role: r })}
                          className={
                            "border py-3 text-xs font-bold transition-colors " +
                            (profile.role === r
                              ? "border-brand-primary-dark bg-brand-surface text-brand-secondary"
                              : "border-brand-border-light bg-card text-brand-secondary/65 hover:bg-brand-surface")
                          }
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={completeSignup}
                  className="btn-gold mt-6 flex w-full items-center justify-center gap-2 overflow-hidden py-3.5 text-sm font-bold"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Create account &amp; continue
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
