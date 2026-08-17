import { getListingExpiry, type Listing } from "@/lib/dashboard-data"
import { StatusPill } from "@/components/dashboard/status-pill"

export function ExpiryBadge({ listing, className }: { listing: Listing; className?: string }) {
  const { tone, label } = getListingExpiry(listing)
  return (
    <StatusPill tone={tone} className={className}>
      {label}
    </StatusPill>
  )
}
