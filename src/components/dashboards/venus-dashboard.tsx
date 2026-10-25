"use client"

import { motion } from "framer-motion"
import { Building2, Megaphone, Crown, ChevronRight, Plus, Inbox, Lock, BadgeCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { formatPaise } from "@/lib/api-mappers"
import { useGetMyBuilderProfileQuery } from "@/store/api/listingsApi"
import { useGetCrmSummaryQuery } from "@/store/api/leadsApi"
import { useGetMyAdsQuery, type Ad } from "@/store/api/adsApi"
import { StatusPill } from "@/components/dashboard/status-pill"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import {
  ChannelMix,
  MembershipExpiry,
  greetingName,
  PipelineCounts,
  RecentLeads,
  totalLeads,
} from "@/components/crm/overview-widgets"

const AD_PRODUCT_LABEL: Record<string, string> = {
  banner: "Home Banner",
  sponsored: "Sponsored Listing",
  featured: "Featured Developer",
  project_promotion: "Project Promotion",
}

const AD_STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_payment: { label: "Pending payment", tone: "warning" },
  pending_review: { label: "Under review", tone: "warning" },
  active: { label: "Live", tone: "success" },
  paused: { label: "Paused", tone: "info" },
  rejected: { label: "Rejected", tone: "danger" },
  expired: { label: "Ended", tone: "neutral" },
}

