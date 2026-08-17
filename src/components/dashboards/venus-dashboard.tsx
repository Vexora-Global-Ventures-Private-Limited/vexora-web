"use client"

import { motion } from "framer-motion"
import {
  Building2, Wallet, Megaphone, TrendingUp, Crown, ChevronRight, FileCheck2, ShieldAlert, Plus,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { myAds, leadPipelineVenus, analyticsCards } from "@/lib/dashboard-data"
import { useProjectsStore } from "@/lib/projects-store"
import { projectPriceRangeCr } from "@/lib/projects-data"
import { AnimatedCounter } from "@/components/motion/animated-counter"

export function VenusDashboard() {
  const router = useRouter()
  const allProjects = useProjectsStore((s) => s.projects)
  const myProjects = allProjects.filter((p) => p.isMine)

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
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">Welcome back, Vikram</h2>
            <p className="mt-1 text-sm text-white/65">
              2 active campaigns · 100 listings live · ₹4.2L ad spend this quarter
            </p>
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
        {[
          { label: "Total Revenue", value: 4280000, prefix: "₹ ", suffix: "", change: "+18.2%", icon: Wallet },
          { label: "Active Campaigns", value: 7, suffix: "", change: "+2", icon: Megaphone },
          { label: "My Projects", value: myProjects.length, suffix: "", change: `${myProjects.reduce((n, p) => n + p.configurations.length, 0)} configs`, icon: Building2 },
          { label: "Lead Conversion", value: 4.8, suffix: "%", change: "+0.9%", icon: TrendingUp },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card p-5 ring-1 ring-brand-border"
          >
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center bg-gradient-to-br from-ink-black to-brand-secondary">
                <kpi.icon className="h-5 w-5 text-brand-primary" />
              </div>
              <span className="text-xs font-bold text-green-700">{kpi.change}</span>
            </div>
            <div className="mt-3 font-serif text-3xl font-bold text-brand-secondary">
              <AnimatedCounter to={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} separator="," duration={1.6} />
            </div>
            <div className="text-xs uppercase tracking-wide text-brand-secondary/55">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* My Projects — Venus-only feature: multi-configuration developer
          listings (Projects → Towers → Units). This replaces the single-unit
          "My Listings" tab that Mercury/Jupiter use, since Venus's whole
          inventory model is projects, not flat listings. Full management
          lives in the dedicated tab. */}
      <div className="bg-card p-6 ring-1 ring-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-secondary">My Projects</h3>
            <p className="text-xs text-brand-secondary/55">Multi-configuration developer listings · Venus-only feature</p>
          </div>
          <button
            onClick={() => router.push(ROUTES.newProject)}
            className="flex items-center gap-1.5 bg-ink-black px-3 py-2 text-[11px] font-bold text-brand-primary hover:bg-brand-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> New project
          </button>
        </div>

        {myProjects.length === 0 ? (
          <p className="mt-5 text-sm text-brand-secondary/55">You haven&apos;t listed a project yet.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myProjects.slice(0, 6).map((p) => {
              const { min, max } = projectPriceRangeCr(p)
              const reraOk = p.reraRegistrations.length > 0
              return (
                <button
                  key={p.id}
                  onClick={() => router.push(ROUTES.projectDetail(p.id))}
                  className="group flex items-center gap-3 border border-brand-border bg-brand-tertiary/40 p-3 text-left hover:border-brand-primary/40"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden">
                    <img src={p.coverImage} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-brand-secondary">{p.name}</div>
                    <div className="truncate text-[11px] text-brand-secondary/55">
                      {min === max ? `₹ ${min} Cr` : `₹ ${min}–${max} Cr`} · {p.configurations.length} configs
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px]">
                      {reraOk ? (
                        <span className="flex items-center gap-1 text-green-700"><FileCheck2 className="h-2.5 w-2.5" /> RERA</span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-700"><ShieldAlert className="h-2.5 w-2.5" /> Pending</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-brand-secondary/40" />
                </button>
              )
            })}
          </div>
        )}

        <button
          onClick={() => router.push(ROUTES.dashboardTab("projects"))}
          className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
        >
          Manage all projects <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Lead Pipeline — Venus (Qualified instead of Follow-up) */}
      <div className="bg-card p-6 ring-1 ring-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-secondary">Lead Pipeline</h3>
            <p className="text-xs text-brand-secondary/55">New → Contacted → Qualified → Site Visit → Negotiation → Booking → Closed</p>
          </div>
          <span className="rounded-full bg-ink-black px-3 py-1 text-[11px] font-bold text-brand-primary">61 active</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {leadPipelineVenus.map((s, i) => (
            <motion.div
              key={s.stage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-brand-border bg-brand-tertiary/40 p-3 text-center"
            >
              <div className="mx-auto mb-2 h-2 w-2 rounded-full" style={{ background: s.color }} />
              <div className="font-serif text-2xl font-bold text-brand-secondary">{s.count}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-secondary/55">{s.stage}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Campaign Analytics */}
      <div className="bg-card p-6 ring-1 ring-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-secondary">Campaign Analytics</h3>
            <p className="text-xs text-brand-secondary/55">Ad performance, impressions, clicks, CTR, ROI</p>
          </div>
          <button onClick={() => router.push(ROUTES.advertiser)} className="text-xs font-bold text-brand-primary-dark hover:text-brand-secondary">
            View advertiser dashboard →
          </button>
        </div>
        <div className="mt-4 overflow-hidden border border-brand-border">
          <table className="w-full text-sm">
            <thead className="bg-brand-tertiary">
              <tr className="text-[10px] font-bold uppercase tracking-wide text-brand-secondary/55">
                <th className="px-4 py-2 text-left">Ad ID</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Headline</th>
                <th className="px-4 py-2 text-right">Impr.</th>
                <th className="px-4 py-2 text-right">Clicks</th>
                <th className="px-4 py-2 text-right">CTR</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {myAds.filter(a => a.status === "Live" || a.status === "Paused").slice(0, 5).map((ad) => (
                <tr key={ad.id} className="text-xs hover:bg-brand-tertiary/40">
                  <td className="px-4 py-2.5 font-bold text-brand-primary-dark">{ad.id}</td>
                  <td className="px-4 py-2.5 text-brand-secondary/65">{ad.type}</td>
                  <td className="px-4 py-2.5 font-semibold text-brand-secondary truncate max-w-[200px]">{ad.headline}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-brand-secondary">{ad.impressions.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-brand-secondary">{ad.clicks.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-brand-primary-dark">{ad.ctr}</td>
                  <td className="px-4 py-2.5">
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (ad.status === "Live" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                      {ad.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dedicated account manager */}
      <div className="flex items-center gap-4 bg-gradient-to-br from-brand-primary/15 to-transparent p-5 ring-1 ring-brand-primary/30">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-ink-black to-brand-secondary text-sm font-bold text-brand-primary">
          RM
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-brand-secondary">Riya Mukherjee · Your dedicated account manager</div>
          <div className="text-xs text-brand-secondary/65">Picks up on the second ring · riya@vxp.in · +91 22 5550 0199</div>
        </div>
        <button className="bg-ink-black px-4 py-2 text-xs font-bold text-brand-primary">Schedule call</button>
      </div>
    </div>
  )
}
