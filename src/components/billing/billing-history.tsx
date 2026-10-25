"use client"

import { Download, FileText } from "lucide-react"
import { formatPaise } from "@/lib/api-mappers"
import { useGetReceiptsQuery, receiptHref } from "@/store/api/billingApi"

const PURPOSE_LABEL: Record<string, string> = {
  membership_new: "New membership",
  membership_renewal: "Membership renewal",
  membership_upgrade: "Membership upgrade",
  listing_renewal: "Listing renewal",
  listing_slot_addon: "Extra listing slot",
  ad_banner: "Banner ad",
  ad_sponsored: "Sponsored listing",
  ad_featured: "Featured developer",
  ad_project_promotion: "Project promotion",
}

function formatDay(iso: string | undefined) {
  const d = iso ? new Date(iso) : null
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : ""
}

/** GET /billing/receipts — mountable anywhere (membership page, dashboard billing tab). */
export function BillingHistory() {
  const { data: receipts, isLoading, isError, refetch } = useGetReceiptsQuery()

  return (
    <div className="border border-brand-border-light bg-card">
      <div className="border-b border-brand-border-light bg-brand-surface px-6 py-4">
        <h2 className="font-serif text-xl font-bold text-brand-secondary">Billing history</h2>
      </div>
      {isLoading && (
        <div className="space-y-3 px-6 py-5" aria-busy="true" aria-label="Loading receipts">
          {[0, 1].map((i) => (
            <div key={i} className="h-10 animate-pulse bg-brand-tertiary/60" />
          ))}
        </div>
      )}
      {isError && (
        <p className="px-6 py-5 text-sm text-red-600">
          Couldn&apos;t load receipts.{" "}
          <button onClick={() => refetch()} className="font-bold underline">Retry</button>
        </p>
      )}
      {receipts && receipts.length === 0 && (
        <p className="px-6 py-5 text-sm text-brand-secondary/55">No payments yet — receipts appear here once a payment is confirmed.</p>
      )}
      {receipts && receipts.length > 0 && (
        <ul className="divide-y divide-brand-border-light">
          {receipts.map((r) => {
            const href = receiptHref(r.pdfUrl)
            return (
              <li key={r._id} className="flex items-center justify-between gap-4 px-6 py-3 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-brand-primary-dark" />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-brand-secondary">
                      {(r.purpose ? PURPOSE_LABEL[r.purpose] : undefined) ?? r.receiptNumber ?? "Payment"}
                    </div>
                    <div className="text-xs text-brand-secondary/55">
                      {[formatDay(r.createdAt), r.receiptNumber].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  {typeof r.amountPaise === "number" && (
                    <span className="font-semibold text-brand-secondary">{formatPaise(r.amountPaise)}</span>
                  )}
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Download receipt${r.receiptNumber ? ` ${r.receiptNumber}` : ""} (PDF)`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
