"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Eye, MessageCircle, Phone, BadgeCheck, ChevronRight, Building2, Plus, Pencil, Trash2, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Tier } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { getListingExpiry, type Listing } from "@/lib/dashboard-data"
import { useListingsStore } from "@/lib/listings-store"
import { StatusPill } from "@/components/dashboard/status-pill"
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

const TIER_QUOTA: Record<Tier, number> = { F: 0, M: 2, J: 30, V: 100 }

export function ListingsTab({ tier }: { tier: Tier }) {
  const router = useRouter()
  const allListings = useListingsStore((s) => s.listings)
  const deleteListing = useListingsStore((s) => s.deleteListing)
  const renewListing = useListingsStore((s) => s.renewListing)

  const [query, setQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<"All" | "Sponsored" | "Featured" | "Organic">("All")
  const [deletingListing, setDeletingListing] = useState<Listing | null>(null)

  const quota = TIER_QUOTA[tier]
  const listings = tier === "M" ? allListings.slice(0, 2) : allListings
  const quotaReached = tier === "M" && listings.length >= quota

  const filtered = listings
    .filter((l) => priorityFilter === "All" || l.priority === priorityFilter)
    .filter((l) => l.title.toLowerCase().includes(query.toLowerCase()) || l.location.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-secondary">My Listings</h2>
          <p className="text-sm text-brand-muted-foreground">
            {listings.length} of {quota} used · every card links to the full property page
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your listings by title or location..."
            className="w-full border border-brand-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["All", "Sponsored", "Featured", "Organic"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setPriorityFilter(f)}
              className={
                "px-3 py-2 text-xs font-bold transition-colors " +
                (priorityFilter === f
                  ? "bg-brand-secondary text-brand-primary"
                  : "border border-brand-border bg-card text-brand-secondary/65 hover:bg-brand-tertiary")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
          No listings match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l, i) => {
            const { expired } = getListingExpiry(l)
            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-sheen group overflow-hidden bg-card"
              >
                <button
                  onClick={() => router.push(ROUTES.propertyDetail(l.propertyId))}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={l.image} alt={l.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/50 to-transparent" />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <StatusPill tone={l.priority === "Sponsored" ? "warning" : l.priority === "Featured" ? "info" : "neutral"}>
                        {l.priority}
                      </StatusPill>
                      {l.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-bold text-brand-secondary">
                          <BadgeCheck className="h-3 w-3 text-brand-primary-dark" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 font-serif text-lg font-bold text-white">{l.price}</div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-brand-primary-dark">
                      <Building2 className="h-3 w-3" /> {l.type} · {l.status}
                    </div>
                    <h3 className="mt-1.5 truncate font-serif text-base font-bold text-brand-secondary">{l.title}</h3>
                    <p className="truncate text-xs text-brand-secondary/55">{l.location}</p>
                    <div className="mt-3 flex items-center gap-3 border-t border-brand-border pt-3 text-[11px] text-brand-secondary/70">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-brand-primary-dark" /> {l.views.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5 text-brand-primary-dark" /> {l.enquiries}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-brand-primary-dark" /> {l.contactsUnlocked}</span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center justify-between gap-2 border-t border-brand-border px-4 py-2.5">
                  <ExpiryBadge listing={l} />
                  <div className="flex items-center gap-1.5">
                    {expired && (
                      <button
                        type="button"
                        onClick={() => renewListing(l.id)}
                        title="Renew listing"
                        className="grid h-7 w-7 place-items-center border border-brand-border text-brand-secondary/60 hover:bg-brand-tertiary hover:text-brand-secondary"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(ROUTES.editListing(l.id))}
                      title="Edit listing"
                      className="grid h-7 w-7 place-items-center border border-brand-border text-brand-secondary/60 hover:bg-brand-tertiary hover:text-brand-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingListing(l)}
                      title="Delete listing"
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

      {tier === "M" && quotaReached && (
        <div className="flex items-center gap-2 bg-brand-tertiary p-3 text-xs text-brand-secondary/70">
          Listing limit reached.{" "}
          <button onClick={() => router.push(ROUTES.membership)} className="font-bold text-brand-primary-dark hover:underline">
            Upgrade to Jupiter for 30 listings →
          </button>
        </div>
      )}

      <AlertDialog open={!!deletingListing} onOpenChange={(open) => !open && setDeletingListing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deletingListing?.title}&rdquo; will be removed from My Listings and taken off VXP. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingListing) deleteListing(deletingListing.id)
                setDeletingListing(null)
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
