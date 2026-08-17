"use client"

import { motion } from "framer-motion"
import {
  LayoutDashboard, Users, Building2, BarChart3, FileText, Settings, Bell,
  TrendingUp, Eye, Phone, MessageCircle, Mail, ArrowUpRight, Search,
} from "lucide-react"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/sections/section-heading"
import { AnimatedCounter } from "@/components/motion/animated-counter"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Building2, label: "Listings" },
  { icon: Users, label: "CRM" },
  { icon: BarChart3, label: "Analytics" },
  { icon: FileText, label: "Reports" },
  { icon: Settings, label: "Settings" },
]

const crmModules = ["Buyers", "Sellers", "Investors", "Notes", "Meetings"]

const pipelineStages = [
  { stage: "New", count: 42, color: "var(--brand-primary)" },
  { stage: "Contacted", count: 28, color: "var(--brand-primary)" },
  { stage: "Follow-up", count: 18, color: "var(--brand-primary-dark)" },
  { stage: "Site Visit", count: 11, color: "var(--color-gold-700)" },
  { stage: "Negotiation", count: 6, color: "var(--color-gold-800)" },
  { stage: "Booking", count: 3, color: "var(--color-gold-900)" },
  { stage: "Closed", count: 14, color: "var(--color-ink-black)" },
]

const analytics = [
  { label: "Views", value: 18420, icon: Eye, change: "+12.4%" },
  { label: "Calls", value: 824, icon: Phone, change: "+8.1%" },
  { label: "WhatsApp", value: 1240, icon: MessageCircle, change: "+24.7%" },
  { label: "Enquiries", value: 412, icon: Mail, change: "+18.9%" },
]

