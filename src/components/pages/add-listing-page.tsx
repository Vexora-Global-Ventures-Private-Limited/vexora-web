"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { useGetListingQuotaQuery } from "@/store/api/listingsApi"
import { ListingWizard } from "@/components/listings/listing-wizard"

/**
 * "Post a property" — starts a brand-new draft via the real wizard. Any
 * signed-in account can draft (a Free user only hits the membership gate at
 * submit, which is the upsell moment), so this isn't tier-gated.
 */
export function AddListingPage() {
  const router = useRouter()
  const { user } = useNav()
  const { data: quota, isLoading: quotaLoading } = useGetListingQuotaQuery(undefined, {
    skip: !user?.id,
    refetchOnMountOrArgChange: true,
  })

  if (!user) return null

  return (
    <div className="min-h-screen bg-card">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <button
            onClick={() => router.push(ROUTES.dashboardTab("listings"))}
            className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to my listings
          </button>
          {quota && (
            <span className="hidden text-xs font-semibold text-brand-muted-foreground sm:inline">
              {quota.used} of {quota.planQuota} listing slots used
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-primary/25 to-brand-primary/5">
            <Home className="h-5 w-5 text-brand-primary-dark" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-secondary">Post a property</h1>
            <p className="text-sm text-brand-muted-foreground">
              Five quick steps. Each one is saved as you go — you can leave and finish later from My Listings.
            </p>
          </div>
        </div>

        <div className="mt-6">
          {!user.id ? (
            <DemoAccountNotice />
          ) : quotaLoading ? (
            // Don't flash the wizard and then swap it for the limit notice.
            <div className="card-sheen h-64 animate-pulse bg-card" aria-busy="true" aria-label="Loading" />
          ) : quota && quota.remaining <= 0 ? (
            <QuotaReached planQuota={quota.planQuota} />
          ) : (
            <ListingWizard />
          )}
        </div>
      </div>
    </div>
  )
}

export function DemoAccountNotice() {
  const router = useRouter()
  return (
    <div className="card-sheen bg-card p-8 text-center">
      <p className="text-sm text-brand-secondary/70">
        This is a demo session. Sign in with your phone number or email to post a real listing.
      </p>
      <button onClick={() => router.push(ROUTES.login)} className="btn-gold relative mt-5 overflow-hidden px-6 py-2.5 text-sm font-bold">
        <span className="relative z-10">Sign in</span>
      </button>
    </div>
  )
}

/** remaining === 0 — the backend has no options[] menu, so the choices are spelled out here. */
export function QuotaReached({ planQuota }: { planQuota: number }) {
  const router = useRouter()
  return (
    <div className="bg-brand-tertiary p-6 text-sm text-brand-secondary/75">
      <p className="font-serif text-lg font-bold text-brand-secondary">You&apos;ve used all {planQuota} listing slots on your plan</p>
      <p className="mt-1">To add another listing, either:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>delete a listing you no longer need, or</li>
        <li>upgrade your membership for a higher listing limit.</li>
      </ul>
      <div className="mt-5 flex flex-wrap gap-3">
        <button onClick={() => router.push(ROUTES.membership)} className="btn-gold relative overflow-hidden px-5 py-2 text-xs font-bold">
          <span className="relative z-10">Upgrade membership</span>
        </button>
        <button
          onClick={() => router.push(ROUTES.dashboardTab("listings"))}
          className="border border-brand-border bg-card px-5 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-surface"
        >
          Manage my listings
        </button>
      </div>
    </div>
  )
}
