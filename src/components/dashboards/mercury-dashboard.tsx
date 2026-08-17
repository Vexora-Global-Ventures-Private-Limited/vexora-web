"use client"

import { motion } from "framer-motion"
import {
  Crown, Bell, Wallet, Building2, ArrowUpRight, Plus, Check, Gift,
  Phone, Eye, MessageCircle, ChevronRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { myListings, leads, referrals } from "@/lib/dashboard-data"
import { AnimatedCounter } from "@/components/motion/animated-counter"

export function MercuryDashboard() {
  const router = useRouter()
  const myListings2 = myListings.slice(0, 2) // Mercury limit: 2 listings
  const myLeads = leads.filter((l) => l.stage === "New" || l.stage === "Contacted").slice(0, 4)
  const contactsUnlocked = myListings2.reduce((sum, l) => sum + l.contactsUnlocked, 0)
  const totalRewardDays = referrals.reduce((sum, r) => sum + r.rewardDays, 0)

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-brand-primary/15 via-brand-tertiary to-white p-6 ring-1 ring-brand-primary/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-brand-primary-dark" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary-dark">Mercury Partner</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-brand-secondary">
              Welcome back, Aarav 👋
            </h2>
            <p className="mt-1 text-sm text-brand-secondary/65">
              You have <b className="text-brand-primary-dark">3 new enquiries</b> and <b className="text-brand-primary-dark">1 visit request</b> today.
            </p>
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
        <StatCard label="Listings Used" value={2} suffix="/2" icon="building" />
        <StatCard label="Lead Notifications" value={14} icon="bell" />
        <StatCard label="Referral Reward Days" value={totalRewardDays} suffix=" d" icon="wallet" />
        <StatCard label="Contacts Unlocked" value={contactsUnlocked} icon="phone" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* My Listings (max 2) */}
        <div className="bg-card p-6 ring-1 ring-brand-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-secondary">My Listings</h3>
              <p className="text-xs text-brand-secondary/55">2 of 2 used · upgrade to Jupiter for 30</p>
            </div>
            <button
              onClick={() => router.push(ROUTES.properties)}
              className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
            >
              Browse <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {myListings2.map((l) => (
              <button
                key={l.id}
                onClick={() => router.push(ROUTES.propertyDetail(l.propertyId))}
                className="group flex w-full items-center gap-3 border border-brand-border bg-brand-tertiary/40 p-3 text-left hover:border-brand-primary/40"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden">
                  <img src={l.image} alt={l.title} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-brand-secondary">{l.title}</div>
                  <div className="truncate text-xs text-brand-secondary/55">{l.location}</div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-brand-secondary/65">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-brand-primary-dark" />{l.views}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3 text-brand-primary-dark" />{l.enquiries}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-brand-secondary/40 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
          {myListings2.length >= 2 && (
            <div className="mt-4 flex items-center gap-2 bg-brand-tertiary p-3 text-xs text-brand-secondary/70">
              <Crown className="h-3.5 w-3.5 text-brand-primary-dark" />
              Listing limit reached. <button onClick={() => router.push(ROUTES.membership)} className="font-bold text-brand-primary-dark hover:underline">Upgrade to Jupiter →</button>
            </div>
          )}
        </div>

        {/* Lead Notifications */}
        <div className="bg-card p-6 ring-1 ring-brand-border">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Lead Notifications</h3>
          <p className="text-xs text-brand-secondary/55">Smart Match + customer enquiries</p>
          <div className="mt-4 space-y-2">
            {myLeads.map((lead) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-brand-border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-brand-secondary">{lead.name}</div>
                  <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold text-brand-primary-dark">{lead.stage}</span>
                </div>
                <div className="mt-1 truncate text-[11px] text-brand-secondary/55">{lead.property}</div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-brand-secondary/45">
                  <Bell className="h-2.5 w-2.5" /> {lead.createdAt} · {lead.source}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Referrals teaser — full code/share/history lives on the Referrals tab */}
      <div className="bg-card p-6 ring-1 ring-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-secondary">Referrals</h3>
            <p className="text-xs text-brand-secondary/55">Extension days only — no cashback</p>
          </div>
          <div className="text-right">
            <div className="font-serif text-3xl font-bold text-brand-primary-dark">
              <AnimatedCounter to={totalRewardDays} suffix=" days" duration={1.5} />
            </div>
            <div className="text-[11px] text-brand-secondary/55">Reward days earned</div>
          </div>
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
          <b className="text-brand-secondary">Contact rule:</b> as a Mercury member you get unlimited buyer contacts on your listings. Free (unpaid) buyers get 2 lifetime contacts across the whole platform before they need to join.
        </div>
      </div>
    </div>
  )
}

// ─── shared sub-components ───────────────────────────────────────────────

function StatCard({ label, value, prefix, suffix, icon }: { label: string; value: number; prefix?: string; suffix?: string; icon: "building" | "bell" | "wallet" | "phone" }) {
  const Icon = { building: Building2, bell: Bell, wallet: Wallet, phone: Phone }[icon]
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
