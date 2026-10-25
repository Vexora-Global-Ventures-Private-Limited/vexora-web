"use client"

import { motion } from "framer-motion"
import { Briefcase, Building2, Handshake, Inbox, Lock, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { useGetListingQuotaQuery } from "@/store/api/listingsApi"
import { useGetCrmSummaryQuery } from "@/store/api/leadsApi"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import {
  ChannelMix,
  MembershipExpiry,
  greetingName,
  MyListingsMini,
  PipelineCounts,
  RecentLeads,
  totalLeads,
} from "@/components/crm/overview-widgets"

export function JupiterDashboard() {
  const router = useRouter()
  const user = useNav((s) => s.user)
  const { data: quota } = useGetListingQuotaQuery()
  const { data: summary } = useGetCrmSummaryQuery()
  const total = totalLeads(summary)
  const undelivered = summary?.undeliveredCount ?? 0

  const stats = [
    { label: "Total Leads", value: total, icon: Inbox },
    { label: "Delivered Leads", value: Math.max(0, total - undelivered), icon: Send },
    { label: "Waiting (renew to unlock)", value: undelivered, icon: Lock },
    { label: "Listings Used", value: quota?.used ?? 0, suffix: quota ? `/${quota.planQuota}` : "", icon: Building2 },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-ink-black to-brand-secondary p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">Jupiter Partner · Broker CRM</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">Welcome back, {greetingName(user)}</h2>
            <p className="mt-1 text-sm text-white/65">
              <b className="text-brand-primary">{total} lead{total === 1 ? "" : "s"}</b> in your pipeline
              {undelivered > 0 && <> · <b className="text-brand-primary">{undelivered} waiting</b> to be unlocked</>}.
            </p>
            <MembershipExpiry className="mt-2 text-white/60" />
          </div>
          <button
            onClick={() => router.push(ROUTES.membership)}
            className="hidden bg-brand-primary px-4 py-2.5 text-xs font-bold text-ink-black sm:block"
          >
            Upgrade to Venus
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card p-5 ring-1 ring-brand-border"
          >
            <div className="grid h-10 w-10 place-items-center bg-brand-tertiary">
              <a.icon className="h-5 w-5 text-brand-primary-dark" />
            </div>
            <div className="mt-3 font-serif text-3xl font-bold text-brand-secondary">
              <AnimatedCounter to={a.value} suffix={a.suffix} separator="," duration={1.5} />
            </div>
            <div className="text-xs uppercase tracking-wide text-brand-secondary/55">{a.label}</div>
          </motion.div>
        ))}
      </div>

      <PipelineCounts tier="J" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <RecentLeads tier="J" limit={6} />
        <ChannelMix />
      </div>

      <MyListingsMini
        limit={6}
        quotaHint={quota ? `${quota.used} of ${quota.planQuota} used · ${quota.remaining} remaining` : undefined}
      />

      {/* Co-broking — BR-53, deferred to Phase 2 on the backend */}
      <div className="bg-gradient-to-br from-brand-primary/10 to-transparent p-6 ring-1 ring-brand-primary/30">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center bg-ink-black">
            <Handshake className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-base font-bold text-brand-secondary">Co-broking Network</h3>
            <p className="text-xs text-brand-secondary/65">Share listings with other Jupiter partners and split leads.</p>
          </div>
          <span className="border border-ink-black/15 px-4 py-2 text-xs font-bold text-brand-secondary/60">Coming soon</span>
        </div>
      </div>
    </div>
  )
}
