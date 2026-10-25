import { StatusPill } from "@/components/dashboard/status-pill"
import type { ListingStatus } from "@/store/api/listingsApi"

const STATUS_META: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_review: { label: "In review", tone: "info" },
  live: { label: "Live", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  expired: { label: "Expired", tone: "warning" },
  removed: { label: "Removed", tone: "danger" },
}

/** One-liners shown on the read-only (non-draft) listing view. */
export const LISTING_STATUS_HINT: Record<string, string> = {
  pending_review: "Submitted — our team is reviewing it. It goes live for buyers once approved.",
  live: "Live — buyers can find and contact you about this listing.",
  rejected: "Not approved. See the reason below.",
  expired: "Expired — no longer visible to buyers.",
  removed: "Removed by the VXP team.",
}

export function ListingStatusPill({ status }: { status: ListingStatus }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "neutral" as const }
  return <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
}

export const LISTING_STATUS_FILTERS = ["all", "draft", "pending_review", "live", "rejected", "expired"] as const
export type ListingStatusFilter = (typeof LISTING_STATUS_FILTERS)[number]

export function listingStatusLabel(status: string) {
  return status === "all" ? "All" : STATUS_META[status]?.label ?? status
}
