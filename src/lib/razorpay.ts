"use client"

import type { CreatedOrder } from "@/store/api/billingApi"

/**
 * Razorpay Standard Checkout — the official browser integration is a script
 * (https://checkout.razorpay.com/v1/checkout.js), not an npm package. It's
 * loaded on demand the first time someone pays, never on page load.
 *
 * Demo mode: the dev API mocks Razorpay (`razorpayKeyId: "rzp_test_demo"`,
 * `razorpayOrderId: "order_mock_…"`) — there's no real order to open a
 * checkout for, so those orders skip the modal and use a stand-in result
 * (the backend's verify accepts any id/signature in demo mode).
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js"

export type RazorpayResult = { razorpayPaymentId: string; razorpaySignature: string }

/** The customer closed the Razorpay window without paying. Not charged. */
export class PaymentDismissedError extends Error {
  constructor() {
    super("Payment not completed — you have not been charged.")
    this.name = "PaymentDismissedError"
  }
}

type RazorpayHandlerResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }

type RazorpayOptions = {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description?: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: RazorpayHandlerResponse) => void
  modal?: { ondismiss?: () => void; confirm_close?: boolean }
}

type RazorpayInstance = { open: () => void }

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export function isDemoOrder(order: CreatedOrder): boolean {
  return order.razorpayKeyId === "rzp_test_demo" || order.razorpayOrderId.startsWith("order_mock_")
}

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Razorpay can only load in the browser."))
  if (window.Razorpay) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = SCRIPT_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        // Let the next attempt try again (e.g. after the network comes back).
        scriptPromise = null
        script.remove()
        reject(new Error("Couldn't load the payment window. Check your connection and try again."))
      }
      document.body.appendChild(script)
    })
  }
  return scriptPromise
}

/**
 * Collect the payment for a created order. Resolves with the ids to send to
 * `POST /billing/orders/{id}/verify`; rejects with PaymentDismissedError if
 * the customer closes the window. Razorpay handles card/UPI failures and
 * retries inside its own window, so a failure there only reaches us as a
 * dismissal.
 */
export async function collectPayment(
  order: CreatedOrder,
  details: { description?: string; prefill?: RazorpayOptions["prefill"] } = {},
): Promise<RazorpayResult> {
  if (isDemoOrder(order)) {
    return { razorpayPaymentId: `pay_demo_${order.razorpayOrderId}`, razorpaySignature: "demo_signature" }
  }
  await loadScript()
  const Razorpay = window.Razorpay
  if (!Razorpay) throw new Error("Couldn't load the payment window. Check your connection and try again.")
  return new Promise<RazorpayResult>((resolve, reject) => {
    const checkout = new Razorpay({
      key: order.razorpayKeyId,
      order_id: order.razorpayOrderId,
      amount: order.amountPaise,
      currency: "INR",
      name: "VXP",
      description: details.description,
      prefill: details.prefill,
      theme: { color: "#c4a23a" },
      handler: (response) =>
        resolve({ razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }),
      modal: { ondismiss: () => reject(new PaymentDismissedError()), confirm_close: true },
    })
    checkout.open()
  })
}
