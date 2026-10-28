"use client"

import { Check, Loader2, AlertCircle, Clock } from "lucide-react"
import type { CheckoutPhase } from "@/hooks/use-checkout"
import { getApiErrorMessage } from "@/lib/api-error"
import { PaymentDismissedError } from "@/lib/razorpay"

/**
 * Renders the shared useCheckout() phases. "timeout" is not a failure —
 * activation waits on the Razorpay webhook (or an admin's manual
 * activation), so the order can sit in "processing" for a while.
 *
 * "failed" covers two different things: the order itself came back
 * "failed" (no `error` — the payment didn't go through), or a request
 * errored before that (`error` set — e.g. network). Retrying the second
 * reuses the same idempotency key, so it can't create a duplicate order.
 */
export function CheckoutStatus({
  phase,
  error,
  successText,
  onRecheck,
  onRetry,
}: {
  phase: CheckoutPhase
  error: unknown
  successText: string
  onRecheck: () => void
  onRetry: () => void
}) {
  // "review" is rendered by the caller (it owns the price + confirm button).
  if (phase === "idle" || phase === "review") return null

  if (phase === "creating" || phase === "paying" || phase === "confirming") {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-2 border border-brand-border-light bg-brand-surface px-4 py-3 text-sm text-brand-secondary">
        <Loader2 className="h-4 w-4 animate-spin text-brand-primary-dark" />
        {phase === "creating"
          ? "Starting checkout…"
          : phase === "paying"
            ? "Complete the payment in the Razorpay window…"
            : "Confirming your payment… please keep this page open."}
      </div>
    )
  }

  if (phase === "paid") {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-2 border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
        <Check className="h-4 w-4 shrink-0" /> {successText}
      </div>
    )
  }

  if (phase === "timeout") {
    return (
      <div role="status" aria-live="polite" className="border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-secondary">
        <div className="flex items-center gap-2 font-semibold">
          <Clock className="h-4 w-4 text-brand-primary-dark" /> Still confirming your payment
        </div>
        <p className="mt-1 text-xs text-brand-secondary/70">
          This can take a few minutes. Don&apos;t pay again — you won&apos;t be charged twice, and we&apos;ll remember this
          payment if you leave and come back.
        </p>
        <button onClick={() => onRecheck()} className="mt-2 text-xs font-bold text-brand-primary-dark underline">
          Check again
        </button>
      </div>
    )
  }

  if (error instanceof PaymentDismissedError) {
    return (
      <div role="alert" className="border border-brand-border-light bg-brand-surface px-4 py-3 text-sm text-brand-secondary">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0 text-brand-primary-dark" /> Payment didn&apos;t complete — you have not been charged.
        </div>
        <button onClick={() => onRetry()} className="mt-2 text-xs font-bold underline">
          Retry payment
        </button>
      </div>
    )
  }

  const apiMessage = getApiErrorMessage(error) ?? (error instanceof Error ? error.message : null)
  return (
    <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error
          ? apiMessage ?? "We couldn't reach the payment server. Check your connection and try again."
          : "The payment didn't go through. You can try again with a new payment."}
      </div>
      <button onClick={() => onRetry()} className="mt-2 text-xs font-bold underline">
        Try again
      </button>
    </div>
  )
}
