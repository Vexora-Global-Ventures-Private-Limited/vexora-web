"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft, Check, Crown, Briefcase, Building2, Sparkles, ArrowUpRight, ShieldCheck, Gift, AlertCircle,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useNav, TIER_RANK, type Tier } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { Reveal } from "@/components/motion/reveal"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { useLiveTiers, type LiveTier } from "@/components/billing/live-tiers"
import {
  MembershipCheckoutDialog,
  normalizeReferralCode,
  type ValidatedReferral,
} from "@/components/billing/membership-checkout-dialog"
import { CheckoutStatus } from "@/components/billing/checkout-status"
import { useCheckout, usePendingOrder, MEMBERSHIP_PENDING_KEY, type TrackedPendingOrder } from "@/hooks/use-checkout"
import { formatPaise } from "@/lib/api-mappers"
import { BillingHistory } from "@/components/billing/billing-history"
import { useGetMyMembershipQuery, type ApiTier } from "@/store/api/membershipsApi"
import { useValidateReferralCodeMutation } from "@/store/api/referralsApi"
import type { OrderPurpose } from "@/store/api/billingApi"

const tierIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  M: Crown,
  J: Briefcase,
  V: Building2,
}

const API_TIER_CODE: Record<ApiTier, Tier> = { mercury: "M", jupiter: "J", venus: "V" }

/**
 * Which order purpose a plan card maps to, from the real membership record:
 * no membership (or a lapsed/superseded one) → membership_new; an active
 * one → renewal for the same tier, upgrade for a higher one. Downgrades
 * aren't supported (no proration, no endpoint) — `null`.
 */
function purposeFor(current: { tier: ApiTier | null; status?: string } | undefined, target: Tier): OrderPurpose | null {
  if (!current?.tier || (current.status && current.status !== "active" && current.status !== "pending")) {
    return "membership_new"
  }
  const currentCode = API_TIER_CODE[current.tier]
  if (currentCode === target) return "membership_renewal"
  return TIER_RANK[target] > TIER_RANK[currentCode] ? "membership_upgrade" : null
}

