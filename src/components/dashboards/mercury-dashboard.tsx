"use client"

import { motion } from "framer-motion"
import { Crown, Bell, Building2, Gift, Phone, Lock, Inbox } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { useGetListingQuotaQuery } from "@/store/api/listingsApi"
import { useGetCrmSummaryQuery } from "@/store/api/leadsApi"
import { useGetMyReferralCodeQuery } from "@/store/api/referralsApi"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import {
  MembershipExpiry,
  greetingName,
  MyListingsMini,
  RecentLeads,
  totalLeads,
} from "@/components/crm/overview-widgets"

export function MercuryDashboard() {
  const router = useRouter()
  const user = useNav((s) => s.user)
  const { data: quota } = useGetListingQuotaQuery()
  const { data: summary } = useGetCrmSummaryQuery()
  const { data: referral } = useGetMyReferralCodeQuery()
  const newLeads = summary?.byMercuryStatus.find((s) => s.status === "new")?.count ?? 0
  const undelivered = summary?.undeliveredCount ?? 0
  const quotaReached = !!quota && quota.remaining <= 0

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-brand-primary/15 via-brand-tertiary to-card p-6 ring-1 ring-brand-primary/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-brand-primary-dark" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary-dark">Mercury Partner</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-brand-secondary">
              Welcome back, {greetingName(user)} 👋
            </h2>
            <p className="mt-1 text-sm text-brand-secondary/65">
              You have <b className="text-brand-primary-dark">{newLeads} new enquir{newLeads === 1 ? "y" : "ies"}</b> waiting in your pipeline.
            </p>
            <MembershipExpiry className="mt-2 text-brand-secondary/60" />
          </div>
          <button
            onClick={() => router.push(ROUTES.membership)}
            className="hidden bg-ink-black px-4 py-2.5 text-xs font-bold text-brand-primary sm:block"
          >
            Upgrade to Jupiter
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Listings Used" value={quota?.used ?? 0} suffix={quota ? `/${quota.planQuota}` : ""} icon="building" />
        <StatCard label="Total Leads" value={totalLeads(summary)} icon="inbox" />
        <StatCard label="New Leads" value={newLeads} icon="bell" />
        <StatCard label="Waiting (renew to unlock)" value={undelivered} icon="lock" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <MyListingsMini
            limit={4}
            quotaHint={quota ? `${quota.used} of ${quota.planQuota} used · upgrade to Jupiter for more` : undefined}
          />
          {quotaReached && (
            <div className="flex items-center gap-2 bg-brand-tertiary p-3 text-xs text-brand-secondary/70">
              <Crown className="h-3.5 w-3.5 text-brand-primary-dark" />
              Listing limit reached.{" "}
              <button onClick={() => router.push(ROUTES.membership)} className="font-bold text-brand-primary-dark hover:underline">
                Upgrade to Jupiter →
              </button>
            </div>
          )}
        </div>

        <RecentLeads tier="M" limit={4} title="Latest Enquiries" />
      </div>

      {/* Referrals teaser — full code/share/history lives on the Referrals tab */}
      <div className="bg-card p-6 ring-1 ring-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-secondary">Referrals</h3>
            <p className="text-xs text-brand-secondary/55">Extension days only — no cashback</p>
          </div>
          {typeof referral?.totalRewardDays === "number" && (
            <div className="text-right">
              <div className="font-serif text-3xl font-bold text-brand-primary-dark">
                <AnimatedCounter to={referral.totalRewardDays} suffix=" days" duration={1.5} />
              </div>
              <div className="text-[11px] text-brand-secondary/55">Reward days earned</div>
            </div>
          )}
        </div>
        <button
          onClick={() => router.push(ROUTES.dashboardTab("referrals"))}
          className="btn-gold relative mt-4 overflow-hidden px-5 py-2.5 text-sm font-bold"
        >
          <span className="relative z-10 flex items-center gap-2"><Gift className="h-4 w-4" /> View referrals & invite friends</span>
        </button>
      </div>

      {/* Contact Rule reminder */}
      <div className="flex items-center gap-3 border border-brand-primary/30 bg-brand-tertiary p-4 text-xs text-brand-secondary/70">
        <Phone className="h-4 w-4 text-brand-primary-dark" />
        <div>
          <b className="text-brand-secondary">Contact rule:</b> while your membership is active, every buyer enquiry on your listings reaches you. Free (unpaid) buyers get a limited number of lifetime contacts across the platform before they need to join.
        </div>
      </div>
    </div>
  )
}

// ─── shared sub-components ───────────────────────────────────────────────

function StatCard({ label, value, prefix, suffix, icon }: { label: string; value: number; prefix?: string; suffix?: string; icon: "building" | "bell" | "inbox" | "lock" }) {
  const Icon = { building: Building2, bell: Bell, inbox: Inbox, lock: Lock }[icon]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-5 ring-1 ring-brand-border"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center bg-brand-tertiary">
          <Icon className="h-5 w-5 text-brand-primary-dark" />
        </div>
      </div>
      <div className="mt-3 font-serif text-3xl font-bold text-brand-secondary">
        <AnimatedCounter to={value} prefix={prefix} suffix={suffix} duration={1.5} />
      </div>
      <div className="text-xs uppercase tracking-wide text-brand-secondary/55">{label}</div>
    </motion.div>
  )
}
