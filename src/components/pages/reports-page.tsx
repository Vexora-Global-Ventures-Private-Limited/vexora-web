"use client"

import { ArrowLeft, Megaphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { AdMetricsPanel } from "@/components/ads/ad-metrics-panel"
import { BillingHistory } from "@/components/billing/billing-history"
import { AD_PRODUCT_LABEL, AD_STATUS_STYLE } from "@/components/pages/advertiser-dashboard-page"
import { useGetMyAdsQuery } from "@/store/api/adsApi"

/**
 * Real reporting surfaces only: per-ad performance (GET /ads/:id/metrics)
 * and payment receipts (GET /billing/receipts, PDF per receipt). The
 * prototype's CSV export cards were simulated downloads with no backend
 * behind them, so they're gone until a reports/export API exists.
 */
export function ReportsPage() {
  const router = useRouter()
  const { data: ads, isLoading } = useGetMyAdsQuery()
  const servedAds = (ads ?? []).filter((a) => a.status !== "draft")

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => router.push(ROUTES.dashboard)} className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-secondary">Reports</h1>
          <p className="text-sm text-brand-secondary/65">Ad performance and payment receipts</p>
        </div>

        <div className="bg-card p-6 ring-1 ring-brand-border-light">
          <h2 className="font-serif text-xl font-bold text-brand-secondary">Ad performance</h2>
          {isLoading && <p className="mt-4 text-sm text-brand-secondary/55">Loading…</p>}
          {!isLoading && servedAds.length === 0 && (
            <p className="mt-4 text-sm text-brand-secondary/55">
              No paid ads yet — performance shows up here once an ad is live.{" "}
              <button onClick={() => router.push(ROUTES.promote)} className="font-bold text-brand-primary-dark underline">Start an ad</button>
            </p>
          )}
          <div className="mt-4 space-y-4">
            {servedAds.map((ad) => {
              const style = AD_STATUS_STYLE[ad.status] ?? AD_STATUS_STYLE.draft
              return (
                <div key={ad._id} className="border border-brand-border-light p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-brand-secondary">
                      <Megaphone className="h-4 w-4 text-brand-primary-dark" />
                      {AD_PRODUCT_LABEL[ad.product] ?? ad.product}
                      {ad.targetCity ? <span className="font-normal text-brand-secondary/55">· {ad.targetCity}</span> : null}
                    </div>
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + style.bg + " " + style.text}>{style.label}</span>
                  </div>
                  <AdMetricsPanel adId={ad._id} />
                </div>
              )
            })}
          </div>
        </div>

        <BillingHistory />
      </div>
    </div>
  )
}