export function MembershipPage() {
  const { user } = useNav()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRealAccount = !!user?.id
  const { tiers, isLoading: plansLoading, isError: plansError, refetch: refetchPlans } = useLiveTiers()
  const {
    data: membership,
    isLoading: membershipLoading,
    isError: membershipError,
    refetch: refetchMembership,
  } = useGetMyMembershipQuery(undefined, { skip: !isRealAccount })
  const [checkoutTier, setCheckoutTier] = useState<LiveTier | null>(null)
  // A shared link (?ref=CODE) pre-fills the referral field; the redeem box
  // validates it once and hands the result to checkout, so it isn't re-asked.
  const refParam = normalizeReferralCode(searchParams.get("ref") ?? "")
  const [validatedReferral, setValidatedReferral] = useState<ValidatedReferral | null>(null)
  const checkoutPurpose = checkoutTier ? purposeFor(membership, checkoutTier.code) : null
  // The right purpose (new / renewal / upgrade) depends on the real membership
  // record — never let a member buy before it has loaded, or a renewal could
  // go through as a second "new" membership.
  const membershipKnown = !isRealAccount || (!membershipLoading && !membershipError)
  // Set while the backend is still activating a membership (a paid order's
  // webhook hasn't landed) — buying again would double-charge.
  const activationPending = membership?.status === "pending"
  const pendingOrder = usePendingOrder(isRealAccount ? MEMBERSHIP_PENDING_KEY : undefined)

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

        {isRealAccount && (pendingOrder || activationPending) && (
          <PendingMembershipNotice pending={pendingOrder} />
        )}
        {membershipError && (
          <p role="alert" className="mx-auto mt-8 max-w-lg text-center text-sm text-red-600">
            Couldn&apos;t load your current membership, so plans can&apos;t be bought right now.{" "}
            <button onClick={() => refetchMembership()} className="font-bold underline">Retry</button>
          </p>
        )}

        {/* Referral codes only apply to a first membership purchase. */}
        {membershipKnown && (!isRealAccount || purposeFor(membership, "M") === "membership_new") && (
          <Reveal direction="up" delay={0.1}>
            <ReferralRedeem code={refParam} onApplied={setValidatedReferral} />
          </Reveal>
        )}

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {tiers.map((tier) => {
            const purpose = isRealAccount ? purposeFor(membership, tier.code) : "membership_new"
            return (
              <TierCard
                key={tier.code}
                tier={tier}
                // Nothing buyable until both the live plan and (for members)
                // the current membership are known, or while one is activating.
                blocked={
                  // A lower tier is never buyable — say why (downgrade), not "pending".
                  purpose === null && !tier.unavailable
                    ? null
                    : tier.unavailable
                    ? plansLoading
                      ? "Loading price…"
                      : "Not available right now"
                    : isRealAccount && !membershipKnown
                      ? "Loading…"
                      : purpose === "membership_renewal" && tier.pricePaise === 0
                        ? "Free plan — no renewal needed"
                      : isRealAccount && pendingOrder?.unpaid
                        ? pendingOrder.order?.amountPaise === 0
                          ? "Free plan awaiting activation"
                          : "Unfinished payment — see above"
                        : isRealAccount && (activationPending || !!pendingOrder)
                          ? "Payment confirming…"
                        : null
                }
                current={purpose === "membership_renewal"}
                // Downgrade is never supported per the docs — no proration, no downgrade endpoint.
                downgrade={purpose === null}
                expiresAt={purpose === "membership_renewal" ? membership?.expiresAt : undefined}
                onChoose={() => {
                  if (!user) {
                    // No account yet — membership requires signing up first.
                    router.push(ROUTES.signupWithReturn(ROUTES.membership))
                    return
                  }
                  if (!isRealAccount) return
                  setCheckoutTier(tier)
                }}
              />
            )
          })}
        </motion.div>
        {plansError && (
          <p className="mt-6 text-center text-sm text-red-600">
            Couldn&apos;t load current prices.{" "}
            <button onClick={() => refetchPlans()} className="font-bold underline">Retry</button>
          </p>
        )}

        {checkoutTier && checkoutPurpose && (
          <MembershipCheckoutDialog
            tier={checkoutTier}
            purpose={checkoutPurpose}
            initialReferral={validatedReferral}
            initialReferralCode={refParam || undefined}
            onClose={() => setCheckoutTier(null)}
          />
        )}

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
                    ["Listings included", ...tiers.map((t) => (t.unavailable ? "—" : String(t.listings)))],
                    ["Price", ...tiers.map((t) => (t.unavailable ? "—" : `${t.price} / ${t.duration}`))],
                    // Straight from each plan's real feature flags — not marketing copy.
                    ["Verified badge (via KYC)", ...tiers.map((t) => flagCell(t, "badges"))],
                    ["CRM pipeline", ...tiers.map((t) => (t.unavailable ? "—" : t.planFeatures?.crmBoard ? "Kanban board" : "Status list"))],
                    ["Co-broking", ...tiers.map((t) => (t.planFeatures?.coBroker ? "Coming soon" : "—"))],
                    ["Developer projects & inventory", "—", "—", "Yes"],
                    ["Referral code to share", "Yes", "Yes", "Yes"],
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

        {isRealAccount && (
          <Reveal direction="up">
            <div className="mt-10">
              <BillingHistory />
            </div>
          </Reveal>
        )}

        {/* Out-of-scope */}
        <Reveal direction="up">
          <div className="mt-10 flex items-start gap-3 border border-brand-primary/20 bg-brand-primary/5 p-5 text-xs text-brand-secondary/70">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary-dark" />
            <div>
              <span className="font-bold text-brand-primary-dark">Reminder:</span> VXP does not participate in commission collection, property sale settlement, brokerage accounting, escrow, post-sale payment tracking, RERA compliance automation, or ownership transfer. Membership fees are the only revenue.
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

function flagCell(tier: LiveTier, flag: "badges" | "crmBoard" | "coBroker") {
  if (tier.unavailable) return "—"
  return tier.planFeatures?.[flag] ? "Yes" : "—"
}

/**
 * A membership payment from an earlier visit is still "processing" (the
 * backend activates on the Razorpay webhook, or an admin activates it by
 * hand). Lets the member re-check it instead of paying again.
 */
function PendingMembershipNotice({ pending }: { pending: TrackedPendingOrder | null }) {
  const checkout = useCheckout({ pendingKey: MEMBERSHIP_PENDING_KEY })
  const router = useRouter()
  const orderId = pending?.orderId
  const order = pending?.order
  const startedAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : null

  if (checkout.phase === "idle" && pending?.unpaid && order && order.amountPaise === 0) {
    // A ₹0 order can't be paid (Razorpay rejects it) — only an admin can
    // switch it on, so there's nothing for the member to do but wait.
    return (
      <div role="status" className="mx-auto mt-8 max-w-lg border border-brand-primary/30 bg-brand-primary/10 px-5 py-4 text-sm text-brand-secondary">
        <div className="font-semibold">Your free membership request is waiting for activation.</div>
        <p className="mt-1 text-xs text-brand-secondary/70">
          Free plans are switched on by our team{startedAt ? ` (requested ${startedAt})` : ""}. Plan changes are locked until then.
        </p>
        <p className="mt-1 font-mono text-[11px] text-brand-secondary/55">Order {order._id}</p>
        <button onClick={() => orderId && checkout.recheck(orderId)} className="mt-2 text-xs font-bold text-brand-primary-dark underline">
          Check status
        </button>
      </div>
    )
  }

  if (checkout.phase === "idle" && pending?.unpaid && order) {
    // Checkout was started but never paid. The backend blocks every new
    // membership order until this one is paid or cancelled.
    return (
      <div role="status" className="mx-auto mt-8 max-w-lg border border-brand-primary/30 bg-brand-primary/10 px-5 py-4 text-sm text-brand-secondary">
        <div className="font-semibold">You have an unfinished membership payment.</div>
        <p className="mt-1 text-xs text-brand-secondary/70">
          A {order.purpose.replace("membership_", "")} payment of {formatPaise(order.amountPaise)}
          {startedAt ? ` started on ${startedAt}` : ""} wasn&apos;t completed, so nothing was charged. Complete it to continue — new
          plans and renewals stay locked until it&apos;s paid or cancelled by our support team.
        </p>
        <p className="mt-1 font-mono text-[11px] text-brand-secondary/55">Order {order._id}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {order.idempotencyKey && (
            <button
              onClick={() => void checkout.resume(order, { description: "Membership" })}
              className="btn-gold relative overflow-hidden px-4 py-2 text-xs font-bold"
            >
              <span className="relative z-10">Complete payment · {formatPaise(order.amountPaise)}</span>
            </button>
          )}
          <button onClick={() => orderId && checkout.recheck(orderId)} className="text-xs font-bold text-brand-primary-dark underline">
            Check status
          </button>
        </div>
      </div>
    )
  }

  if (checkout.phase === "idle") {
    return (
      <div role="status" className="mx-auto mt-8 max-w-lg border border-brand-primary/30 bg-brand-primary/10 px-5 py-4 text-sm text-brand-secondary">
        <div className="font-semibold">
          {pending?.overdue ? "Your membership payment is taking longer than usual." : "A membership payment is still being confirmed."}
        </div>
        <p className="mt-1 text-xs text-brand-secondary/70">
          {pending?.overdue
            ? "If money left your account, it will activate automatically — contact support with the order ID below if it doesn't."
            : "Please don't pay again — it activates as soon as the payment is confirmed."}
        </p>
        {pending?.overdue && orderId && <p className="mt-1 font-mono text-[11px] text-brand-secondary/60">Order {orderId}</p>}
        {orderId && (
          <button onClick={() => checkout.recheck(orderId)} className="mt-2 text-xs font-bold text-brand-primary-dark underline">
            Check status
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto mt-8 max-w-lg space-y-2">
      <CheckoutStatus
        phase={checkout.phase}
        error={checkout.error}
        successText="Your membership is active."
        onRecheck={() => orderId && checkout.recheck(orderId)}
        onRetry={() => {
          // Closed Razorpay again → back to the unfinished-payment notice;
          // a failed order → cleared so the member can pick a plan again.
          if (checkout.phase === "failed" && !checkout.error) checkout.forgetPending()
          checkout.reset()
          router.refresh()
        }}
      />
    </div>
  )
}

/**
 * Pre-checks a referral code via POST /referrals/validate, then hands it to
 * the checkout dialog. The code is only actually redeemed at checkout, when
 * the order is created with it. Validation needs a signed-in account.
 */
function ReferralRedeem({ code, onApplied }: { code: string; onApplied: (referral: ValidatedReferral | null) => void }) {
  const { user } = useNav()
  const router = useRouter()
  const [input, setInput] = useState(code)
  const [validate, { isLoading }] = useValidateReferralCodeMutation()
  const [result, setResult] = useState<
    { type: "valid"; referrerName?: string; rewardDays?: number } | { type: "invalid"; message: string } | null
  >(null)

  const apply = async () => {
    const normalized = normalizeReferralCode(input)
    if (!normalized) return
    setInput(normalized)
    if (!user?.id) {
      router.push(ROUTES.signupWithReturn(`${ROUTES.membership}?ref=${encodeURIComponent(normalized)}`))
      return
    }
    setResult(null)
    try {
      const res = await validate(normalized).unwrap()
      if (res.valid) {
        setResult({ type: "valid", referrerName: res.referrerName, rewardDays: res.rewardDays })
        onApplied({ code: normalized, referrerName: res.referrerName, rewardDays: res.rewardDays })
      } else {
        setResult({ type: "invalid", message: "This code isn't valid." })
        onApplied(null)
      }
    } catch (error) {
      onApplied(null)
      setResult({
        type: "invalid",
        message:
          getApiErrorCode(error) === "REFERRAL_INVALID"
            ? "This code isn't valid — it may be inactive, your own, or you've already used a referral."
            : getApiErrorMessage(error) ?? "Couldn't check this code. Please try again.",
      })
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-lg border border-brand-border-light bg-card p-5">
      <div className="flex items-center gap-2">
        <Gift className="h-4 w-4 text-brand-primary-dark" />
        <span className="text-sm font-bold text-brand-secondary">Have a referral code?</span>
      </div>
      <p className="mt-1 text-xs text-brand-secondary/60">
        Applied to your first membership at checkout — the referrer earns extension days once your payment captures. Extension days only, no cashback.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value.slice(0, 32))
            setResult(null)
            onApplied(null)
          }}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          aria-label="Referral code"
          autoComplete="off"
          placeholder="Enter code"
          className="flex-1 border border-brand-border-light bg-brand-surface px-3 py-2 text-sm uppercase outline-none focus:border-brand-primary"
        />
        <button
          onClick={apply}
          disabled={!input.trim() || isLoading}
          className="bg-ink-black px-4 py-2 text-xs font-bold text-brand-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Checking…" : "Apply"}
        </button>
      </div>
      {result?.type === "valid" && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
          <Check className="h-3.5 w-3.5" /> Code applied
          {result.referrerName ? ` — referred by ${result.referrerName}` : ""}. Now pick a plan.
        </div>
      )}
      {result?.type === "invalid" && (
        <div role="alert" className="mt-3 flex items-start gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" /> {result.message}
        </div>
      )}
    </div>
  )
}

