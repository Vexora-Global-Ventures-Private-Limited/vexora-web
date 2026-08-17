"use client"

import { Fragment } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft, Plus, Megaphone, Eye, MousePointerClick, TrendingUp, Wallet,
  Check, Clock, X, Pause, Play, ArrowUpRight, LayoutPanelTop, MapPin,
  Building2, Crown, ChevronRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { myAds, type AdStatus } from "@/lib/dashboard-data"
import { AnimatedCounter } from "@/components/motion/animated-counter"

const statusStyles: Record<AdStatus, { bg: string; text: string; dot: string }> = {
  "Draft": { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  "Pending Payment": { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  "Under Review": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  "Approved": { bg: "bg-cyan-100", text: "text-cyan-700", dot: "bg-cyan-500" },
  "Live": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  "Rejected": { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  "Paused": { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  "Completed": { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
}

const adTypeIcons: Record<string, typeof LayoutPanelTop> = {
  "Home Banner": LayoutPanelTop,
  "City Advertisement": MapPin,
  "Featured Developer": Building2,
  "Project Promotion": Play,
  "Sponsored Properties": Crown,
}

export function AdvertiserDashboard() {
  const router = useRouter()

  const totalImpressions = myAds.reduce((s, a) => s + a.impressions, 0)
  const totalClicks = myAds.reduce((s, a) => s + a.clicks, 0)
  const totalSpend = myAds.filter(a => a.status === "Live" || a.status === "Completed" || a.status === "Paused").length * 18999
  const liveAds = myAds.filter(a => a.status === "Live").length

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => router.push(ROUTES.dashboard)} className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(ROUTES.promote)} className="btn-gold relative overflow-hidden px-4 py-2 text-xs font-bold">
              <span className="relative z-10 flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> New Ad</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-brand-secondary">Advertiser Dashboard</h1>
          <p className="text-sm text-brand-secondary/65">Track ad status, clicks, impressions &amp; performance across all 5 ad types</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Active Ads", value: liveAds, suffix: "", change: "+2 this week", icon: Megaphone },
            { label: "Total Impressions", value: totalImpressions, separator: ",", change: "+12.4%", icon: Eye },
            { label: "Total Clicks", value: totalClicks, separator: ",", change: "+8.1%", icon: MousePointerClick },
            { label: "Total Spend", value: totalSpend, prefix: "₹ ", separator: ",", change: "This quarter", icon: Wallet },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card p-5 ring-1 ring-brand-border-light"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center bg-brand-surface">
                  <kpi.icon className="h-5 w-5 text-brand-primary-dark" />
                </div>
                <span className="text-[10px] font-bold text-green-700">{kpi.change}</span>
              </div>
              <div className="mt-3 font-serif text-3xl font-bold text-brand-secondary">
                <AnimatedCounter to={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} separator={kpi.separator} duration={1.5} />
              </div>
              <div className="text-xs uppercase tracking-wide text-brand-secondary/55">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Ads table */}
        <div className="mt-6 bg-card p-6 ring-1 ring-brand-border-light">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-brand-secondary">All Advertisements</h3>
            <span className="text-xs text-brand-secondary/55">{myAds.length} total</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-surface">
                <tr className="text-[10px] font-bold uppercase tracking-wide text-brand-secondary/55">
                  <th className="px-4 py-3 text-left">Ad</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-right">Impr.</th>
                  <th className="px-4 py-3 text-right">Clicks</th>
                  <th className="px-4 py-3 text-right">CTR</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-light">
                {myAds.map((ad) => {
                  const Icon = adTypeIcons[ad.type] ?? Megaphone
                  const style = statusStyles[ad.status]
                  return (
                    <Fragment key={ad.id}>
                      <tr className="hover:bg-brand-surface/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="grid h-8 w-8 place-items-center bg-gradient-to-br from-brand-primary to-brand-primary-dark">
                              <Icon className="h-4 w-4 text-brand-secondary" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-brand-secondary">{ad.headline}</div>
                              <div className="text-[10px] text-brand-secondary/55">{ad.id} · {ad.price}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-brand-secondary/65">{ad.type}</td>
                        <td className="px-4 py-3 text-brand-secondary/65">{ad.package}</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-secondary">{ad.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-secondary">{ad.clicks.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-brand-primary-dark">{ad.ctr}</td>
                        <td className="px-4 py-3">
                          <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold " + style.bg + " " + style.text}>
                            <span className={"h-1.5 w-1.5 rounded-full " + style.dot} />
                            {ad.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {(ad.status === "Live" || ad.status === "Paused") && (
                              <button className="grid h-7 w-7 place-items-center rounded bg-brand-surface text-brand-primary-dark hover:bg-gold-100" aria-label="Toggle pause">
                                {ad.status === "Live" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                              </button>
                            )}
                            {ad.status === "Rejected" && (
                              <button
                                onClick={() => router.push(ROUTES.promote)}
                                className="rounded bg-ink-black px-2.5 py-1.5 text-[10px] font-bold text-brand-primary hover:bg-ink-deep"
                              >
                                Resubmit free
                              </button>
                            )}
                            <button className="grid h-7 w-7 place-items-center rounded bg-brand-surface text-brand-primary-dark hover:bg-gold-100" aria-label="View report">
                              <TrendingUp className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {ad.status === "Rejected" && ad.rejectionReason && (
                        <tr>
                          <td colSpan={8} className="bg-red-50/60 px-4 py-2.5 text-[11px] text-red-700">
                            <b>Rejection reason:</b> {ad.rejectionReason} — resubmitting is free, no additional payment (same order).
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ad types overview */}
        <div className="mt-6 bg-card p-6 ring-1 ring-brand-border-light">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Ad Types on VXP</h3>
          <p className="text-xs text-brand-secondary/55">5 placement types — each managed by admin, available for self-service after account + payment</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { name: "Home Banner", icon: LayoutPanelTop, desc: "Home page top fold", example: "Lodha Elite Towers" },
              { name: "City Advertisement", icon: MapPin, desc: "City search results", example: "Search → Thane" },
              { name: "Featured Developer", icon: Building2, desc: "Developer profile", example: "Lodha · Runwal" },
              { name: "Project Promotion", icon: Play, desc: "Video · Brochure · Tour", example: "Godrej Prana" },
              { name: "Sponsored Properties", icon: Crown, desc: "Top of listings", example: "Priority boost" },
            ].map((t) => (
              <div key={t.name} className="border border-brand-border-light bg-brand-surface/40 p-4">
                <t.icon className="h-5 w-5 text-brand-primary-dark" />
                <div className="mt-2 text-xs font-bold text-brand-secondary">{t.name}</div>
                <div className="text-[10px] text-brand-secondary/55">{t.desc}</div>
                <div className="mt-1 text-[10px] italic text-brand-primary-dark">{t.example}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 flex items-center justify-between bg-gradient-to-br from-ink-black to-ink-deep p-6 text-white">
          <div>
            <h3 className="font-serif text-lg font-bold">Ready to launch a new ad?</h3>
            <p className="text-xs text-white/65">Pick a type, pay, upload creative — goes live after admin approval (typically 24h)</p>
          </div>
          <button onClick={() => router.push(ROUTES.promote)} className="btn-gold relative overflow-hidden px-5 py-3 text-sm font-bold">
            <span className="relative z-10 flex items-center gap-2">Start new ad <ArrowUpRight className="h-4 w-4" /></span>
          </button>
        </div>
      </div>
    </div>
  )
}
