"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, ArrowRight, Check, LayoutPanelTop, MapPin, Building2, Play, Crown,
  Wallet, ShieldCheck, Upload, FileText, Image as ImageIcon, Video, Share2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { adTypes, advertiserAudiences } from "@/lib/vxp-data"
import { ROUTES } from "@/lib/routes"
import { Reveal } from "@/components/motion/reveal"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  banner: LayoutPanelTop,
  "map-pin": MapPin,
  building: Building2,
  play: Play,
  crown: Crown,
}

const steps = [
  { id: 1, label: "Choose Ad Type", icon: LayoutPanelTop },
  { id: 2, label: "Select Package", icon: Wallet },
  { id: 3, label: "Upload Content", icon: Upload },
  { id: 4, label: "Payment & Review", icon: ShieldCheck },
]

const packages = [
  { name: "Starter", duration: "7 days", price: "₹ 4,999", impressions: "10K–25K", clicks: "300–700", features: ["1 ad placement", "Basic analytics", "Email support"] },
  { name: "Professional", duration: "30 days", price: "₹ 18,999", impressions: "60K–120K", clicks: "2K–4K", features: ["1 ad placement", "Advanced analytics", "Priority support", "A/B testing"], popular: true },
  { name: "Enterprise", duration: "90 days", price: "₹ 49,999", impressions: "200K+", clicks: "8K+", features: ["3 ad placements", "Full analytics + ROI", "Dedicated manager", "Custom creative help"] },
]

