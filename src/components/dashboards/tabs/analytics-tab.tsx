"use client"

import { motion } from "framer-motion"
import { Eye, Phone, MessageCircle, Mail, Wallet, TrendingUp } from "lucide-react"
import type { Tier } from "@/lib/nav-store"
import { analyticsCards, conversionFunnel, leadSources, myListings } from "@/lib/dashboard-data"
import { StatCard } from "@/components/dashboard/stat-card"

const ICONS = { eye: Eye, phone: Phone, whatsapp: MessageCircle, mail: Mail } as const

export function AnalyticsTab({ tier }: { tier: Tier }) {
  if (tier === "M") return <MercuryAnalytics />
  return <FullAnalytics />
}

function MercuryAnalytics() {
  const totalViews = myListings.slice(0, 2).reduce((s, l) => s + l.views, 0)
  const totalEnquiries = myListings.slice(0, 2).reduce((s, l) => s + l.enquiries, 0)
  const totalContacts = myListings.slice(0, 2).reduce((s, l) => s + l.contactsUnlocked, 0)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Analytics</h2>
        <p className="text-sm text-brand-muted-foreground">Performance across your 2 listings</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Views" value={totalViews} icon={Eye} />
        <StatCard label="Enquiries" value={totalEnquiries} icon={Mail} />
        <StatCard label="Contacts Unlocked" value={totalContacts} icon={Phone} />
      </div>
      <div className="card-sheen bg-card p-6">
        <p className="text-sm text-brand-secondary/65">
          Referral earnings, listing-level detail and lead notifications live on your Overview tab — analytics here
          covers listing performance only. Upgrade to Jupiter for full conversion &amp; source-level analytics.
        </p>
      </div>
    </div>
  )
}

function FullAnalytics() {
  const maxCount = Math.max(...leadSources.map((s) => s.count))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Analytics</h2>
        <p className="text-sm text-brand-muted-foreground">Views, calls, WhatsApp, enquiries &amp; conversion — full breakdown</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {analyticsCards.map((a, i) => (
          <motion.div key={a.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <StatCard label={a.label} value={a.value} icon={ICONS[a.icon]} hint={a.change} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Conversion funnel */}
        <div className="card-sheen bg-card p-6">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Conversion Funnel</h3>
          <p className="text-xs text-brand-muted-foreground">Profile view → booking, this month</p>
          <div className="mt-5 space-y-3">
            {conversionFunnel.map((stage, i) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-secondary">{stage.stage}</span>
                  <span className="font-bold text-brand-primary-dark">{stage.count.toLocaleString()} · {stage.pct}%</span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-brand-border">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.max(stage.pct, 1.5)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.06 }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead sources */}
        <div className="card-sheen bg-card p-6">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Lead Sources</h3>
          <p className="text-xs text-brand-muted-foreground">Where your leads come from</p>
          <div className="mt-5 space-y-3">
            {leadSources.map((s, i) => (
              <div key={s.source}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-secondary">{s.source}</span>
                  <span className="font-bold text-brand-primary-dark">{s.count.toLocaleString()} · {s.share}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-border">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(s.count / maxCount) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border border-brand-primary/30 bg-brand-tertiary p-4 text-xs text-brand-secondary/70">
        <TrendingUp className="h-4 w-4 text-brand-primary-dark" />
        <div>
          <b className="text-brand-secondary">Scope note:</b> analytics cover impressions, clicks, calls, WhatsApp &amp;
          enquiries only — no cohort or audience analytics, per the platform&apos;s current scope.
        </div>
      </div>
    </div>
  )
}