export function DashboardPreview() {
  return (
    <section id="dashboard" className="paper-texture section-home">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Jupiter & Venus dashboards"
          title={<>Your entire brokerage. <span className="text-gold-gradient italic">One pane.</span></>}
          description="A live preview of the Jupiter CRM dashboard — the same interface Venus partners get, plus inventory management (Projects → Towers → Units) and campaign analytics."
        />

        <Reveal direction="up" delay={0.2}>
          <div className="mt-14 overflow-hidden border border-brand-border-light bg-card shadow-2xl shadow-brand-primary/15">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-brand-border-light bg-brand-surface px-5 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-brand-primary" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <div className="mx-auto flex items-center gap-2 bg-card px-3 py-1 text-xs text-brand-secondary/55 ring-1 ring-brand-border-light">
                <span className="text-brand-primary-dark">🔒</span>
                vxp.in/dashboard/jupiter
              </div>
              <button aria-label="Refresh" className="grid h-7 w-7 place-items-center rounded text-brand-secondary/55 hover:bg-card">
                <Bell className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Dashboard body */}
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr]">
              {/* Sidebar */}
              <aside className="hidden border-r border-brand-border-light bg-brand-surface/40 p-4 lg:block">
                <div className="flex items-center gap-2 px-2 py-2">
                  <div className="grid h-8 w-8 place-items-center bg-gradient-to-br from-brand-primary to-gold-700">
                    <span className="font-serif text-sm font-bold text-brand-secondary">V</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-secondary">VXP</div>
                    <div className="text-[9px] text-brand-primary-dark">Jupiter Partner</div>
                  </div>
                </div>

                <nav className="mt-4 space-y-0.5">
                  {navItems.map((item) => (
                    <button
                      key={item.label}
                      className={
                        "flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors " +
                        (item.active
                          ? "bg-ink-black text-brand-primary"
                          : "text-brand-secondary/65 hover:bg-card hover:text-brand-secondary")
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </nav>

                {/* CRM modules */}
                <div className="mt-6">
                  <div className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-secondary/45">
                    CRM Modules
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {crmModules.map((m) => (
                      <div key={m} className="flex items-center gap-2 px-3 py-1.5 text-xs text-brand-secondary/65">
                        <span className="h-1 w-1 rounded-full bg-brand-primary-dark" />
                        {m}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade card */}
                <div className="mt-6 bg-gradient-to-br from-ink-black to-ink-deep p-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-primary">Upgrade to Venus</div>
                  <div className="mt-1 text-[10px] text-white/70">Inventory + campaigns</div>
                  <button className="btn-gold mt-2 w-full overflow-hidden py-1.5 text-[10px] font-bold">
                    <span className="relative z-10">₹ 4,999 / 6mo</span>
                  </button>
                </div>
              </aside>

              {/* Main content */}
              <div className="p-5 sm:p-7">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-brand-secondary">
                      Welcome back, Anjali
                    </h3>
                    <p className="text-xs text-brand-secondary/55">
                      You have <span className="font-bold text-brand-primary-dark">42 new leads</span> and 3 site visits today.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative hidden sm:block">
                      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-secondary/40" />
                      <input
                        type="text"
                        placeholder="Search leads, properties..."
                        className="w-56 border border-brand-border-light bg-card py-1.5 pl-7 pr-3 text-xs text-brand-secondary outline-none focus:border-brand-primary"
                      />
                    </div>
                    <button className="btn-gold overflow-hidden px-3 py-1.5 text-xs font-bold">
                      <span className="relative z-10">+ Add Listing</span>
                    </button>
                  </div>
                </div>

                {/* Analytics cards */}
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {analytics.map((a, i) => (
                    <motion.div
                      key={a.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="border border-brand-border-light bg-card p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="grid h-8 w-8 place-items-center bg-brand-surface">
                          <a.icon className="h-4 w-4 text-brand-primary-dark" />
                        </div>
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-green-700">
                          <TrendingUp className="h-3 w-3" />
                          {a.change}
                        </span>
                      </div>
                      <div className="mt-2 font-serif text-2xl font-bold text-brand-secondary">
                        <AnimatedCounter to={a.value} separator="," duration={1.6} />
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-brand-secondary/55">{a.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Pipeline view */}
                <div className="mt-5 border border-brand-border-light bg-brand-surface/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif text-base font-bold text-brand-secondary">Lead Pipeline</h4>
                      <p className="text-[11px] text-brand-secondary/55">Drag leads between stages</p>
                    </div>
                    <span className="rounded-full bg-ink-black px-2.5 py-0.5 text-[10px] font-bold text-brand-primary">
                      122 active leads
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                    {pipelineStages.map((s, i) => (
                      <motion.div
                        key={s.stage}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.06 }}
                        whileHover={{ y: -3 }}
                        className="border border-brand-border-light bg-card p-2.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                          <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-brand-secondary/65">
                            {s.stage}
                          </span>
                        </div>
                        <div className="mt-1.5 font-serif text-xl font-bold text-brand-secondary">{s.count}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent leads table */}
                <div className="mt-5 overflow-hidden border border-brand-border-light">
                  <div className="flex items-center justify-between border-b border-brand-border-light bg-brand-surface/40 px-4 py-2.5">
                    <h4 className="font-serif text-sm font-bold text-brand-secondary">Recent leads</h4>
                    <button className="flex items-center gap-1 text-[11px] font-bold text-brand-primary-dark hover:text-brand-secondary">
                      View all <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="divide-y divide-brand-border-light">
                    {[
                      { name: "Rohan Malhotra", prop: "Lodha Bellevue · Worli", source: "Sponsored", stage: "Site Visit", color: "var(--color-gold-700)" },
                      { name: "Vikram Shah", prop: "Runwal Sanctuary · Goregaon", source: "Listing Enquiry", stage: "Negotiation", color: "var(--color-gold-800)" },
                      { name: "Priya Reddy", prop: "Sobha Dream Acres · Bengaluru", source: "Property Click", stage: "Contacted", color: "var(--brand-primary)" },
                    ].map((lead, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                        className="grid grid-cols-[1.2fr_1.5fr_1fr_0.8fr] items-center gap-3 bg-card px-4 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-ink-black to-ink-deep text-[9px] font-bold text-brand-primary">
                            {lead.name.split(" ").map(n => n.charAt(0)).join("")}
                          </div>
                          <span className="font-semibold text-brand-secondary">{lead.name}</span>
                        </div>
                        <div className="truncate text-brand-secondary/65">{lead.prop}</div>
                        <div className="text-brand-secondary/55">{lead.source}</div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: lead.color }} />
                          <span className="font-semibold text-brand-secondary">{lead.stage}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