function TierCard({
  tier, blocked, current, downgrade, expiresAt, onChoose,
}: {
  tier: LiveTier
  /** Why the plan can't be bought right now (loading / unavailable / payment confirming), or null. */
  blocked: string | null
  current: boolean
  downgrade: boolean
  expiresAt?: string
  onChoose: () => void
}) {
  const Icon = tierIcons[tier.code] ?? Crown
  const popular = tier.popular

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
        {!tier.unavailable && (
          <span className={"mb-1.5 text-sm " + (popular ? "text-white/60" : "text-brand-secondary/55")}>/ {tier.duration}</span>
        )}
      </div>

      <div className={"mt-5 border px-4 py-3 text-xs " + (popular ? "border-white/15 bg-white/5 text-white/70" : "border-brand-border-light bg-brand-surface text-brand-secondary/70")}>
        <div className={"text-[10px] font-semibold uppercase tracking-[0.16em] " + (popular ? "text-brand-primary" : "text-brand-primary-dark")}>Target audience</div>
        <div className="mt-1 font-medium">{tier.audience}</div>
      </div>

      <div className={"mt-5 flex items-baseline gap-2 border-y py-3 " + (popular ? "border-white/15" : "border-brand-border-light")}>
        <span className={"font-serif text-3xl font-bold " + (popular ? "text-brand-primary" : "text-brand-primary-dark")}>
          {tier.unavailable ? "—" : tier.listings}
        </span>
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
        whileHover={downgrade || blocked ? undefined : { scale: 1.02 }}
        whileTap={downgrade || blocked ? undefined : { scale: 0.98 }}
        onClick={downgrade || blocked ? undefined : onChoose}
        disabled={downgrade || !!blocked}
        title={downgrade ? "Downgrade isn't available — memberships only move up in tier." : blocked ?? undefined}
        className={
          "mt-8 inline-flex items-center justify-center gap-2 py-3.5 text-sm font-bold " +
          (downgrade || blocked
            ? "cursor-not-allowed border border-brand-border-light bg-brand-surface text-brand-secondary/40"
            : current
            ? "border border-brand-primary/40 bg-brand-primary/10 text-brand-primary"
            : popular
            ? "btn-gold relative overflow-hidden"
            : "bg-ink-black text-brand-primary hover:bg-ink-deep")
        }
      >
        <span className="relative z-10 flex items-center gap-2">
          {blocked ?? (downgrade ? "Downgrade not available" : current ? "Current plan — Renew" : <>Choose {tier.name} <ArrowUpRight className="h-4 w-4" /></>)}
        </span>
      </motion.button>
      {current && expiresAt && (
        <p className={"mt-2 text-center text-[11px] leading-relaxed " + (popular ? "text-white/60" : "text-brand-secondary/55")}>
          Active until {new Date(expiresAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
          <br />
          {tier.pricePaise === 0
            ? "Free plans can't be extended by renewing. Upgrade to a paid plan to keep membership benefits beyond this date."
            : blocked
              ? "You can renew once your pending payment is completed or confirmed."
              : `Renewing adds ${tier.duration} on top of this date — you don't lose any remaining days.`}
        </p>
      )}
    </motion.div>
  )
}
