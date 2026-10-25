"use client"

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useGetAdMetricsQuery } from "@/store/api/adsApi"

/**
 * CTR is computed server-side at read time; its unit isn't documented, so
 * accept either a 0–1 fraction or an already-multiplied percentage.
 */
export function formatCtr(ctr: number | null | undefined) {
  if (typeof ctr !== "number" || !Number.isFinite(ctr)) return "—"
  const pct = ctr <= 1 ? ctr * 100 : ctr
  return `${pct.toFixed(1)}%`
}

const RANGES = [
  { id: "7", label: "7 days", days: 7 },
  { id: "30", label: "30 days", days: 30 },
  { id: "all", label: "All time", days: null },
] as const

/** YYYY-MM-DD — the format GET /ads/:id/metrics accepts for from/to (verified live). */
const isoDay = (d: Date) => d.toISOString().slice(0, 10)

function rangeParams(days: number | null): { from?: string; to?: string } {
  if (!days) return {}
  const to = new Date()
  const from = new Date(to.getTime() - (days - 1) * 86_400_000)
  return { from: isoDay(from), to: isoDay(to) }
}

/**
 * GET /ads/:id/metrics — daily impressions/clicks. Real counts (home-banner
 * serves + click-throughs), flushed from Redis on a schedule, so there's a
 * short delay before a fresh impression shows up here.
 */
export function AdMetricsPanel({ adId }: { adId: string }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("30")
  const days = RANGES.find((r) => r.id === range)?.days ?? null
  // Dates are computed per render but only change once a day, so the cache key is stable.
  const { data, isFetching, isError, refetch } = useGetAdMetricsQuery({ id: adId, ...rangeParams(days) })

  return (
    <div>
      <div role="group" aria-label="Date range" className="mb-3 inline-flex border border-brand-border-light bg-card p-0.5">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            aria-pressed={range === r.id}
            className={
              "px-2.5 py-1 text-[11px] font-semibold " +
              (range === r.id ? "bg-ink-black text-brand-primary" : "text-brand-secondary/60 hover:text-brand-secondary")
            }
          >
            {r.label}
          </button>
        ))}
      </div>
      {isFetching && !data && <p className="text-xs text-brand-secondary/55">Loading metrics…</p>}
      {isError && (
        <p className="text-xs text-red-600">
          Couldn&apos;t load metrics. <button onClick={() => refetch()} className="font-bold underline">Retry</button>
        </p>
      )}
      {data && <MetricsBody data={data} />}
    </div>
  )
}

function MetricsBody({ data }: { data: NonNullable<ReturnType<typeof useGetAdMetricsQuery>["data"]> }) {
  const totals = data.totals ?? { impressions: 0, clicks: 0, ctr: 0 }
  const daily = data.daily ?? []
  return (
    <div>
      <div className="flex flex-wrap gap-6 text-xs">
        <Stat label="Impressions" value={(totals.impressions ?? 0).toLocaleString("en-IN")} />
        <Stat label="Clicks" value={(totals.clicks ?? 0).toLocaleString("en-IN")} />
        <Stat label="CTR" value={formatCtr(totals.ctr)} />
      </div>
      {daily.length === 0 ? (
        <p className="mt-3 text-xs text-brand-secondary/55">
          No impressions in this period — they appear once the ad is live and being served (counts update every few minutes).
        </p>
      ) : (
        <div className="mt-4 h-48" role="img" aria-label={`Daily impressions and clicks, ${daily.length} days`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-border-light)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="impressions" name="Impressions" stroke="var(--brand-primary-dark)" fill="var(--brand-primary)" fillOpacity={0.2} />
              <Area type="monotone" dataKey="clicks" name="Clicks" stroke="var(--brand-secondary)" fill="var(--brand-secondary)" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-secondary/55">{label}</div>
      <div className="font-serif text-lg font-bold text-brand-secondary">{value}</div>
    </div>
  )
}
