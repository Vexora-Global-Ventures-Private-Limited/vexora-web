"use client"

import { Fragment, useMemo, useState, useSyncExternalStore } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft, Plus, Megaphone, Clock, Wallet, Pause, Play, ArrowUpRight, LayoutPanelTop,
  Building2, Crown, TrendingUp, AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { formatPaise } from "@/lib/api-mappers"
import { getApiErrorMessage } from "@/lib/api-error"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import { AdMetricsPanel, formatCtr } from "@/components/ads/ad-metrics-panel"
import { PhotoLightbox } from "@/components/site/photo-lightbox"
import { getRememberedCreative, type StoredCreative } from "@/lib/ad-creatives"
import { usePendingOrder, adPendingKey } from "@/hooks/use-checkout"
import {
  useGetMyAdsQuery,
  usePauseAdMutation,
  useResumeAdMutation,
  useResubmitAdMutation,
  useGetAdMetricsQuery,
  useGetHomeBannerQuery,
  type Ad,
  type AdProduct,
} from "@/store/api/adsApi"

export const AD_STATUS_STYLE: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  pending_payment: { label: "Awaiting payment", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  pending_review: { label: "Under review", bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  active: { label: "Live", bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  paused: { label: "Paused", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  completed: { label: "Completed", bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  expired: { label: "Expired", bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
}

export const AD_PRODUCT_LABEL: Record<AdProduct, string> = {
  banner: "Home Banner",
  sponsored: "Sponsored Listing",
  featured: "Featured Developer",
  project_promotion: "Project Promotion",
}

const productIcons: Record<AdProduct, typeof LayoutPanelTop> = {
  banner: LayoutPanelTop,
  sponsored: Crown,
  featured: Building2,
  project_promotion: Play,
}

// Spend counts only ads that got past payment.
const PAID_STATUSES = new Set(["pending_review", "active", "paused", "completed", "expired", "rejected"])

const formatDate = (iso: string | undefined, opts: Intl.DateTimeFormatOptions) => {
  const d = iso ? new Date(iso) : null
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-IN", opts) : ""
}

/** GET /ads/mine with live status, pause/resume, free resubmit after rejection, per-ad metrics. */
export function AdvertiserDashboard() {
  const router = useRouter()
  const { data: ads, isLoading, isError, refetch } = useGetMyAdsQuery()
  const [expanded, setExpanded] = useState<string | null>(null)

  const list = ads ?? []
  const liveAds = list.filter((a) => a.status === "active").length
  const inReview = list.filter((a) => a.status === "pending_review").length
  const totalSpendPaise = list.filter((a) => PAID_STATUSES.has(a.status)).reduce((s, a) => s + (a.amountPaise ?? 0), 0)

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => router.push(ROUTES.dashboard)} className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(ROUTES.reports)} className="border border-brand-border-light bg-card px-4 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-surface">
              Reports
            </button>
            <button onClick={() => router.push(ROUTES.promote)} className="btn-gold relative overflow-hidden px-4 py-2 text-xs font-bold">
              <span className="relative z-10 flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> New Ad</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold text-brand-secondary">Advertiser Dashboard</h1>
          <p className="text-sm text-brand-secondary/65">Track ad status, impressions, clicks &amp; performance</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Live Ads", value: liveAds, icon: Megaphone },
            { label: "Under Review", value: inReview, icon: Clock },
            { label: "Total Ads", value: list.length, icon: TrendingUp },
            { label: "Total Spend", value: Math.round(totalSpendPaise / 100), prefix: "₹ ", separator: ",", icon: Wallet },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-card p-5 ring-1 ring-brand-border-light"
            >
              <div className="grid h-10 w-10 place-items-center bg-brand-surface">
                <kpi.icon className="h-5 w-5 text-brand-primary-dark" />
              </div>
              <div className="mt-3 font-serif text-3xl font-bold text-brand-secondary">
                <AnimatedCounter to={kpi.value} prefix={kpi.prefix} separator={kpi.separator} duration={1.2} />
              </div>
              <div className="text-xs uppercase tracking-wide text-brand-secondary/55">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Ads table */}
        <div className="mt-6 bg-card p-6 ring-1 ring-brand-border-light">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-brand-secondary">All Advertisements</h3>
            <span className="text-xs text-brand-secondary/55">{list.length} total</span>
          </div>
          {isLoading && <p className="mt-4 text-sm text-brand-secondary/55">Loading your ads…</p>}
          {isError && (
            <p className="mt-4 text-sm text-red-600">
              Couldn&apos;t load your ads. <button onClick={() => refetch()} className="font-bold underline">Retry</button>
            </p>
          )}
          {!isLoading && !isError && list.length === 0 && (
            <div className="mt-4 border border-dashed border-brand-border p-8 text-center text-sm text-brand-secondary/55">
              No ads yet — start one to reach buyers across VXP.
            </div>
          )}
          {list.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-surface">
                  <tr className="text-[10px] font-bold uppercase tracking-wide text-brand-secondary/55">
                    <th className="px-4 py-3 text-left">Ad</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-right">Impr.</th>
                    <th className="px-4 py-3 text-right">Clicks</th>
                    <th className="px-4 py-3 text-right">CTR</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-light">
                  {list.map((ad) => (
                    <AdRow
                      key={ad._id}
                      ad={ad}
                      expanded={expanded === ad._id}
                      onToggle={() => setExpanded(expanded === ad._id ? null : ad._id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-6 flex items-center justify-between bg-gradient-to-br from-ink-black to-ink-deep p-6 text-white">
          <div>
            <h3 className="font-serif text-lg font-bold">Ready to launch a new ad?</h3>
            <p className="text-xs text-white/65">Pick a type and package, pay — it goes live after admin approval</p>
          </div>
          <button onClick={() => router.push(ROUTES.promote)} className="btn-gold relative overflow-hidden px-5 py-3 text-sm font-bold">
            <span className="relative z-10 flex items-center gap-2">Start new ad <ArrowUpRight className="h-4 w-4" /></span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Products whose ad carries an uploaded image.
const AD_HAS_CREATIVE: Record<string, boolean> = { banner: true, project_promotion: true }

const subscribeNoop = () => () => {}

/**
 * The ad's image + link: what this device remembered at upload time, else
 * the live home banner when it's this ad. The API doesn't return creatives
 * to the owner (UNRESOLVED-ISSUES #25).
 */
function useAdCreative(ad: Ad): StoredCreative | null {
  const { data: served } = useGetHomeBannerQuery(undefined, { skip: ad.product !== "banner" })
  const rememberedRaw = useSyncExternalStore(
    subscribeNoop,
    () => JSON.stringify(getRememberedCreative(ad._id)),
    () => "null",
  )
  const remembered = useMemo(() => JSON.parse(rememberedRaw) as StoredCreative | null, [rememberedRaw])
  if (remembered) return remembered
  if (served?.id === ad._id && served.imageUrl) return { imageUrl: served.imageUrl, targetUrl: served.targetUrl }
  return null
}

function AdRow({ ad, expanded, onToggle }: { ad: Ad; expanded: boolean; onToggle: () => void }) {
  const Icon = productIcons[ad.product] ?? Megaphone
  const style = AD_STATUS_STYLE[ad.status] ?? AD_STATUS_STYLE.draft
  // Impressions/clicks are only counted once an ad is served — skip drafts.
  const { data: metrics } = useGetAdMetricsQuery({ id: ad._id }, { skip: ad.status === "draft" })
  const [pauseAd, { isLoading: pausing }] = usePauseAdMutation()
  const [resumeAd, { isLoading: resuming }] = useResumeAdMutation()
  const [resubmitAd, { isLoading: resubmitting }] = useResubmitAdMutation()
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState(false)
  const router = useRouter()
  const creative = useAdCreative(ad)
  // An ad stays "draft" until its payment captures, so a paid-but-confirming
  // ad would otherwise look unpaid here. Remembered by the checkout on this device.
  const pendingOrder = usePendingOrder(ad.status === "draft" ? adPendingKey(ad._id) : undefined)
  const created = formatDate(ad.createdAt, { day: "numeric", month: "short" })
  const subtitle = [ad.targetCity ?? (ad.product === "banner" ? "All of India" : ""), created ? `created ${created}` : ""]
    .filter(Boolean)
    .join(" · ")

  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "That didn't work. Please try again.")
    }
  }

  return (
    <Fragment>
      <tr className="hover:bg-brand-surface/40">
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            {creative ? (
              <button
                type="button"
                onClick={() => setViewing(true)}
                aria-label="View ad image"
                className="group relative h-12 w-20 shrink-0 overflow-hidden bg-ink-black ring-1 ring-brand-border hover:ring-brand-primary"
              >
                <img src={creative.imageUrl} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </button>
            ) : (
              <div
                className="grid h-12 w-20 shrink-0 place-items-center bg-gradient-to-br from-brand-primary to-brand-primary-dark"
                title={AD_HAS_CREATIVE[ad.product] ? "Image not available on this device — the API doesn't return ad images yet" : undefined}
              >
                <Icon className="h-4 w-4 text-brand-secondary" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-brand-secondary">{AD_PRODUCT_LABEL[ad.product] ?? ad.product}</div>
              <div className="text-[10px] text-brand-secondary/55">{subtitle}</div>
              {creative?.targetUrl ? (
                <a href={creative.targetUrl} target="_blank" rel="noopener noreferrer" className="block max-w-[220px] truncate text-[10px] text-brand-primary-dark hover:underline" title={creative.targetUrl}>
                  → {creative.targetUrl.replace(/^https:\/\//, "")}
                </a>
              ) : creative ? (
                <div className="text-[10px] text-amber-600">No click-through link</div>
              ) : null}
            </div>
          </div>
          {viewing && creative && (
            <PhotoLightbox images={[creative.imageUrl]} index={0} onIndexChange={() => {}} onClose={() => setViewing(false)} title={AD_PRODUCT_LABEL[ad.product] ?? "Ad"} />
          )}
        </td>
        <td className="px-4 py-3 text-brand-secondary/65">{ad.amountPaise ? formatPaise(ad.amountPaise) : "—"}</td>
        <td className="px-4 py-3 text-right font-bold text-brand-secondary">{metrics ? metrics.totals.impressions.toLocaleString("en-IN") : "—"}</td>
        <td className="px-4 py-3 text-right font-bold text-brand-secondary">{metrics ? metrics.totals.clicks.toLocaleString("en-IN") : "—"}</td>
        <td className="px-4 py-3 text-right font-bold text-brand-primary-dark">{metrics ? formatCtr(metrics.totals.ctr) : "—"}</td>
        <td className="px-4 py-3">
          <span className={"inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold " + style.bg + " " + style.text}>
            <span className={"h-1.5 w-1.5 rounded-full " + style.dot} />
            {pendingOrder ? "Payment confirming" : style.label}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {ad.status === "active" && (
              <button
                onClick={() => run(() => pauseAd(ad._id).unwrap())}
                disabled={pausing}
                className="grid h-7 w-7 disabled:opacity-40 place-items-center rounded bg-brand-surface text-brand-primary-dark hover:bg-gold-100"
                aria-label="Pause ad"
                title="Pause ad"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            )}
            {ad.status === "paused" && (
              <button
                onClick={() => run(() => resumeAd(ad._id).unwrap())}
                disabled={resuming}
                className="grid h-7 w-7 disabled:opacity-40 place-items-center rounded bg-brand-surface text-brand-primary-dark hover:bg-gold-100"
                aria-label="Resume ad"
                title="Resume ad"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            )}
            {ad.status === "rejected" && (
              <button
                onClick={() => run(() => resubmitAd({ id: ad._id }).unwrap())}
                disabled={resubmitting}
                className="whitespace-nowrap rounded bg-ink-black disabled:opacity-40 px-2.5 py-1.5 text-[10px] font-bold text-brand-primary hover:bg-ink-deep"
              >
                {resubmitting ? "Resubmitting…" : "Resubmit free"}
              </button>
            )}
            {ad.status === "draft" && (
              <button
                onClick={() => router.push(`${ROUTES.promote}?ad=${ad._id}`)}
                className="whitespace-nowrap rounded bg-ink-black px-2.5 py-1.5 text-[10px] font-bold text-brand-primary hover:bg-ink-deep"
              >
                {pendingOrder ? "Check payment" : "Continue"}
              </button>
            )}
            {ad.status !== "draft" && (
              <button
                onClick={onToggle}
                className="grid h-7 w-7 place-items-center rounded bg-brand-surface text-brand-primary-dark hover:bg-gold-100"
                aria-label="View daily metrics"
                title="View daily metrics"
              >
                <TrendingUp className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {ad.status === "draft" && (
        <tr>
          <td colSpan={7} className="bg-brand-surface/50 px-4 py-2 text-[11px] text-brand-secondary/60">
            {pendingOrder
              ? "Payment is being confirmed — the ad goes to review once it is. Don't pay again."
              : "Unpaid draft — continue to finish checkout."}
          </td>
        </tr>
      )}
      {ad.status === "rejected" && ad.rejectionReason && (
        <tr>
          <td colSpan={7} className="bg-red-50/60 px-4 py-2.5 text-[11px] text-red-700">
            <b>Rejection reason:</b> {ad.rejectionReason} — resubmitting is free, no additional payment. Fix the
            issue first: resubmitting sends the same ad back to review.
          </td>
        </tr>
      )}
      {error && (
        <tr>
          <td colSpan={7} className="px-4 py-2 text-[11px] font-semibold text-red-600">
            <AlertCircle className="mr-1 inline h-3 w-3" /> {error}
          </td>
        </tr>
      )}
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-brand-surface/40 px-4 py-4">
            <AdMetricsPanel adId={ad._id} />
          </td>
        </tr>
      )}
    </Fragment>
  )
}
