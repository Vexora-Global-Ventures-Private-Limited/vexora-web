"use client"

import { Minus, Plus } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckoutStatus } from "@/components/billing/checkout-status"
import { useCheckout, usePendingOrder } from "@/hooks/use-checkout"
import { getApiErrorCode } from "@/lib/api-error"
import { useBuySlotsMutation } from "@/store/api/billingApi"

const MAX_QUANTITY = 10
export const SLOTS_PENDING_KEY = "slots"

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

/**
 * Buy add-on listing slots (POST /billing/slots, members only, BR-47/48).
 * The slot price is admin config the web can't read, so the order is created
 * first and its server-side amount shown for review before paying. Slots
 * expire with the current membership.
 */
export function SlotCheckoutDialog({ onClose }: { onClose: () => void }) {
  const [quantity, setQuantity] = useState(1)
  const checkout = useCheckout({ pendingKey: SLOTS_PENDING_KEY })
  const [buySlots] = useBuySlotsMutation()
  // A slot payment from an earlier visit that was still confirming.
  const earlierOrder = usePendingOrder(SLOTS_PENDING_KEY)

  const createOrder = () =>
    void checkout.start((idempotencyKey) => buySlots({ quantity, idempotencyKey }).unwrap(), {
      review: true,
      description: `${quantity} extra listing slot${quantity > 1 ? "s" : ""}`,
    })

  const changeQuantity = (next: number) => {
    setQuantity(Math.min(MAX_QUANTITY, Math.max(1, next)))
    // A different quantity is a different order — start a fresh attempt.
    if (checkout.phase === "review" || checkout.phase === "failed") checkout.reset()
  }

  const membershipRequired = getApiErrorCode(checkout.error) === "MEMBERSHIP_REQUIRED"
  const editable = checkout.phase === "idle" || checkout.phase === "review" || (checkout.phase === "failed" && !membershipRequired)

  return (
    <Dialog open onOpenChange={(open) => !open && !checkout.isBusy && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Extra listing slots</DialogTitle>
          <DialogDescription>Post more listings without upgrading. Extra slots last until your current membership ends.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between border-y border-brand-border-light py-4">
          <span className="text-sm font-bold text-brand-secondary">How many?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeQuantity(quantity - 1)}
              disabled={!editable || quantity <= 1}
              aria-label="One fewer"
              className="border border-brand-border-light p-1.5 disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center font-serif text-xl font-bold" aria-live="polite">
              {quantity}
            </span>
            <button
              onClick={() => changeQuantity(quantity + 1)}
              disabled={!editable || quantity >= MAX_QUANTITY}
              aria-label="One more"
              className="border border-brand-border-light p-1.5 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {membershipRequired ? (
          <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Extra slots are for paid members. Your membership isn&apos;t active right now — renew it first.
          </p>
        ) : (
          <CheckoutStatus
            phase={checkout.phase}
            error={checkout.error}
            successText={`${quantity} extra slot${quantity > 1 ? "s" : ""} added. You can post more listings now.`}
            onRecheck={() => checkout.recheck()}
            onRetry={() => (checkout.order ? void checkout.confirm() : createOrder())}
          />
        )}

        {checkout.phase === "idle" && earlierOrder && (
          <div className="border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-secondary">
            Your earlier slot payment is still being confirmed — don&apos;t pay again.
            <button onClick={() => void checkout.recheck(earlierOrder.orderId)} className="mt-2 block text-xs font-bold text-brand-primary-dark underline">
              Check again
            </button>
          </div>
        )}

        {checkout.phase === "idle" && !earlierOrder && (
          <button onClick={createOrder} className="btn-gold relative w-full overflow-hidden py-3 text-sm font-bold">
            <span className="relative z-10">See price</span>
          </button>
        )}

        {checkout.phase === "review" && checkout.order && (
          <>
            <div className="flex items-end justify-between">
              <span className="text-sm text-brand-secondary/70">Total</span>
              <span className="font-serif text-3xl font-bold text-brand-secondary">{rupees(checkout.order.amountPaise)}</span>
            </div>
            <button onClick={() => void checkout.confirm()} className="btn-gold relative w-full overflow-hidden py-3 text-sm font-bold">
              <span className="relative z-10">Pay {rupees(checkout.order.amountPaise)}</span>
            </button>
            <p className="text-center text-[11px] text-brand-secondary/50">Secure payment by Razorpay.</p>
          </>
        )}

        {(checkout.phase === "paid" || checkout.phase === "timeout" || membershipRequired) && (
          <button onClick={onClose} className="w-full bg-ink-black py-3 text-sm font-bold text-brand-primary">
            Done
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
