"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft, Check, Crown, Briefcase, Building2, Sparkles, ArrowUpRight, ShieldCheck, Gift, AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { membershipTiers, type MembershipTier } from "@/lib/vxp-data"
import { useNav, TIER_RANK, mockUsers } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { Reveal } from "@/components/motion/reveal"
import { REFERRAL_REWARD_DAYS } from "@/lib/dashboard-data"
import { getReferralCode } from "@/lib/referral"

const tierIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  M: Crown,
  J: Briefcase,
  V: Building2,
}

export function MembershipPage() {
  const { user, setUserTier } = useNav()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => router.push(ROUTES.home)} className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </button>
          {user && (
            <button onClick={() => router.push(ROUTES.dashboard)} className="bg-ink-black px-4 py-2 text-xs font-bold text-brand-primary">
              Go to Dashboard
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <Reveal direction="up">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-brand-primary/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-primary-dark">
              <Sparkles className="h-3 w-3" /> VXP Membership
            </div>
            <h1 className="font-serif text-4xl font-bold leading-tight text-brand-secondary sm:text-5xl lg:text-6xl">
              Choose your <span className="text-gold-gradient italic">tier</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-brand-secondary/65">
              From referral rewards to broker CRM to enterprise inventory management — pick the membership that fits your role in India&apos;s real estate ecosystem.
            </p>
          </div>
        </Reveal>

        <Reveal direction="up" delay={0.1}>
          <ReferralRedeem />
        </Reveal>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {membershipTiers.map((tier) => (
            <TierCard
              key={tier.code}
              tier={tier}
              userTier={user?.tier}
              // Downgrade is never supported per the docs — no proration, no downgrade endpoint.
              downgrade={!!user && TIER_RANK[user.tier] > TIER_RANK[tier.code]}
              onChoose={() => {
                if (!user) {
                  // No account yet — membership requires signing up first.
                  router.push(ROUTES.signup)
                  return
                }
                // Real upgrade, in the correct place — full price, no proration.
                setUserTier(tier.code)
                router.push(ROUTES.dashboard)
              }}
            />
          ))}
        </motion.div>

        {/* Comparison table */}
        <Reveal direction="up" delay={0.2}>
          <div className="mt-16 overflow-hidden border border-brand-border-light bg-card">
            <div className="border-b border-brand-border-light bg-brand-surface px-6 py-4">
              <h2 className="font-serif text-xl font-bold text-brand-secondary">Tier comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border-light">
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-brand-secondary/55">Feature</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide text-brand-primary-dark">Mercury</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide text-brand-primary-dark">Jupiter</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wide text-brand-primary-dark">Venus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-light">
                  {[
                    ["Listings included", "2", "30", "100"],
                    ["Verified Badge", "—", "Manual", "Manual + Priority"],
                    ["CRM", "—", "Yes", "Yes + Inventory"],
                    ["Lead Pipeline", "Basic", "Full", "Full + Campaigns"],
                    ["Analytics", "—", "Views/Calls/Enquiries", "ROI + Campaigns"],
                    ["Co-broking", "—", "Yes", "Yes"],
                    ["Account Manager", "—", "—", "Dedicated"],
                    ["Referral reward", "30 days/signup", "30 days/signup", "30 days/signup"],
                  ].map((row) => (
                    <tr key={row[0]} className="hover:bg-brand-surface/40">
                      <td className="px-6 py-3 font-medium text-brand-secondary">{row[0]}</td>
                      <td className="px-6 py-3 text-center text-brand-secondary/65">{row[1]}</td>
                      <td className="px-6 py-3 text-center text-brand-secondary/65">{row[2]}</td>
                      <td className="px-6 py-3 text-center text-brand-secondary/65">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* Out-of-scope */}
        <Reveal direction="up">
          <div className="mt-10 flex items-start gap-3 border border-brand-primary/20 bg-brand-primary/5 p-5 text-xs text-brand-secondary/70">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary-dark" />
            <div>
              <span className="font-bold text-brand-primary-dark">Reminder:</span> VXP does not participate in commission collection, property sale settlement, brokerage accounting, escrow, post-sale payment tracking, KYC, RERA compliance automation, or ownership transfer. Membership fees are the only revenue.
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

type RedeemResult =
  | { type: "valid"; referrerName: string }
  | { type: "self" }
  | { type: "invalid" }
  | { type: "used" }

function ReferralRedeem() {
  const { user } = useNav()
  const [input, setInput] = useState("")
  const [result, setResult] = useState<RedeemResult | null>(null)

  // Mock referrer directory — every paid mock account has a code, keyed the
  // same way F11's "your code" widget derives one (getReferralCode).
  const referrerDirectory = useMemo(() => {
    const paidAccounts = Object.values(mockUsers).filter((u) => u.tier !== "F")
    return new Map(paidAccounts.map((u) => [getReferralCode(u), u.name]))
  }, [])

  const ownCode = user ? getReferralCode(user) : null

  const apply = () => {
    const code = input.trim().toUpperCase()
    if (!code) return
    // Once a code has been successfully applied this session, a user was
    // already referred once — REFERRAL_INVALID (BR-34).
    if (result?.type === "valid") {
      setResult({ type: "used" })
      return
    }
    if (ownCode && code === ownCode) {
      setResult({ type: "self" })
      return
    }
    const referrerName = referrerDirectory.get(code)
    if (!referrerName) {
      setResult({ type: "invalid" })
      return
    }
    setResult({ type: "valid", referrerName })
  }

  return (
    <div className="mx-auto mt-8 max-w-lg border border-brand-border-light bg-card p-5">
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-brand-primary-dark" />
        <span className="text-sm font-bold text-brand-secondary">Have a referral code?</span>
      </div>
      <p className="mt-1 text-xs text-brand-secondary/60">
        Applied at checkout — the referrer gets {REFERRAL_REWARD_DAYS} extension days once your payment captures. Extension days only, no cashback.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setResult(null)
          }}
          placeholder="e.g. AARAV-M2026"
          className="flex-1 border border-brand-border-light bg-brand-surface px-3 py-2 text-sm uppercase outline-none focus:border-brand-primary"
        />
        <button
          onClick={apply}
          disabled={!input.trim()}
          className="bg-ink-black px-4 py-2 text-xs font-bold text-brand-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply
        </button>
      </div>
      {result?.type === "valid" && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
          <Check className="h-3.5 w-3.5" /> +{REFERRAL_REWARD_DAYS} days for {result.referrerName}
        </div>
      )}
      {result?.type === "self" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle className="h-3.5 w-3.5" /> You can&apos;t use your own code.
        </div>
      )}
      {result?.type === "invalid" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle className="h-3.5 w-3.5" /> This code isn&apos;t valid.
        </div>
      )}
      {result?.type === "used" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle className="h-3.5 w-3.5" /> You&apos;ve already used a referral code.
        </div>
      )}
    </div>
  )
}