export function PromotePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedAd, setSelectedAd] = useState<string | null>(null)
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => router.push(ROUTES.home)} className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>
          <div className="font-serif text-lg font-bold text-brand-secondary">Promote on VXP</div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Stepper */}
        <div className="mb-12 flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step >= s.id ? "var(--color-ink-black)" : "var(--card)",
                    color: step >= s.id ? "var(--brand-primary)" : "var(--brand-primary-dark)",
                    scale: step === s.id ? 1.1 : 1,
                  }}
                  className="grid h-11 w-11 place-items-center border-2 text-sm font-bold"
                  style={{ borderColor: step >= s.id ? "var(--brand-primary)" : "var(--brand-border-light)" }}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </motion.div>
                <span className={"text-[11px] font-semibold " + (step >= s.id ? "text-brand-secondary" : "text-brand-secondary/45")}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="mx-3 h-px flex-1 bg-brand-border-light">
                  <motion.div
                    initial={false}
                    animate={{ width: step > s.id ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-primary-dark"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Choose Ad Type */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-serif text-3xl font-bold text-brand-secondary">Choose your ad type</h2>
              <p className="mt-2 text-sm text-brand-secondary/65">Select the placement that best fits your promotion goal.</p>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {adTypes.map((ad) => {
                  const Icon = iconMap[ad.icon] ?? LayoutPanelTop
                  const selected = selectedAd === ad.code
                  return (
                    <motion.button
                      key={ad.code}
                      onClick={() => setSelectedAd(ad.code)}
                      whileHover={{ y: -4 }}
                      className={
                        "flex items-start gap-4 border-2 bg-card p-5 text-left transition-colors " +
                        (selected ? "border-brand-primary bg-brand-surface" : "border-brand-border-light hover:border-brand-primary/40")
                      }
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center bg-gradient-to-br from-brand-primary to-brand-primary-dark text-ink-black">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-base font-bold text-brand-secondary">{ad.name}</span>
                          <span className="font-serif text-xs font-bold text-brand-primary-dark">#{ad.code}</span>
                        </div>
                        <p className="mt-1 text-xs italic text-brand-primary-dark/90">&ldquo;{ad.example}&rdquo;</p>
                        <div className="mt-2 space-y-1 text-[11px] text-brand-secondary/55">
                          <div><b className="text-brand-secondary/75">Placement:</b> {ad.placement}</div>
                          <div><b className="text-brand-secondary/75">Visible to:</b> {ad.audience}</div>
                        </div>
                      </div>
                      {selected && (
                        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-primary text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  disabled={!selectedAd}
                  onClick={() => setStep(2)}
                  className="btn-gold relative overflow-hidden px-6 py-3 text-sm font-bold disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Select Package */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-serif text-3xl font-bold text-brand-secondary">Select your package</h2>
              <p className="mt-2 text-sm text-brand-secondary/65">All packages include admin approval before going live.</p>

              <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
                {packages.map((pkg) => {
                  const selected = selectedPkg === pkg.name
                  return (
                    <motion.button
                      key={pkg.name}
                      onClick={() => setSelectedPkg(pkg.name)}
                      whileHover={{ y: -6 }}
                      className={
                        "relative flex flex-col border-2 p-6 text-left transition-colors " +
                        (selected
                          ? "border-brand-primary bg-ink-black text-white"
                          : "border-brand-border-light bg-card text-brand-secondary hover:border-brand-primary/40")
                      }
                    >
                      {pkg.popular && (
                        <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark px-2 py-0.5 text-[10px] font-bold uppercase text-ink-black">
                          Popular
                        </div>
                      )}
                      <div className={"font-serif text-xl font-bold " + (selected ? "text-white" : "text-brand-secondary")}>{pkg.name}</div>
                      <div className={"text-xs " + (selected ? "text-white/55" : "text-brand-secondary/55")}>{pkg.duration}</div>
                      <div className={"mt-4 font-serif text-3xl font-bold " + (selected ? "text-brand-primary" : "text-brand-primary-dark")}>{pkg.price}</div>

                      <div className={"mt-4 space-y-1.5 text-xs " + (selected ? "text-white/75" : "text-brand-secondary/70")}>
                        <div className="flex justify-between"><span>Est. impressions</span><b>{pkg.impressions}</b></div>
                        <div className="flex justify-between"><span>Est. clicks</span><b>{pkg.clicks}</b></div>
                      </div>

                      <ul className="mt-5 space-y-2 border-t pt-4 text-xs">
                        {pkg.features.map((f) => (
                          <li key={f} className={"flex items-center gap-1.5 " + (selected ? "text-white/85" : "text-brand-secondary/80")}>
                            <Check className={"h-3 w-3 " + (selected ? "text-brand-primary" : "text-brand-primary-dark")} /> {f}
                          </li>
                        ))}
                      </ul>
                    </motion.button>
                  )
                })}
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(1)} className="border border-brand-border-light bg-card px-5 py-3 text-sm font-bold text-brand-secondary hover:bg-brand-surface">
                  Back
                </button>
                <button
                  disabled={!selectedPkg}
                  onClick={() => setStep(3)}
                  className="btn-gold relative overflow-hidden px-6 py-3 text-sm font-bold disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Upload Content */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-serif text-3xl font-bold text-brand-secondary">Upload your ad content</h2>
              <p className="mt-2 text-sm text-brand-secondary/65">Upload creative assets. Our team will review within 24 hours.</p>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[
                  { icon: ImageIcon, label: "Banner image", desc: "JPG/PNG · 1920×600px · max 2MB" },
                  { icon: Video, label: "Promo video", desc: "MP4 · 30–60s · max 50MB" },
                  { icon: FileText, label: "Brochure PDF", desc: "PDF · max 10MB" },
                  { icon: Share2, label: "Virtual tour link", desc: "Matterport or YouTube URL" },
                ].map((u, i) => (
                  <motion.div
                    key={u.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="border-2 border-dashed border-brand-border-light bg-card p-6 text-center hover:border-brand-primary/60"
                  >
                    <div className="mx-auto grid h-12 w-12 place-items-center bg-brand-surface">
                      <u.icon className="h-5 w-5 text-brand-primary-dark" />
                    </div>
                    <div className="mt-3 text-sm font-bold text-brand-secondary">{u.label}</div>
                    <div className="mt-1 text-[11px] text-brand-secondary/55">{u.desc}</div>
                    <button className="mt-3 border border-brand-border-light bg-brand-surface px-4 py-1.5 text-xs font-bold text-brand-secondary hover:bg-gold-100">
                      Choose file
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 border border-brand-border-light bg-card p-6">
                <h3 className="font-serif text-base font-bold text-brand-secondary">Ad copy &amp; CTA</h3>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/55">Headline</label>
                    <input defaultValue="Lodha Elite Towers — Launching in Thane" className="mt-1 w-full border border-brand-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/55">Sub-headline</label>
                    <input defaultValue="3 & 4 BHK sky residences · Pre-launch pricing" className="mt-1 w-full border border-brand-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/55">CTA button text</label>
                    <input defaultValue="Enquire Now" className="mt-1 w-full border border-brand-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary" />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(2)} className="border border-brand-border-light bg-card px-5 py-3 text-sm font-bold text-brand-secondary hover:bg-brand-surface">Back</button>
                <button onClick={() => setStep(4)} className="btn-gold relative overflow-hidden px-6 py-3 text-sm font-bold">
                  <span className="relative z-10 flex items-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Payment & Review */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-serif text-3xl font-bold text-brand-secondary">Review &amp; pay</h2>
              <p className="mt-2 text-sm text-brand-secondary/65">Confirm your ad details and complete payment to submit for admin approval.</p>

              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
                {/* Summary */}
                <div className="border border-brand-border-light bg-card p-6">
                  <h3 className="font-serif text-lg font-bold text-brand-secondary">Order summary</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between border-b border-brand-border-light pb-3">
                      <span className="text-brand-secondary/65">Ad type</span>
                      <span className="font-bold text-brand-secondary">{adTypes.find((a) => a.code === selectedAd)?.name ?? "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border-light pb-3">
                      <span className="text-brand-secondary/65">Package</span>
                      <span className="font-bold text-brand-secondary">{selectedPkg ?? "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border-light pb-3">
                      <span className="text-brand-secondary/65">Duration</span>
                      <span className="font-bold text-brand-secondary">{packages.find((p) => p.name === selectedPkg)?.duration ?? "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border-light pb-3">
                      <span className="text-brand-secondary/65">Subtotal</span>
                      <span className="font-bold text-brand-secondary">{packages.find((p) => p.name === selectedPkg)?.price ?? "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-brand-border-light pb-3">
                      <span className="text-brand-secondary/65">GST (18%)</span>
                      <span className="font-bold text-brand-secondary">+18%</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="font-serif text-base font-bold text-brand-secondary">Total</span>
                      <span className="font-serif text-xl font-bold text-brand-primary-dark">
                        {packages.find((p) => p.name === selectedPkg)?.price ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment methods */}
                <div className="border border-brand-border-light bg-card p-6">
                  <h3 className="font-serif text-lg font-bold text-brand-secondary">Payment method</h3>
                  <div className="mt-4 space-y-2">
                    {["UPI / QR Code", "Credit / Debit Card", "Net Banking", "Wallet"].map((m, i) => (
                      <label key={m} className="flex items-center gap-3 border border-brand-border-light bg-card px-3 py-2.5 text-sm cursor-pointer hover:bg-brand-surface">
                        <input type="radio" name="payment" defaultChecked={i === 0} className="accent-brand-primary" />
                        <span className="font-medium text-brand-secondary">{m}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-5 bg-brand-surface p-3 text-[11px] text-brand-secondary/65">
                    <ShieldCheck className="mr-1 inline h-3 w-3 text-brand-primary-dark" />
                    Secured by Razorpay. Your ad goes live only after admin approval (typically 24h).
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(3)} className="border border-brand-border-light bg-card px-5 py-3 text-sm font-bold text-brand-secondary hover:bg-brand-surface">Back</button>
                <button onClick={() => router.push(ROUTES.dashboard)} className="btn-gold relative overflow-hidden px-8 py-3 text-sm font-bold">
                  <span className="relative z-10 flex items-center gap-2">
                    Pay &amp; Submit for Approval <Check className="h-4 w-4" />
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
