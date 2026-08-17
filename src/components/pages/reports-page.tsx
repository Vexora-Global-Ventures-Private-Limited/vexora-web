"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Download, FileText, Users, Megaphone, Building2, TrendingUp, Wallet,
  Check, FileSpreadsheet, Calendar, Crown,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { reportTypes, type ReportType } from "@/lib/dashboard-data"

const iconMap: Record<string, typeof Users> = {
  leads: Users,
  membership: Crown,
  advertisement: Megaphone,
  listing: Building2,
  performance: TrendingUp,
  payment: Wallet,
}

export function ReportsPage() {
  const router = useRouter()
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set())

  const handleDownload = (id: string) => {
    setDownloading(id)
    setTimeout(() => {
      setDownloading(null)
      setDownloaded((prev) => new Set([...prev, id]))
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => router.push(ROUTES.dashboard)} className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
          <button className="border border-brand-border-light bg-card px-4 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-surface">
            <Calendar className="mr-1.5 inline h-3.5 w-3.5" /> Last 30 days
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-brand-secondary">Reports &amp; CSV Exports</h1>
          <p className="text-sm text-brand-secondary/65">6 report types — download as CSV for offline analysis</p>
        </div>

        {/* Report cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((r, i) => (
            <ReportCard
              key={r.id}
              report={r}
              index={i}
              downloading={downloading === r.id}
              downloaded={downloaded.has(r.id)}
              onDownload={() => handleDownload(r.id)}
            />
          ))}
        </div>

        {/* Recent exports */}
        <div className="mt-8 bg-card p-6 ring-1 ring-brand-border-light">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Recent Exports</h3>
          <div className="mt-4 space-y-2">
            {[
              { name: "Lead_Report_2026-06.csv", size: "248 KB", date: "2026-06-25 14:20" },
              { name: "Advertisement_Report_2026-06.csv", size: "42 KB", date: "2026-06-24 11:08" },
              { name: "Billing_Report_Q2_2026.csv", size: "84 KB", date: "2026-06-20 09:15" },
              { name: "Performance_Report_2026-06.csv", size: "18 KB", date: "2026-06-18 16:30" },
            ].map((f) => (
              <div key={f.name} className="flex items-center gap-3 border border-brand-border-light bg-brand-surface/40 p-3">
                <div className="grid h-9 w-9 place-items-center bg-card">
                  <FileSpreadsheet className="h-4 w-4 text-green-700" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-brand-secondary">{f.name}</div>
                  <div className="text-[11px] text-brand-secondary/55">{f.size} · {f.date}</div>
                </div>
                <button className="grid h-8 w-8 place-items-center rounded text-brand-primary-dark hover:bg-card">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Out of scope reminder */}
        <div className="mt-6 flex items-start gap-3 border border-brand-primary/20 bg-brand-primary/5 p-4 text-xs text-brand-secondary/70">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary-dark" />
          <div>
            <b className="text-brand-primary-dark">Reminder:</b> VXP reports cover leads, listings, memberships, advertisements, performance &amp; payments only.
            Commission tracking, brokerage accounting, escrow &amp; post-sale payment reports are explicitly out of scope.
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportCard({
  report, index, downloading, downloaded, onDownload,
}: {
  report: ReportType
  index: number
  downloading: boolean
  downloaded: boolean
  onDownload: () => void
}) {
  const Icon = iconMap[report.icon] ?? FileText
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="bg-card p-6 ring-1 ring-brand-border-light hover:shadow-xl hover:shadow-brand-primary/10"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center bg-gradient-to-br from-ink-black to-ink-deep">
          <Icon className="h-5 w-5 text-brand-primary" />
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-brand-primary-dark">{report.id}</div>
      </div>
      <h3 className="mt-4 font-serif text-lg font-bold text-brand-secondary">{report.name}</h3>
      <p className="mt-1 text-xs text-brand-secondary/65">{report.desc}</p>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-brand-secondary/55">{report.period}</span>
        <span className="font-bold text-brand-secondary">{report.rows.toLocaleString()} rows</span>
      </div>
      <button
        onClick={onDownload}
        disabled={downloading}
        className={
          "mt-5 flex w-full items-center justify-center gap-2 py-3 text-xs font-bold transition-all " +
          (downloaded
            ? "bg-green-100 text-green-700"
            : downloading
            ? "bg-brand-surface text-brand-secondary/55"
            : "btn-gold relative overflow-hidden")
        }
      >
        <AnimatePresence mode="wait">
          {downloaded ? (
            <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <Check className="h-4 w-4" /> Downloaded
            </motion.span>
          ) : downloading ? (
            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-3.5 w-3.5 rounded-full border-2 border-ink-black/30 border-t-ink-black"
              />
              Generating CSV…
            </motion.span>
          ) : (
            <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex items-center gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  )
}