function TierCard({
  tier, userTier, downgrade, onChoose,
}: {
  tier: MembershipTier
  userTier?: MembershipTier["code"] | "F"
  downgrade: boolean
  onChoose: () => void
}) {
  const Icon = tierIcons[tier.code] ?? Crown
  const popular = tier.popular
  const current = userTier === tier.code

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
      }}
      whileHover={{ y: -10 }}
      className={
        "group relative flex flex-col overflow-hidden p-8 " +
        (popular
          ? "bg-ink-black text-white shadow-2xl shadow-brand-primary/25 ring-2 ring-brand-primary lg:-mt-4 lg:mb-4"
          : "bg-card text-brand-secondary ring-1 ring-brand-border-light hover:shadow-xl hover:shadow-brand-primary/15")
      }
    >
      {popular && (
        <div className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-black">
          <Sparkles className="h-3 w-3" /> Most Popular
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className={"grid h-12 w-12 place-items-center bg-gradient-to-br " + tier.accent + " shadow-lg"}>
          <Icon className="h-5 w-5 text-brand-secondary" />
        </div>
        <div>
          <div className={"font-serif text-2xl font-bold " + (popular ? "text-white" : "text-brand-secondary")}>{tier.name}</div>
          <div className={"text-[10px] font-semibold uppercase tracking-[0.2em] " + (popular ? "text-brand-primary" : "text-brand-primary-dark")}>Tier {tier.code}</div>
        </div>
      </div>

      <p className={"mt-4 text-sm " + (popular ? "text-white/70" : "text-brand-secondary/65")}>{tier.tagline}</p>

      <div className="mt-6 flex items-end gap-2">
        <span className={"font-serif text-5xl font-bold " + (popular ? "text-white" : "text-brand-secondary")}>{tier.price}</span>
        <span className={"mb-1.5 text-sm " + (popular ? "text-white/60" : "text-brand-secondary/55")}>/ {tier.duration}</span>
      </div>

      <div className={"mt-5 border px-4 py-3 text-xs " + (popular ? "border-white/15 bg-white/5 text-white/70" : "border-brand-border-light bg-brand-surface text-brand-secondary/70")}>
        <div className={"text-[10px] font-semibold uppercase tracking-[0.16em] " + (popular ? "text-brand-primary" : "text-brand-primary-dark")}>Target audience</div>
        <div className="mt-1 font-medium">{tier.audience}</div>
      </div>

      <div className={"mt-5 flex items-baseline gap-2 border-y py-3 " + (popular ? "border-white/15" : "border-brand-border-light")}>
        <span className={"font-serif text-3xl font-bold " + (popular ? "text-brand-primary" : "text-brand-primary-dark")}>{tier.listings}</span>
        <span className={"text-sm " + (popular ? "text-white/70" : "text-brand-secondary/70")}>listings included</span>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className={"mt-0.5 h-4 w-4 shrink-0 " + (popular ? "text-brand-primary" : "text-brand-primary-dark")} />
            <span className={popular ? "text-white/85" : "text-brand-secondary/80"}>{f}</span>
          </li>
        ))}
      </ul>

      <motion.button
        whileHover={current || downgrade ? undefined : { scale: 1.02 }}
        whileTap={current || downgrade ? undefined : { scale: 0.98 }}
        onClick={downgrade ? undefined : onChoose}
        disabled={downgrade}
        title={downgrade ? "Downgrade isn't available — memberships only move up in tier." : undefined}
        className={
          "mt-8 inline-flex items-center justify-center gap-2 py-3.5 text-sm font-bold " +
          (downgrade
            ? "cursor-not-allowed border border-brand-border-light bg-brand-surface text-brand-secondary/40"
            : current
            ? "border border-brand-primary/40 bg-brand-primary/10 text-brand-primary"
            : popular
            ? "btn-gold relative overflow-hidden"
            : "bg-ink-black text-brand-primary hover:bg-ink-deep")
        }
      >
        <span className="relative z-10 flex items-center gap-2">
          {downgrade ? "Downgrade not available" : current ? "Current Plan" : <>Choose {tier.name} <ArrowUpRight className="h-4 w-4" /></>}
        </span>
      </motion.button>
    </motion.div>
  )
}
