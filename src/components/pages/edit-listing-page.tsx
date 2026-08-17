"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, RotateCcw, Trash2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useNav, canSell } from "@/lib/nav-store"
import { useListingsStore, type ListingInput } from "@/lib/listings-store"
import { getListingExpiry } from "@/lib/dashboard-data"
import { ListingFormFields, listingToFormInput, isListingFormValid } from "@/components/dashboards/tabs/listing-form-fields"
import { ExpiryBadge } from "@/components/dashboards/expiry-badge"
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

export function EditListingPage({ listingId }: { listingId: string }) {
  const router = useRouter()
  const { user } = useNav()
  const listings = useListingsStore((s) => s.listings)
  const updateListing = useListingsStore((s) => s.updateListing)
  const deleteListing = useListingsStore((s) => s.deleteListing)
  const renewListing = useListingsStore((s) => s.renewListing)

  const listing = listings.find((l) => l.id === listingId)
  const [form, setForm] = useState<ListingInput | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (listing) setForm(listingToFormInput(listing))
  }, [listing])

  if (!canSell(user)) return null

  if (!listing || !form) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">Listing not found</h1>
        <p className="mt-2 text-sm text-brand-muted-foreground">
          This listing may have already been deleted.
        </p>
        <button
          onClick={() => router.push(ROUTES.dashboardTab("listings"))}
          className="btn-gold relative mt-6 overflow-hidden px-5 py-2.5 text-sm font-bold"
        >
          <span className="relative z-10">Back to My Listings</span>
        </button>
      </div>
    )
  }

  const valid = isListingFormValid(form)
  const expiry = getListingExpiry(listing)

  const handleSave = () => {
    if (!valid) return
    updateListing(listing.id, form)
    setSaved(true)
    window.setTimeout(() => router.push(ROUTES.dashboardTab("listings")), 700)
  }

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
          <ExpiryBadge listing={listing} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-primary/25 to-brand-primary/5">
            <Pencil className="h-5 w-5 text-brand-primary-dark" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-secondary">Edit listing</h1>
            <p className="text-sm text-brand-muted-foreground">
              Update the details buyers see on this listing.
            </p>
          </div>
        </div>

        <div className="card-sheen mt-6 bg-card p-6">
          <ListingFormFields form={form} setForm={setForm} />

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-brand-border pt-5">
            <button
              onClick={handleSave}
              disabled={!valid}
              className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="relative z-10">{saved ? "Saved ✓" : "Save changes"}</span>
            </button>
            <button
              onClick={() => router.push(ROUTES.dashboardTab("listings"))}
              className="border border-brand-border bg-card px-5 py-2.5 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-6 border border-red-200 bg-card p-6 dark:border-red-900/50">
          <h2 className="font-serif text-lg font-bold text-brand-secondary">Listing status</h2>
          <p className="mt-1 text-sm text-brand-muted-foreground">{expiry.label}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {expiry.expired && (
              <button
                onClick={() => renewListing(listing.id)}
                className="flex items-center gap-1.5 border border-brand-border bg-card px-4 py-2 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
              >
                <RotateCcw className="h-4 w-4" /> Renew listing
              </button>
            )}
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1.5 border border-red-200 bg-card px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" /> Delete listing
            </button>
          </div>
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
            <AlertDialogAction
              onClick={() => {
                deleteListing(listing.id)
                router.push(ROUTES.dashboardTab("listings"))
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
