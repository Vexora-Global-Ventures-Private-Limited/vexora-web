"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, ChevronRight, ChevronLeft, Building2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Tier } from "@/lib/nav-store"
import { useNav } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { formatPaise, placeholderImages, propertyTypeLabel } from "@/lib/api-mappers"
import { getApiErrorMessage } from "@/lib/api-error"
import {
  useDeleteListingMutation,
  useGetListingQuotaQuery,
  useGetMyListingsQuery,
  type Listing,
} from "@/store/api/listingsApi"
import {
  ListingStatusPill,
  LISTING_STATUS_FILTERS,
  listingStatusLabel,
  type ListingStatusFilter,
} from "@/components/listings/listing-status"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const PAGE_SIZE = 12

/** A fresh draft is auto-titled "<type> listing" by the backend — show that as untitled. */
function displayTitle(l: Listing) {
  return !l.title || l.title === `${l.propertyType} listing` ? `Untitled ${propertyTypeLabel(l.propertyType).toLowerCase()} draft` : l.title
}

/**
 * My Listings — GET /listings/mine (flat `status`, offset page/limit) plus
 * GET /listings/quota-check for the "{used} of {planQuota}" line. Lead
 * counts aren't part of this response, so cards don't show them.
 */
// `tier` stays in the signature (dashboard-page passes it) — the real
// limit now comes from quota-check, not a per-tier constant.
export function ListingsTab(_props: { tier: Tier }) {
  const router = useRouter()
  const { user } = useNav()
  const [statusFilter, setStatusFilter] = useState<ListingStatusFilter>("all")
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [deleting, setDeleting] = useState<Listing | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const skip = !user?.id
  const { data, isLoading, isError, refetch } = useGetMyListingsQuery(
    { status: statusFilter === "all" ? undefined : statusFilter, page, limit: PAGE_SIZE },
    { skip, refetchOnMountOrArgChange: true },
  )
  const { data: quota } = useGetListingQuotaQuery(undefined, { skip, refetchOnMountOrArgChange: true })
  const [deleteListing, deleteState] = useDeleteListingMutation()

  const listings = (data?.listings ?? []).filter((l) => !l.deletedAt)
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const quotaReached = !!quota && quota.remaining <= 0

  const filtered = listings.filter((l) => {
    const q = query.trim().toLowerCase()
    return !q || l.title.toLowerCase().includes(q) || [l.locality, l.city].filter(Boolean).join(" ").toLowerCase().includes(q)
  })

  const confirmDelete = async () => {
    const target = deleting
    if (!target || deleteState.isLoading) return
    setDeleting(null)
    setDeleteError(null)
    try {
      await deleteListing(target._id).unwrap()
      // Deleting the last card on a later page would leave an empty page
      // ("No listings match") — step back to the previous one instead.
      if (listings.length === 1 && page > 1) setPage((p) => p - 1)
    } catch (err) {
      setDeleteError(getApiErrorMessage(err) ?? "Couldn't delete this listing.")
    }
  }

  if (skip) {
    return (
      <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
        My Listings is available for signed-in accounts. Sign in with your phone or email to manage real listings.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-secondary">My Listings</h2>
          <p className="text-sm text-brand-muted-foreground">
            {quota ? `${quota.used} of ${quota.planQuota} listing slots used` : "Your drafts and published listings"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push(ROUTES.properties)}
            className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            Browse all listings <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => router.push(ROUTES.newListing)}
            disabled={quotaReached}
            className="btn-gold relative flex items-center gap-1.5 overflow-hidden px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Listing
            </span>
          </button>
        </div>
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this page by title or location..."
            aria-label="Search your listings on this page"
            className="w-full border border-brand-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {LISTING_STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={statusFilter === f}
              onClick={() => {
                setStatusFilter(f)
                setPage(1)
              }}
              className={
                "px-3 py-2 text-xs font-bold transition-colors " +
                (statusFilter === f
                  ? "bg-brand-secondary text-brand-primary"
                  : "border border-brand-border bg-card text-brand-secondary/65 hover:bg-brand-tertiary")
              }
            >
              {listingStatusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {deleteError && <p className="text-xs font-semibold text-red-500">{deleteError}</p>}

      {isLoading ? (
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">Loading your listings…</div>
      ) : isError ? (
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
          Couldn&apos;t load your listings.{" "}
          <button onClick={() => refetch()} className="font-bold text-brand-primary-dark underline">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
          {total === 0 && statusFilter === "all" ? (
            <>
              You haven&apos;t listed anything yet.{" "}
              <button onClick={() => router.push(ROUTES.newListing)} className="font-bold text-brand-primary-dark underline">
                Post your first property
              </button>
            </>
          ) : (
            "No listings match this filter."
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l, i) => {
            const isDraft = l.status === "draft"
            const isLive = l.status === "live"
            const image = placeholderImages(l.propertyType, l._id)[0]
            return (
              <motion.div
                key={l._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-sheen group overflow-hidden bg-card"
              >
                <button
                  onClick={() => router.push(isLive ? ROUTES.propertyDetail(l.slug) : ROUTES.editListing(l._id))}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/50 to-transparent" />
                    <div className="absolute left-3 top-3 rounded-full bg-card/95 px-2 py-0.5">
                      <ListingStatusPill status={l.status} />
                    </div>
                    <div className="absolute bottom-3 left-3 font-serif text-lg font-bold text-white">{formatPaise(l.pricePaise)}</div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-brand-primary-dark">
                      <Building2 className="h-3 w-3" /> {propertyTypeLabel(l.propertyType)} · {l.purpose === "rent" ? "Rent" : "Sale"}
                      {l.bhk ? ` · ${l.bhk} BHK` : ""}
                    </div>
                    <h3 className="mt-1.5 truncate font-serif text-base font-bold text-brand-secondary">{displayTitle(l)}</h3>
                    <p className="truncate text-xs text-brand-secondary/55">
                      {[l.locality, l.city].filter(Boolean).join(", ") || "Location not added yet"}
                    </p>
                    {isDraft && (
                      <div className="mt-3 border-t border-brand-border pt-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-brand-secondary/60">
                          <span>Step {Math.min(l.wizardStep, 5)} of 5</span>
                          <span className="text-brand-primary-dark">Continue →</span>
                        </div>
                        <div className="mt-1.5 h-1 bg-brand-tertiary">
                          <div className="h-1 bg-brand-primary" style={{ width: `${(Math.min(l.wizardStep, 5) / 5) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {l.status === "rejected" && l.rejectionReason && (
                      <p className="mt-3 border-t border-brand-border pt-3 text-[11px] text-red-600">{l.rejectionReason}</p>
                    )}
                  </div>
                </button>

                <div className="flex items-center justify-between gap-2 border-t border-brand-border px-4 py-2.5">
                  <span className="text-[11px] text-brand-secondary/50">
                    {l.expiresAt && isLive
                      ? `Expires ${new Date(l.expiresAt).toLocaleDateString("en-IN")}`
                      : `Updated ${new Date(l.updatedAt).toLocaleDateString("en-IN")}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isLive && (
                      <button
                        type="button"
                        onClick={() => router.push(ROUTES.propertyDetail(l.slug))}
                        title="View public page"
                        aria-label={`View public page: ${displayTitle(l)}`}
                        className="grid h-7 w-7 place-items-center border border-brand-border text-brand-secondary/60 hover:bg-brand-tertiary hover:text-brand-secondary"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(ROUTES.editListing(l._id))}
                      title={isDraft ? "Continue editing" : "View details"}
                      aria-label={`${isDraft ? "Continue editing" : "View details"}: ${displayTitle(l)}`}
                      className="grid h-7 w-7 place-items-center border border-brand-border text-brand-secondary/60 hover:bg-brand-tertiary hover:text-brand-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(l)}
                      title={isDraft ? "Discard draft" : "Delete listing"}
                      aria-label={`${isDraft ? "Discard draft" : "Delete listing"}: ${displayTitle(l)}`}
                      disabled={deleteState.isLoading}
                      className="grid h-7 w-7 place-items-center border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs font-bold text-brand-secondary">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 border border-brand-border px-3 py-1.5 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 border border-brand-border px-3 py-1.5 disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {quotaReached && (
        <div className="flex flex-wrap items-center gap-2 bg-brand-tertiary p-3 text-xs text-brand-secondary/70">
          Listing limit reached — delete a listing you no longer need, or{" "}
          <button onClick={() => router.push(ROUTES.membership)} className="font-bold text-brand-primary-dark hover:underline">
            upgrade for more listing slots →
          </button>
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleting ? displayTitle(deleting) : ""}&rdquo; will be removed from My Listings and taken off VXP. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteState.isLoading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
