"use client"

import { motion } from "framer-motion"
import {
  Briefcase, Users, BarChart3, FileText, Building2, ArrowUpRight, Plus,
  Phone, Eye, MessageCircle, Mail, TrendingUp, ChevronRight, BadgeCheck,
  Handshake, Search, Bell,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { myListings, leads, leadPipelineJupiter, leadSources, analyticsCards, conversionFunnel } from "@/lib/dashboard-data"
import { AnimatedCounter } from "@/components/motion/animated-counter"

export function JupiterDashboard() {
  const router = useRouter()

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
            <h2 className="mt-2 font-serif text-2xl font-bold text-white">Welcome back, Anjali</h2>
            <p className="mt-1 text-sm text-white/65">
              You have <b className="text-brand-primary">42 new leads</b> and <b className="text-brand-primary">3 site visits</b> today.
            </p>
          </div>
          <button
            onClick={() => router.push(ROUTES.membership)}
            className="hidden bg-brand-primary px-4 py-2.5 text-xs font-bold text-ink-black sm:block"
          >
            Upgrade to Venus
          </button>
        </div>
      </div>

      {/* Analytics cards — Views / Calls / WhatsApp / Enquiries */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {analyticsCards.map((a, i) => {
          const Icon = { eye: Eye, phone: Phone, whatsapp: MessageCircle, mail: Mail }[a.icon]
          return (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card p-5 ring-1 ring-brand-border"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center bg-brand-tertiary">
                  <Icon className="h-5 w-5 text-brand-primary-dark" />
                </div>
                <span className="text-xs font-bold text-green-700">{a.change}</span>
              </div>
              <div className="mt-3 font-serif text-3xl font-bold text-brand-secondary">
                <AnimatedCounter to={a.value} separator="," duration={1.5} />
              </div>
              <div className="text-xs uppercase tracking-wide text-brand-secondary/55">{a.label}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Lead Pipeline — exact Jupiter stages */}
      <div className="bg-card p-6 ring-1 ring-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-secondary">Lead Pipeline</h3>
            <p className="text-xs text-brand-secondary/55">New → Contacted → Follow-up → Site Visit → Negotiation → Booking → Closed / Lost</p>
          </div>
          <span className="rounded-full bg-ink-black px-3 py-1 text-[11px] font-bold text-brand-primary">122 active leads</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {leadPipelineJupiter.map((s, i) => (
            <motion.div
              key={s.stage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="border border-brand-border bg-brand-tertiary/40 p-3 text-center"
            >
              <div className="mx-auto mb-2 h-2 w-2 rounded-full" style={{ background: s.color }} />
              <div className="font-serif text-2xl font-bold text-brand-secondary">{s.count}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-secondary/55">{s.stage}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Recent Leads */}
        <div className="bg-card p-6 ring-1 ring-brand-border">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-brand-secondary">Recent Leads</h3>
            <button onClick={() => router.push(ROUTES.dashboardTab("leads"))} className="text-xs font-bold text-brand-primary-dark hover:text-brand-secondary">View all →</button>
          </div>
          <div className="mt-4 overflow-hidden border border-brand-border">
            <table className="w-full">
              <thead className="bg-brand-tertiary">
                <tr className="text-[10px] font-bold uppercase tracking-wide text-brand-secondary/55">
                  <th className="px-3 py-2 text-left">Lead</th>
                  <th className="px-3 py-2 text-left">Property</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {leads.slice(0, 6).map((lead) => (
                  <tr key={lead.id} className="text-xs hover:bg-brand-tertiary/40">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ink-black to-brand-secondary text-[9px] font-bold text-brand-primary">
                          {lead.name.split(" ").map(n => n.charAt(0)).join("")}
                        </div>
                        <div>
                          <div className="font-bold text-brand-secondary">{lead.name}</div>
                          <div className="text-[10px] text-brand-secondary/55">{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-brand-secondary/65">{lead.property.split(" · ")[0]}</td>
                    <td className="px-3 py-2.5 text-brand-secondary/55">{lead.source}</td>
                    <td className="px-3 py-2.5">
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (lead.stage === "Lost" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                        {lead.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead Sources + Conversion */}
        <div className="space-y-6">
          <div className="bg-card p-6 ring-1 ring-brand-border">
            <h3 className="font-serif text-base font-bold text-brand-secondary">Lead Sources</h3>
            <div className="mt-4 space-y-2.5">
              {leadSources.slice(0, 5).map((s, i) => (
                <div key={s.source}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-secondary">{s.source}</span>
                    <span className="font-bold text-brand-primary-dark">{s.share}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-brand-border">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.share}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card p-6 ring-1 ring-brand-border">
            <h3 className="font-serif text-base font-bold text-brand-secondary">Conversion</h3>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-brand-secondary">3.4%</span>
              <span className="text-xs font-bold text-green-700"><TrendingUp className="inline h-3 w-3" /> +0.6%</span>
            </div>
            <p className="text-[11px] text-brand-secondary/55">Enquiry → Booking conversion this month</p>
          </div>
        </div>
      </div>

      {/* My Listings */}
      <div className="bg-card p-6 ring-1 ring-brand-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-secondary">My Listings</h3>
            <p className="text-xs text-brand-secondary/55">
              {myListings.length} of 30 used · {myListings.filter((l) => l.verified).length} verified
            </p>
          </div>
          <button className="btn-gold relative overflow-hidden px-4 py-2 text-xs font-bold">
            <span className="relative z-10 flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Listing</span>
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {myListings.slice(0, 6).map((l) => (
            <button
              key={l.id}
              onClick={() => router.push(ROUTES.propertyDetail(l.propertyId))}
              className="group flex items-center gap-3 border border-brand-border bg-brand-tertiary/40 p-3 text-left hover:border-brand-primary/40"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden">
                <img src={l.image} alt={l.title} className="h-full w-full object-cover" />
                {l.verified && <BadgeCheck className="absolute right-0 top-0 h-3.5 w-3.5 text-brand-primary" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-brand-secondary">{l.title}</div>
                <div className="truncate text-[11px] text-brand-secondary/55">{l.location}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-brand-secondary/55">
                  <Eye className="h-2.5 w-2.5" /> {l.views} · <Mail className="h-2.5 w-2.5" /> {l.enquiries}
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-brand-secondary/40" />
            </button>
          ))}
        </div>
      </div>

      {/* Co-broking */}
      <div className="bg-gradient-to-br from-brand-primary/10 to-transparent p-6 ring-1 ring-brand-primary/30">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center bg-ink-black">
            <Handshake className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-base font-bold text-brand-secondary">Co-broking Network</h3>
            <p className="text-xs text-brand-secondary/65">Share listings with other Jupiter partners and split leads.</p>
          </div>
          <button className="border border-ink-black/15 px-4 py-2 text-xs font-bold text-brand-secondary hover:bg-card">
            Find partners
          </button>
        </div>
      </div>

      {/* CRM Modules reminder */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {["Buyers", "Sellers", "Investors", "Notes", "Meetings"].map((m) => (
          <div key={m} className="border border-brand-border bg-card p-3 text-center">
            <Users className="mx-auto h-4 w-4 text-brand-primary-dark" />
            <div className="mt-1 text-xs font-bold text-brand-secondary">{m}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