export function VenusDashboard() {
  const router = useRouter()
  const user = useNav((s) => s.user)
  const { data: summary } = useGetCrmSummaryQuery()
  const { data: ads = [], isLoading: adsLoading } = useGetMyAdsQuery()
  const { data: builder, isLoading: builderLoading } = useGetMyBuilderProfileQuery()
  const activeAds = ads.filter((a) => a.status === "active").length
  const total = totalLeads(summary)
  const undelivered = summary?.undeliveredCount ?? 0

  const kpis = [
    { label: "Active Campaigns", value: activeAds, icon: Megaphone },
    { label: "Total Leads", value: total, icon: Inbox },
    { label: "Waiting (renew to unlock)", value: undelivered, icon: Lock },
    { label: "Projects", value: builder?.projectCount ?? builder?.projects?.length ?? 0, icon: Building2 },
  ]

  return (
    <div className="space-y-6">
      {/* Executive welcome */}
      <div className="bg-gradient-to-br from-ink-black via-brand-secondary to-gold-900 p-6 text-white ring-1 ring-brand-primary/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-brand-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">Venus Partner · Executive Dashboard</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">Welcome back, {greetingName(user)}</h2>
            <p className="mt-1 text-sm text-white/65">
              {activeAds} active campaign{activeAds === 1 ? "" : "s"} · {total} lead{total === 1 ? "" : "s"} in your pipeline
            </p>
            <MembershipExpiry className="mt-2 text-white/60" />
          </div>
          <button
            onClick={() => router.push(ROUTES.promote)}
            className="hidden bg-brand-primary px-4 py-2.5 text-xs font-bold text-ink-black sm:block"
          >
            + New Campaign
          </button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card p-5 ring-1 ring-brand-border"
          >
            <div className="grid h-10 w-10 place-items-center bg-gradient-to-br from-ink-black to-brand-secondary">
              <kpi.icon className="h-5 w-5 text-brand-primary" />
            </div>
            <div className="mt-3 font-serif text-3xl font-bold text-brand-secondary">
              <AnimatedCounter to={kpi.value} separator="," duration={1.6} />
            </div>
            <div className="text-xs uppercase tracking-wide text-brand-secondary/55">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Builder profile + projects — GET /builders/me (null until created).
          Full project management (Projects → Towers → Units) lives in the
          dedicated tab. */}
      <div className="bg-card p-6 ring-1 ring-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-secondary">Builder Profile &amp; Projects</h3>
            <p className="text-xs text-brand-secondary/55">Your public developer page and project inventory · Venus-only</p>
          </div>
          <button
            onClick={() => router.push(ROUTES.newProject)}
            className="flex items-center gap-1.5 bg-ink-black px-3 py-2 text-[11px] font-bold text-brand-primary hover:bg-brand-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> New project
          </button>
        </div>
        {builderLoading ? (
          <p className="mt-5 text-sm text-brand-secondary/55">Loading…</p>
        ) : builder ? (
          <div className="mt-5 flex items-center gap-4 border border-brand-border bg-brand-tertiary/40 p-4">
            {builder.logoUrl ? (
              <img src={builder.logoUrl} alt={builder.displayName} className="h-12 w-12 shrink-0 object-cover" />
            ) : (
              <div className="grid h-12 w-12 shrink-0 place-items-center bg-ink-black text-sm font-bold text-brand-primary">
                {builder.displayName.trim().charAt(0).toUpperCase() || "V"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate text-sm font-bold text-brand-secondary">
                {builder.displayName}
                {builder.badge === "verified_developer" && <BadgeCheck className="h-4 w-4 text-brand-primary-dark" />}
              </div>
              <div className="truncate text-xs text-brand-secondary/55">
                {[builder.city, `${builder.projectCount ?? builder.projects?.length ?? 0} projects`].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-brand-secondary/55">
            You haven&apos;t set up your builder profile yet — create it from the projects tab so buyers can find your
            developments.
          </p>
        )}
        <button
          onClick={() => router.push(ROUTES.dashboardTab("projects"))}
          className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
        >
          Manage all projects <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <PipelineCounts tier="V" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <RecentLeads tier="V" limit={6} />
        <ChannelMix />
      </div>

      {/* Campaigns — GET /ads/mine. Per-ad impressions/clicks live on the
          advertiser dashboard (GET /ads/:id/metrics, one call per ad). */}
      <div className="bg-card p-6 ring-1 ring-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-secondary">Campaigns</h3>
            <p className="text-xs text-brand-secondary/55">Your ad campaigns and their review status</p>
          </div>
          <button onClick={() => router.push(ROUTES.advertiser)} className="text-xs font-bold text-brand-primary-dark hover:text-brand-secondary">
            View performance →
          </button>
        </div>
        {adsLoading ? (
          <p className="mt-4 text-xs text-brand-secondary/50">Loading campaigns…</p>
        ) : ads.length === 0 ? (
          <div className="mt-4 border border-dashed border-brand-border p-6 text-center text-xs text-brand-secondary/50">
            No campaigns yet.{" "}
            <button onClick={() => router.push(ROUTES.promote)} className="font-bold text-brand-primary-dark hover:underline">
              Start one →
            </button>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto border border-brand-border">
            <table className="w-full text-sm">
              <thead className="bg-brand-tertiary">
                <tr className="text-[10px] font-bold uppercase tracking-wide text-brand-secondary/55">
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Target</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-left">Runs</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {ads.slice(0, 6).map((ad) => (
                  <CampaignRow key={ad._id} ad={ad} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dedicated account manager */}
      <div className="flex items-center gap-4 bg-gradient-to-br from-brand-primary/15 to-transparent p-5 ring-1 ring-brand-primary/30">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-ink-black to-brand-secondary text-brand-primary">
          <Crown className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-brand-secondary">Dedicated account manager</div>
          <div className="text-xs text-brand-secondary/65">Venus partners get a named contact for campaigns, projects and billing.</div>
        </div>
      </div>
    </div>
  )
}

function CampaignRow({ ad }: { ad: Ad }) {
  const status = AD_STATUS[ad.status] ?? { label: ad.status, tone: "neutral" as const }
  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null)
  const runs = ad.startsAt || ad.endsAt ? `${fmt(ad.startsAt) ?? "—"} – ${fmt(ad.endsAt) ?? "—"}` : "—"
  return (
    <tr className="text-xs hover:bg-brand-tertiary/40">
      <td className="px-4 py-2.5 font-semibold text-brand-secondary">{AD_PRODUCT_LABEL[ad.product] ?? ad.product}</td>
      <td className="px-4 py-2.5 text-brand-secondary/65">{ad.targetCity ?? (ad.listingId ? "Listing" : ad.projectId ? "Project" : "—")}</td>
      <td className="px-4 py-2.5 text-right font-bold text-brand-secondary">
        {ad.amountPaise ? formatPaise(ad.amountPaise) : "—"}
      </td>
      <td className="px-4 py-2.5 text-brand-secondary/65">{runs}</td>
      <td className="px-4 py-2.5">
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </td>
    </tr>
  )
}
