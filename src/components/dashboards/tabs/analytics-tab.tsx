"use client"

import { Inbox, Send, Lock, Building2, Info } from "lucide-react"
import type { Tier } from "@/lib/nav-store"
import { useGetCrmSummaryQuery } from "@/store/api/leadsApi"
import { useGetListingQuotaQuery } from "@/store/api/listingsApi"
import { StatCard } from "@/components/dashboard/stat-card"
import { ChannelMix, PipelineCounts, totalLeads } from "@/components/crm/overview-widgets"

/**
 * Lead analytics from the CRM endpoints (GET /crm/summary + recent leads'
 * channel mix). The API has no listing-level views/impressions analytics
 * yet, so those aren't shown rather than faked.
 */
export function AnalyticsTab({ tier }: { tier: Tier }) {
  const { data: summary } = useGetCrmSummaryQuery()
  const { data: quota } = useGetListingQuotaQuery()
  const total = totalLeads(summary)
  const undelivered = summary?.undeliveredCount ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Analytics</h2>
        <p className="text-sm text-brand-muted-foreground">
          {tier === "M" ? "How buyers are responding to your listings" : "Lead volume, pipeline progress and contact channels"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Leads" value={total} icon={Inbox} />
        <StatCard label="Delivered" value={Math.max(0, total - undelivered)} icon={Send} />
        <StatCard label="Waiting to unlock" value={undelivered} icon={Lock} />
        <StatCard label="Listings Used" value={quota?.used ?? 0} icon={Building2} hint={quota ? `of ${quota.planQuota}` : undefined} />
      </div>

      <PipelineCounts tier={tier} />

      {tier !== "M" && <ChannelMix />}

      <div className="flex items-center gap-3 border border-brand-primary/30 bg-brand-tertiary p-4 text-xs text-brand-secondary/70">
        <Info className="h-4 w-4 shrink-0 text-brand-primary-dark" />
        <div>
          Listing views and impressions aren&apos;t tracked yet — these numbers come straight from your real enquiries.
          {tier === "M" && " Upgrade to Jupiter for the full Kanban pipeline and contact-channel breakdown."}
        </div>
      </div>
    </div>
  )
}
