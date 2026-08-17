"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useNav, canSell } from "@/lib/nav-store"
import { useListingsStore, type ListingInput } from "@/lib/listings-store"
import { ListingFormFields, emptyListingForm, isListingFormValid } from "@/components/dashboards/tabs/listing-form-fields"

/** Full-page "Add a listing" flow — same shared field set as the editor
 *  (see /listings/[id]/edit), so nothing about a self-added listing is left
 *  out that the public property page would otherwise show as blank. */
export function AddListingPage() {
  const router = useRouter()
  const { user } = useNav()
  const addListing = useListingsStore((s) => s.addListing)

  const [form, setForm] = useState<ListingInput>(emptyListingForm)
  const [saving, setSaving] = useState(false)

  if (!canSell(user)) return null

  const valid = isListingFormValid(form)

  const handleSubmit = () => {
    if (!valid || saving) return
    setSaving(true)
    const listing = addListing(form)
    router.push(ROUTES.propertyDetail(listing.propertyId))
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
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-primary/25 to-brand-primary/5">
            <Home className="h-5 w-5 text-brand-primary-dark" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-secondary">Add a listing</h1>
            <p className="text-sm text-brand-muted-foreground">
              Fill in the details buyers will see on the property page — the more complete this is, the more trust it earns.
            </p>
          </div>
        </div>

        <div className="card-sheen mt-6 bg-card p-6">
          <ListingFormFields form={form} setForm={setForm} />

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-brand-border pt-5">
            <button
              onClick={handleSubmit}
              disabled={!valid || saving}
              className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="relative z-10">{saving ? "Publishing…" : "Publish listing"}</span>
            </button>
            <button
              onClick={() => router.push(ROUTES.dashboardTab("listings"))}
              className="border border-brand-border bg-card px-5 py-2.5 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
