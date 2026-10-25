"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { formatPaise, propertyTypeLabel } from "@/lib/api-mappers"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { useDeleteListingMutation, useGetListingQuery } from "@/store/api/listingsApi"
import { ListingWizard } from "@/components/listings/listing-wizard"
import { ListingStatusPill, LISTING_STATUS_HINT } from "@/components/listings/listing-status"
import { DemoAccountNotice } from "@/components/pages/add-listing-page"
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

/**
 * A draft resumes in the wizard at its own wizardStep. Anything past draft
 * (pending_review / live / rejected / expired) can't be edited — the backend
 * answers 409 — so it gets a read-only summary instead of the wizard.
 */
export function EditListingPage({ listingId }: { listingId: string }) {
  const router = useRouter()
  const { user } = useNav()
  const isListingId = /^[a-f0-9]{24}$/i.test(listingId)
  const { data: listing, isLoading, isFetching, error, refetch } = useGetListingQuery(listingId, {
    skip: !user?.id || !isListingId,
    // Always re-read on open — the draft may have moved on in another tab.
    refetchOnMountOrArgChange: true,
  })
  const [deleteListing, deleteState] = useDeleteListingMutation()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  if (!user) return null

  const header = (
    <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
        <button
          onClick={() => router.push(ROUTES.dashboardTab("listings"))}
          className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to my listings
        </button>
        {listing && <ListingStatusPill status={listing.status} />}
      </div>
    </header>
  )

  if (!user.id) {
    return (
      <div className="min-h-screen bg-card">
        {header}
        <div className="mx-auto max-w-3xl px-6 py-8"><DemoAccountNotice /></div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-card">
        {header}
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-brand-muted-foreground">Loading listing…</div>
      </div>
    )
  }

  const code = getApiErrorCode(error)
  // No code = network failure / 5xx — that's not "not found", offer a retry.
  if (isListingId && error && (!code || code === "INTERNAL")) {
    return (
      <div className="min-h-screen bg-card">
        {header}
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <h1 className="font-serif text-2xl font-bold text-brand-secondary">Couldn&apos;t load this listing</h1>
          <p className="mt-2 text-sm text-brand-muted-foreground">Check your connection and try again.</p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-gold relative mt-6 overflow-hidden px-5 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            <span className="relative z-10">{isFetching ? "Retrying…" : "Retry"}</span>
          </button>
        </div>
      </div>
    )
  }

  // Deleted listings stay readable (and even editable) via the API, so the
  // deletedAt check here is what keeps them out of the wizard.
  if (!isListingId || !listing || listing.deletedAt) {
    return (
      <div className="min-h-screen bg-card">
        {header}
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <h1 className="font-serif text-2xl font-bold text-brand-secondary">
            {code === "FORBIDDEN" ? "This isn't your listing" : listing?.deletedAt ? "This listing was deleted" : "Listing not found"}
          </h1>
          <p className="mt-2 text-sm text-brand-muted-foreground">
            {code === "FORBIDDEN" ? "Only the seller who created it can open it here." : "It's no longer in your listings."}
          </p>
          <button
            onClick={() => router.push(ROUTES.dashboardTab("listings"))}
            className="btn-gold relative mt-6 overflow-hidden px-5 py-2.5 text-sm font-bold"
          >
            <span className="relative z-10">Back to My Listings</span>
          </button>
        </div>
      </div>
    )
  }

  const isDraft = listing.status === "draft"

  const confirmDelete = async () => {
    if (deleteState.isLoading) return
    setDeleteError(null)
    try {
      const deleted = await deleteListing(listing._id).unwrap()
      // Delete never touches `status` — deletedAt is the confirmation.
      if (deleted.deletedAt) router.push(ROUTES.dashboardTab("listings"))
      else setDeleteError("The listing wasn't deleted. Please try again.")
    } catch (err) {
      setDeleteError(getApiErrorMessage(err) ?? "Couldn't delete this listing.")
    }
  }

  return (
    <div className="min-h-screen bg-card">
      {header}

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-primary/25 to-brand-primary/5">
            <Pencil className="h-5 w-5 text-brand-primary-dark" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-secondary">
              {isDraft ? "Finish your listing" : listing.title}
            </h1>
            <p className="text-sm text-brand-muted-foreground">
              {isDraft ? "Pick up where you left off — every step is saved." : LISTING_STATUS_HINT[listing.status] ?? ""}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {isDraft ? (
            <ListingWizard draft={listing} />
          ) : (
            <div className="card-sheen bg-card p-6">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <Item label="Type" value={`${propertyTypeLabel(listing.propertyType)} · ${listing.purpose === "rent" ? "Rent" : "Sale"}`} />
                <Item label={listing.purpose === "rent" ? "Rent" : "Price"} value={formatPaise(listing.pricePaise)} />
                {listing.bhk ? <Item label="BHK" value={`${listing.bhk} BHK`} /> : null}
                <Item label="Area" value={listing.areaSqft ? `${listing.areaSqft.toLocaleString("en-IN")} sq.ft` : "—"} />
                <Item label="Location" value={[listing.subLocality, listing.locality, listing.city, listing.state].filter(Boolean).join(", ") || "—"} />
                {listing.expiresAt && <Item label="Expires" value={new Date(listing.expiresAt).toLocaleDateString("en-IN")} />}
              </dl>
              {listing.status === "rejected" && (
                <p className="mt-4 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {listing.rejectionReason ? `Rejection reason: ${listing.rejectionReason}` : "Our team didn't approve this listing."}{" "}
                  Rejected listings can&apos;t be edited — delete it and post a corrected one.
                </p>
              )}
              {listing.status === "live" && (
                <button
                  onClick={() => router.push(ROUTES.propertyDetail(listing.slug))}
                  className="mt-5 flex items-center gap-1.5 text-sm font-bold text-brand-primary-dark hover:text-brand-secondary"
                >
                  View public page <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 border border-red-200 bg-card p-6 dark:border-red-900/50">
          <h2 className="font-serif text-lg font-bold text-brand-secondary">{isDraft ? "Discard draft" : "Delete listing"}</h2>
          <p className="mt-1 text-sm text-brand-muted-foreground">
            {isDraft ? "Removes this unfinished draft." : "Takes it off VXP and frees up a listing slot."}
          </p>
          <button
            onClick={() => setDeleteOpen(true)}
            disabled={deleteState.isLoading}
            className="mt-4 flex items-center gap-1.5 border border-red-200 bg-card px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-4 w-4" /> {deleteState.isLoading ? "Deleting…" : isDraft ? "Discard draft" : "Delete listing"}
          </button>
          {deleteError && <p className="mt-3 text-xs font-semibold text-red-500">{deleteError}</p>}
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{listing.title}&rdquo; will be removed from My Listings and taken off VXP. This can&apos;t be undone.
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

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold text-brand-secondary">{value}</dd>
    </div>
  )
}
