"use client"

import { useId, useState } from "react"
import { Check, AlertCircle, Gift } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckoutStatus } from "@/components/billing/checkout-status"
import type { LiveTier } from "@/components/billing/live-tiers"
import { useCheckout, MEMBERSHIP_PENDING_KEY } from "@/hooks/use-checkout"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { useCreateOrderMutation, type OrderPurpose } from "@/store/api/billingApi"
import { useValidateReferralCodeMutation } from "@/store/api/referralsApi"

export type ValidatedReferral = { code: string; referrerName?: string; rewardDays?: number }

const PURPOSE_COPY: Partial<Record<OrderPurpose, string>> = {
  membership_new: "New membership",
  membership_upgrade: "Upgrade — charged at the full plan price, no proration",
  membership_renewal: "Renewal — extends your current plan",
}

/** Codes are case-insensitive server-side; strip spaces people paste in. */
export const normalizeReferralCode = (raw: string) => raw.replace(/\s+/g, "").toUpperCase().slice(0, 32)

/**
 * Checkout for one membership plan. Razorpay is in demo mode (no real
 * payment modal), so "Pay" goes straight through create → verify → poll in
 * useCheckout. The referral code is only offered on membership_new — the
 * backend 409s it on any other purpose — and is validated before checkout.
 */
export function MembershipCheckoutDialog({
  tier,
  purpose,
  initialReferralCode,
  initialReferral,
  onClose,
}: {
  tier: LiveTier
  purpose: OrderPurpose
  /** From ?ref= — prefilled but not yet validated. */
  initialReferralCode?: string
  /** Already validated on the page — applied straight away. */
  initialReferral?: ValidatedReferral | null
  onClose: () => void
}) {
  const checkout = useCheckout({ pendingKey: MEMBERSHIP_PENDING_KEY })
  const [createOrder] = useCreateOrderMutation()
  const [validateReferral, { isLoading: isValidating }] = useValidateReferralCodeMutation()
  const allowReferral = purpose === "membership_new"
  const [referralInput, setReferralInput] = useState(
    allowReferral ? initialReferral?.code ?? initialReferralCode ?? "" : "",
  )
  const [referral, setReferral] = useState<ValidatedReferral | null>(allowReferral ? initialReferral ?? null : null)
  const [referralError, setReferralError] = useState<string | null>(null)
  const referralInputId = useId()
  const isFree = tier.pricePaise === 0

  const applyReferral = async () => {
    const code = normalizeReferralCode(referralInput)
    if (!code) return
    setReferralInput(code)
    setReferralError(null)
    setReferral(null)
    try {
      const res = await validateReferral(code).unwrap()
      if (res.valid) setReferral({ code, referrerName: res.referrerName, rewardDays: res.rewardDays })
      else setReferralError("This code isn't valid.")
    } catch (error) {
      setReferralError(
        getApiErrorCode(error) === "REFERRAL_INVALID"
          ? "This code isn't valid — it may be inactive, your own, or you've already used a referral."
          : getApiErrorMessage(error) ?? "Couldn't check this code. Please try again.",
      )
    }
  }

  const pay = () => {
    if (!tier.planId) return
    void checkout.start((idempotencyKey) =>
      createOrder({
        purpose,
        planId: tier.planId,
        ...(allowReferral && referral ? { referralCode: referral.code } : {}),
        idempotencyKey,
      }).unwrap(),
    )
  }

  const locked = checkout.isBusy || checkout.phase === "paid" || checkout.phase === "timeout"
  const referralPendingApply = allowReferral && !!referralInput.trim() && !referral

  return (
    <Dialog open onOpenChange={(open) => !open && !checkout.isBusy && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{tier.name} membership</DialogTitle>
          <DialogDescription>{PURPOSE_COPY[purpose]}</DialogDescription>
        </DialogHeader>

        <div className="flex items-end justify-between border-y border-brand-border-light py-4">
          <div>
            <div className="font-serif text-3xl font-bold text-brand-secondary">{tier.price}</div>
            <div className="text-xs text-brand-secondary/55">for {tier.duration} · up to {tier.listings} listings</div>
          </div>
        </div>

        {allowReferral && (
          <div>
            <label htmlFor={referralInputId} className="flex items-center gap-2 text-sm font-bold text-brand-secondary">
              <Gift className="h-4 w-4 text-brand-primary-dark" /> Referral code (optional)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id={referralInputId}
                value={referralInput}
                onChange={(e) => {
                  setReferralInput(e.target.value.slice(0, 32))
                  setReferral(null)
                  setReferralError(null)
                }}
                onKeyDown={(e) => e.key === "Enter" && applyReferral()}
                disabled={locked}
                autoComplete="off"
                placeholder="Enter code"
                className="min-w-0 flex-1 border border-brand-border-light bg-brand-surface px-3 py-2 text-sm uppercase outline-none focus:border-brand-primary"
              />
              {referralInput.trim() && !locked && (
                <button
                  onClick={() => {
                    setReferralInput("")
                    setReferral(null)
                    setReferralError(null)
                  }}
                  className="px-2 text-xs font-semibold text-brand-secondary/60 hover:text-brand-secondary"
                >
                  Clear
                </button>
              )}
              <button
                onClick={applyReferral}
                disabled={!referralInput.trim() || isValidating || locked || !!referral}
                className="bg-ink-black px-4 py-2 text-xs font-bold text-brand-primary disabled:opacity-40"
              >
                {isValidating ? "Checking…" : referral ? "Applied" : "Apply"}
              </button>
            </div>
            {referral && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                <Check className="h-3.5 w-3.5" /> Code applied
                {referral.referrerName ? ` — referred by ${referral.referrerName}` : ""}
              </div>
            )}
            {referralError && (
              <div role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-red-600">
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" /> {referralError}
              </div>
            )}
          </div>
        )}

        <CheckoutStatus
          phase={checkout.phase}
          error={checkout.error}
          successText={`You're now on ${tier.name}. Your new tools are unlocked.`}
          onRecheck={() => checkout.recheck()}
          // Same attempt after an error (same idempotency key); a settled
          // "failed" order already dropped its key, so that's a fresh attempt.
          onRetry={pay}
        />

        {checkout.phase === "idle" && (
          <>
            <button
              onClick={pay}
              disabled={!tier.planId || referralPendingApply || isValidating}
              className="btn-gold relative w-full overflow-hidden py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative z-10">{isFree ? `Activate ${tier.name} — free` : `Pay ${tier.price}`}</span>
            </button>
            {referralPendingApply && (
              <p className="text-center text-[11px] text-brand-secondary/55">Apply the referral code (or clear it) to continue.</p>
            )}
            <p className="text-center text-[11px] text-brand-secondary/50">
              Test mode — no real money is charged. Your membership activates once the payment is confirmed.
            </p>
          </>
        )}
        {(checkout.phase === "paid" || checkout.phase === "timeout") && (
          <button onClick={onClose} className="w-full bg-ink-black py-3 text-sm font-bold text-brand-primary">
            Done
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
