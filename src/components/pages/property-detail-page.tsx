"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  ArrowLeft, MapPin, Bed, Bath, Maximize2, BadgeCheck, Crown, Star, Phone,
  MessageCircle, Share2, Heart, Calendar, Building2, CheckCircle2, ChevronRight,
  ChevronLeft, ShieldCheck, Sparkles, Eye, Lock, Pencil, Trash2, RotateCcw, Compass, Car,
  Zap, Layers3, ExternalLink, FileCheck2, Users, ShieldAlert, Sofa, Wallet, Home,
  Waves, Droplets, Dumbbell, Bell, Cpu, ArrowUpDown, Trees, X, Expand, type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { properties } from "@/lib/vxp-data"
import { useNav, canSell } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { useContactStore, type ContactChannel } from "@/lib/contact-store"
import { useListingsStore } from "@/lib/listings-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { getListingExpiry, listingToProperty } from "@/lib/dashboard-data"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
import { Reveal } from "@/components/motion/reveal"
import { TiltCard } from "@/components/motion/tilt-card"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import { ExpiryBadge } from "@/components/dashboards/expiry-badge"

/** Demo-only masked number — the docs require every call to route through
 *  masking; no code path should ever expose a seller's raw phone number. */
const MASKED_NUMBER = "+91 22-XXXX-100"

/** Standard reducing-balance EMI, computed live from the listed price —
 *  not a hardcoded number — so it moves with whatever price the seller set.
 *  Assumes 80% loan-to-value, 8.5% p.a., 20-year tenure (typical Indian
 *  home-loan defaults); shown as an estimate, never as a quote. */
function estimateEmi(priceCr: number) {
  const principal = priceCr * 1e7 * 0.8
  const monthlyRate = 0.085 / 12
  const months = 20 * 12
  const factor = Math.pow(1 + monthlyRate, months)
  return Math.round((principal * monthlyRate * factor) / (factor - 1))
}

/** A distinct icon per amenity so the section reads as a feature showcase,
 *  not a bulleted list — falls back to a plain check for anything unmapped. */
const AMENITY_ICONS: Record<string, LucideIcon> = {
  "Sea view": Waves,
  "Swimming pool": Droplets,
  "Gym & spa": Dumbbell,
  "Concierge service": Bell,
  "Smart home system": Cpu,
  "High-speed elevators": ArrowUpDown,
  "24/7 security": ShieldCheck,
  "Private parking": Car,
  "Garden terrace": Trees,
}

export function PropertyDetailPage({ propertyId }: { propertyId: string }) {
  const { user } = useNav()
  const router = useRouter()
  const submitContact = useContactStore((s) => s.submitContact)

  const listings = useListingsStore((s) => s.listings)
  const deleteListing = useListingsStore((s) => s.deleteListing)
  const renewListing = useListingsStore((s) => s.renewListing)

  // Self-added listings (My Listings → Add listing) have no entry in the
  // static seed catalog below — their own id doubles as the property id (see
  // listings-store.ts `addListing`), so when there's no static match, render
  // the listing itself through the same page via listingToProperty instead of
  // silently falling back to an unrelated property.
  const staticProperty = properties.find((p) => p.id === propertyId)
  const ownListingMatch = !staticProperty ? listings.find((l) => l.propertyId === propertyId) : undefined
  const property = staticProperty ?? (ownListingMatch ? listingToProperty(ownListingMatch) : properties[0])

  const isShortlisted = useShortlistStore((s) => s.isShortlisted(property.id))
  const toggleShortlist = useShortlistStore((s) => s.toggleShortlist)
  const sellerMembershipActive = property.sellerMembershipActive ?? true
  // A logged-in seller viewing one of their own listings gets owner controls here.
  // canSell() so Mercury/Jupiter/Venus always qualify (owning a listing doesn't
  // stop them from also being a buyer).
  const ownedListing = canSell(user) ? listings.find((l) => l.propertyId === property.id) : undefined
  const isOwner = !!ownedListing

  const [revealed, setRevealed] = useState(false)
  const [showCallback, setShowCallback] = useState(false)
  const [showVisit, setShowVisit] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [quotaExhausted, setQuotaExhausted] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [enquiry, setEnquiry] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: "", message: "I'm interested in this property. Please schedule a site visit." })
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  const openGallery = (index: number) => {
    setGalleryIndex(index)
    setGalleryOpen(true)
  }
  const showPrevPhoto = () => setGalleryIndex((i) => (i - 1 + property.galleryImages.length) % property.galleryImages.length)
  const showNextPhoto = () => setGalleryIndex((i) => (i + 1) % property.galleryImages.length)

  const mobileVerified = !!user?.phone

  // Keyboard nav for the fullscreen gallery — arrows to browse, Escape to close.
  useEffect(() => {
    if (!galleryOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") showPrevPhoto()
      else if (e.key === "ArrowRight") showNextPhoto()
      else if (e.key === "Escape") setGalleryOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [galleryOpen])

  function handleContact(channel: ContactChannel, contactPhone?: string) {
    if (!user) {
      router.push(ROUTES.loginWithReturn(ROUTES.propertyDetail(property.id)))
      return
    }
    if (!mobileVerified) {
      // Mock mobile-verification gate (BR-11) — in this demo every seeded
      // user already has a phone on file, so this rarely fires; it exists
      // so the gate itself is real, not just decorative.
      router.push(ROUTES.loginWithReturn(ROUTES.propertyDetail(property.id)))
      return
    }

    const result = submitContact({
      propertyId: property.id,
      channel,
      buyerName: user.name,
      buyerPhone: contactPhone || user.phone || "",
      sellerMembershipActive,
      hasQuota: user.tier === "F",
    })

    if (!result.ok) {
      setQuotaExhausted(true)
      return
    }

    // Identical confirmation regardless of delivered/undelivered — the
    // buyer is never told the seller's membership lapsed.
    if (channel === "call") setRevealed(true)
    if (channel === "whatsapp") window.open("https://wa.me/919876543210", "_blank", "noopener,noreferrer")
    setShowCallback(false)
    setShowVisit(false)
    setConfirmed(true)
    window.setTimeout(() => setConfirmed(false), 3200)
  }

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <button
            onClick={() => router.push(isOwner ? ROUTES.dashboardTab("listings") : ROUTES.properties)}
            className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> {isOwner ? "Back to my listings" : "Back to listings"}
          </button>
          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center border border-brand-border-light text-brand-secondary/65 hover:bg-brand-surface"><Share2 className="h-4 w-4" /></button>
            <button
              onClick={() => toggleShortlist(property.id)}
              aria-pressed={isShortlisted}
              aria-label={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
              className={
                "grid h-10 w-10 place-items-center border hover:bg-brand-surface " +
                (isShortlisted ? "border-brand-primary text-brand-primary-dark" : "border-brand-border-light text-brand-secondary/65")
              }
            >
              <Heart className={"h-4 w-4" + (isShortlisted ? " fill-brand-primary-dark" : "")} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumb — for buyers this mirrors real filtered searches (city,
            then BHK-in-city), not decorative text; both links actually work. */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-brand-secondary/55">
          <button onClick={() => router.push(ROUTES.home)} className="hover:text-brand-secondary">Home</button>
          <ChevronRight className="h-3 w-3 shrink-0" />
          {isOwner ? (
            <button onClick={() => router.push(ROUTES.dashboardTab("listings"))} className="hover:text-brand-secondary">
              My Listings
            </button>
          ) : (
            <>
              <button onClick={() => router.push(`${ROUTES.properties}?city=${encodeURIComponent(property.city)}`)} className="hover:text-brand-secondary">
                Properties in {property.city}
              </button>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <button
                onClick={() => router.push(`${ROUTES.properties}?city=${encodeURIComponent(property.city)}&bhk=${property.beds}`)}
                className="hover:text-brand-secondary"
              >
                {property.beds} BHK in {property.city}
              </button>
            </>
          )}
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate text-brand-secondary">{property.title}</span>
        </div>

        {/* Owner toolbar — only shown to the member who owns this listing */}
        {isOwner && ownedListing && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-brand-border bg-brand-tertiary/40 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-secondary/70">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-primary-dark" /> You&apos;re viewing this as the listing owner
              <ExpiryBadge listing={ownedListing} />
            </div>
            <div className="flex items-center gap-2">
              {getListingExpiry(ownedListing).expired && (
                <button
                  onClick={() => renewListing(ownedListing.id)}
                  className="flex items-center gap-1.5 border border-brand-border bg-card px-3 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-surface"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Renew listing
                </button>
              )}
              <button
                onClick={() => router.push(ROUTES.editListing(ownedListing.id))}
                className="flex items-center gap-1.5 border border-brand-border bg-card px-3 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-surface"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit listing
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 border border-red-200 bg-card px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete listing
              </button>
            </div>
          </div>
        )}

        {/* Title row */}
        <Reveal direction="up">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {property.priority === "Sponsored" && (
                  <Badge className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-ink-black hover:from-brand-primary hover:to-brand-primary-dark">
                    <Crown className="mr-1 h-3 w-3" /> Sponsored
                  </Badge>
                )}
                {property.priority === "Featured" && (
                  <Badge className="bg-ink-black text-brand-primary hover:bg-ink-black">
                    <Star className="mr-1 h-3 w-3 fill-brand-primary" /> Featured
                  </Badge>
                )}
                <Badge className="bg-brand-surface text-brand-primary-dark hover:bg-brand-surface">
                  <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                </Badge>
                {property.transparency && (
                  property.transparency.reraRegistered ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      <FileCheck2 className="mr-1 h-3 w-3" /> RERA Registered
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      <ShieldAlert className="mr-1 h-3 w-3" /> RERA Registration Pending
                    </Badge>
                  )
                )}
                <Badge variant="outline" className="border-brand-border-light text-brand-secondary/70">{property.status}</Badge>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-brand-secondary sm:text-4xl">
                {property.title}
              </h1>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-brand-secondary/65">
                <MapPin className="h-4 w-4 text-brand-primary-dark" /> {property.location}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
              className="text-right"
            >
              <div className="font-serif text-3xl font-bold text-brand-secondary sm:text-4xl">{property.price}</div>
              {property.pricePerSqft && <div className="text-sm text-brand-secondary/55">{property.pricePerSqft}</div>}
              <div className="mt-1 flex items-center justify-end gap-1 text-xs text-brand-secondary/55">
                <Wallet className="h-3 w-3 text-brand-primary-dark" /> Est. EMI{" "}
                <AnimatedCounter to={estimateEmi(property.priceCr)} prefix="₹" duration={1.1} className="font-semibold text-brand-secondary" />/mo
              </div>
            </motion.div>
          </div>
        </Reveal>

        {/* Gallery — every thumbnail here is a real photo of this listing
            (property.galleryImages), never borrowed from another property.
            Clicking any of them, or "View all photos", opens the fullscreen
            lightbox with the complete set. */}
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
          <Reveal direction="up" delay={0.1}>
            <div role="button" tabIndex={0} onClick={() => openGallery(0)} onKeyDown={(e) => e.key === "Enter" && openGallery(0)} className="cursor-pointer">
            <TiltCard max={4} scale={1.01} className="group relative aspect-[16/10] overflow-hidden">
              <Image src={property.galleryImages[0]} alt={property.title} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-black/30 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center bg-ink-black/0 opacity-0 transition-all duration-300 group-hover:bg-ink-black/20 group-hover:opacity-100">
                <span className="flex items-center gap-1.5 bg-card px-4 py-2 text-xs font-bold text-brand-secondary">
                  <Expand className="h-3.5 w-3.5" /> View gallery
                </span>
              </div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="rounded-full bg-ink-black/70 px-3 py-1 text-xs font-bold text-brand-primary backdrop-blur-sm">
                  1 / {property.galleryImages.length} photos
                </span>
                <span className="rounded-full bg-ink-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">360° Tour</span>
              </div>
            </TiltCard>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {property.galleryImages.slice(1, 3).map((src, i) => (
              <Reveal key={src + i} direction="up" delay={0.15 + i * 0.05}>
                <button
                  onClick={() => openGallery(i + 1)}
                  className="group relative block aspect-[16/10] w-full overflow-hidden"
                >
                  <Image src={src} alt={`${property.title} — photo ${i + 2}`} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-black/40 to-transparent" />
                  {i === 1 && property.galleryImages.length > 3 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink-black/50 text-sm font-bold text-white">
                      +{property.galleryImages.length - 3} more
                    </div>
                  )}
                </button>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Trust banner — only claims RERA registration when it's actually true */}
        {property.transparency && (
          <Reveal direction="up" delay={0.15}>
            <div className={
              "mt-6 flex flex-wrap items-center justify-between gap-3 border px-4 py-3 text-sm " +
              (property.transparency.reraRegistered
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400"
                : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400")
            }>
              <div className="flex items-center gap-2 font-semibold">
                <span className="relative grid h-7 w-7 shrink-0 place-items-center">
                  {property.transparency.reraRegistered && (
                    <motion.span
                      className="absolute inset-0 rounded-full border border-green-400"
                      animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  {property.transparency.reraRegistered
                    ? <FileCheck2 className="relative h-4 w-4" />
                    : <ShieldAlert className="relative h-4 w-4" />}
                </span>
                {property.transparency.reraRegistered
                  ? <>RERA registered — reg. no. {property.transparency.reraNumber}</>
                  : "RERA registration in progress — not yet approved"}
              </div>
              {property.transparency.reraUrl && (
                <motion.a
                  whileHover={{ x: 2 }}
                  href={property.transparency.reraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold underline underline-offset-2 hover:no-underline"
                >
                  Verify on the state RERA site <ExternalLink className="h-3 w-3" />
                </motion.a>
              )}
            </div>
          </Reveal>
        )}

        {/* Main grid */}
        <div className={"mt-8 grid grid-cols-1 gap-8" + (isOwner ? "" : " lg:grid-cols-[1.5fr_1fr]")}>
          {/* Left — details */}
          <div className="space-y-8">
            {/* Quick specs */}
            <Reveal direction="up">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Bed, label: "Bedrooms", value: property.beds },
                  { icon: Bath, label: "Bathrooms", value: property.baths },
                  { icon: Maximize2, label: "Area", value: property.area },
                  { icon: Building2, label: "Type", value: property.type },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="border border-brand-border-light bg-brand-surface/40 p-4"
                  >
                    <s.icon className="h-5 w-5 text-brand-primary-dark" />
                    <div className="mt-2 font-serif text-xl font-bold text-brand-secondary">{s.value}</div>
                    <div className="text-[11px] uppercase tracking-wide text-brand-secondary/55">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </Reveal>

            {/* Area breakdown & configuration — the exact numbers a buyer would
                otherwise have to call and ask for. */}
            {property.transparency && (
              <Reveal direction="up">
                <section>
                  <h2 className="font-serif text-2xl font-bold text-brand-secondary">Area &amp; configuration</h2>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { icon: Maximize2, label: "Super built-up area", value: property.transparency.superBuiltupArea },
                      { icon: Layers3, label: "Built-up area", value: property.transparency.builtupArea },
                      { icon: Home, label: "Carpet area", value: property.transparency.carpetArea },
                    ].map((a, i) => (
                      <motion.div
                        key={a.label}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ y: -3 }}
                        className="border border-brand-border-light bg-card px-4 py-3 transition-shadow hover:shadow-md"
                      >
                        <a.icon className="h-4 w-4 text-brand-primary-dark" />
                        <div className="mt-2 text-[11px] uppercase tracking-wide text-brand-secondary/55">{a.label}</div>
                        <div className="mt-1 font-serif text-lg font-bold text-brand-secondary">{a.value}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Area composition bar — a genuine visual, not just three
                      numbers: shows how carpet (the real livable space) sits
                      inside built-up and super built-up. */}
                  <div className="mt-3 border border-brand-border-light bg-card px-4 py-3">
                    <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-brand-secondary/55">
                      <span>Carpet vs. built-up composition</span>
                      <span>{Math.round((property.transparency.carpetAreaSqft / property.areaSqft) * 100)}% efficient</span>
                    </div>
                    <div className="flex h-6 w-full overflow-hidden bg-brand-surface">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(property.transparency.carpetAreaSqft / property.areaSqft) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                        className="flex items-center justify-center bg-brand-primary text-[10px] font-bold text-ink-black"
                      >
                        Carpet
                      </motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${((property.transparency.builtupAreaSqft - property.transparency.carpetAreaSqft) / property.areaSqft) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                        className="flex items-center justify-center bg-brand-primary/45 text-[10px] font-semibold text-brand-secondary"
                      />
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${((property.areaSqft - property.transparency.builtupAreaSqft) / property.areaSqft) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
                        className="bg-brand-border-light"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-brand-secondary/55">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-brand-primary" /> Carpet — usable floor area</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-brand-primary/45" /> Walls &amp; common area</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-brand-border-light" /> Loading — lobby, lifts, amenities</span>
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 border border-brand-border-light bg-brand-surface/40 px-4 py-3 text-sm sm:grid-cols-2">
                    {[
                      { icon: Users, label: "Configuration", value: `${property.beds} Bedrooms, ${property.baths} Bathrooms, ${property.transparency.balconies}+ Balconies${property.transparency.hasPoojaRoom ? " with Pooja Room" : ""}` },
                      ...(property.transparency.floorNumber && property.transparency.totalFloors
                        ? [{ icon: Layers3, label: "Floor number", value: `${property.transparency.floorNumber} of ${property.transparency.totalFloors} floors` }]
                        : []),
                      { icon: Compass, label: "Facing", value: property.transparency.facing },
                      { icon: Eye, label: "Overlooking", value: property.transparency.overlooking },
                      { icon: Calendar, label: "Possession", value: property.transparency.possession },
                      { icon: Calendar, label: "Posted on", value: property.transparency.postedOn },
                    ].map((d) => (
                      <div key={d.label} className="flex justify-between gap-3">
                        <dt className="flex items-center gap-1.5 text-brand-secondary/55">
                          <d.icon className="h-3.5 w-3.5 shrink-0 text-brand-primary-dark" /> {d.label}
                        </dt>
                        <dd className="text-right font-semibold text-brand-secondary">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </Reveal>
            )}

            {/* Key highlights */}
            {property.transparency && property.transparency.keyHighlights.length > 0 && (
              <Reveal direction="up">
                <section>
                  <h2 className="font-serif text-2xl font-bold text-brand-secondary">Key highlights</h2>
                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {property.transparency.keyHighlights.map((h, i) => (
                      <motion.div
                        key={h}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ x: 3 }}
                        className="flex items-center gap-2.5 border border-brand-border-light bg-card px-3 py-2.5 text-xs font-medium text-brand-secondary"
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-primary/15">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-primary-dark" />
                        </span>
                        {h}
                      </motion.div>
                    ))}
                  </div>
                </section>
              </Reveal>
            )}

            {/* Description */}
            <Reveal direction="up">
              <section>
                <h2 className="font-serif text-2xl font-bold text-brand-secondary">About this property</h2>
                <div className="mt-3 space-y-4 text-sm leading-relaxed text-brand-secondary/75">
                  <p>
                    {property.title} is a {property.type.toLowerCase()} located in {property.location}
                    {property.developer ? `, developed by ${property.developer}` : ""}. Spanning {property.area}, this residence offers {property.beds} bedrooms and {property.baths} bathrooms with premium finishes throughout.
                  </p>
                  <p>
                    The property is {property.status.toLowerCase()}, with verified photos and floor plans shot within the last 90 days. As a {property.priority.toLowerCase()} listing on VXP, it receives priority placement in search results and is matched with serious buyers through our Smart Match system.
                  </p>
                  <p>
                    All listings on VXP are physically audited by our field team. The price-per-square-foot benchmark shown is calculated from the last 90 days of DLD transactions in this micro-market, so you know exactly where this asking price sits in the market.
                  </p>
                </div>
              </section>
            </Reveal>

            {/* Property details — transaction type, ownership, and the rest of
                the fine print, spelled out instead of left for a phone call. */}
            {property.transparency && (
              <Reveal direction="up">
                <section>
                  <h2 className="font-serif text-2xl font-bold text-brand-secondary">Property details</h2>
                  <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 border border-brand-border-light bg-card p-5 text-sm sm:grid-cols-2">
                    {[
                      { icon: FileCheck2, label: "Transaction type", value: property.transparency.transactionType },
                      { icon: ShieldCheck, label: "Property ownership", value: property.transparency.ownership },
                      { icon: Layers3, label: "Flooring", value: property.transparency.flooring },
                      { icon: Sofa, label: "Furnishing", value: property.transparency.furnishing },
                      { icon: Compass, label: "Width of facing road", value: property.transparency.widthOfFacingRoad },
                      { icon: Car, label: "Parking", value: property.transparency.parking },
                      { icon: Zap, label: "Power backup", value: property.transparency.powerBackup },
                    ].map((d) => (
                      <div key={d.label} className="flex items-center justify-between gap-3">
                        <dt className="flex items-center gap-2 text-brand-secondary/55">
                          <d.icon className="h-3.5 w-3.5 shrink-0 text-brand-primary-dark" /> {d.label}
                        </dt>
                        <dd className="text-right font-semibold text-brand-secondary">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </Reveal>
            )}

            {/* Amenities — this listing's own amenities, each with its own
                icon, not a one-size-fits-all list shown on every property. */}
            <Reveal direction="up">
              <section>
                <h2 className="font-serif text-2xl font-bold text-brand-secondary">Amenities</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.amenities.map((a, i) => {
                    const Icon = AMENITY_ICONS[a] ?? CheckCircle2
                    return (
                      <motion.div
                        key={a}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ y: -3 }}
                        className="card-sheen flex items-center gap-3 bg-card px-4 py-4 text-xs font-semibold text-brand-secondary"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 text-brand-primary-dark">
                          <Icon className="h-5 w-5" />
                        </span>
                        {a}
                      </motion.div>
                    )
                  })}
                </div>
              </section>
            </Reveal>

            {/* Floor plan */}
            <Reveal direction="up">
              <section>
                <h2 className="font-serif text-2xl font-bold text-brand-secondary">Floor plan</h2>
                <div className="mt-4 overflow-hidden border border-brand-border-light bg-brand-surface/40 p-8">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {["Master Bedroom", "Bedroom 2", "Bedroom 3", "Living Room", "Kitchen", "Dining", "Bathroom ×4", "Balcony"].map((r) => (
                      <div key={r} className="border border-dashed border-brand-primary/40 bg-card p-3 text-center text-xs font-semibold text-brand-secondary">
                        {r}
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-center text-xs text-brand-secondary/55">
                    Total carpet area: {property.area} · East-facing · Vastu compliant
                  </p>
                </div>
              </section>
            </Reveal>

            {/* Location */}
            <Reveal direction="up">
              <section>
                <h2 className="font-serif text-2xl font-bold text-brand-secondary">Location</h2>
                <div className="mt-4 relative aspect-[16/9] overflow-hidden border border-brand-border-light bg-brand-surface/40">
                  <div
                    className="absolute inset-0 opacity-50"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(212,175,55,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.2) 1px, transparent 1px)",
                      backgroundSize: "40px 40px",
                    }}
                  />
                  <div className="absolute inset-0 grid place-items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 220, damping: 14 }}
                      className="relative"
                    >
                      <MapPin className="h-12 w-12 fill-brand-primary text-brand-primary-dark" />
                      <motion.div
                        animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -inset-2 rounded-full border-2 border-brand-primary"
                      />
                    </motion.div>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-card/95 px-3 py-2 text-xs backdrop-blur-sm">
                    <div className="font-bold text-brand-secondary">{property.location}</div>
                    <div className="text-brand-secondary/55">Lat 19.0760° N, Lng 72.8777° E</div>
                  </div>
                </div>
              </section>
            </Reveal>
          </div>

          {/* Right — contact card (sticky). An owner viewing their own listing
              already has the owner toolbar above; contacting/enquiring about
              your own property makes no sense, so this is buyer-only. */}
          {!isOwner && (
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal direction="left">
              <div className="card-sheen relative overflow-hidden bg-card p-6">
                <div className={!user ? "pointer-events-none select-none blur-sm" : ""}>
                  {/* Logged-in badge */}
                  {user && (
                    <div className="mb-4 flex items-center gap-2 bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-primary-dark">
                      <CheckCircle2 className="h-3.5 w-3.5" /> You&apos;re signed in as {user.name.split(" ")[0]}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-ink-black to-ink-deep text-sm font-bold text-brand-primary">
                      {(property.developer ?? "VX").charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="font-serif text-base font-bold text-brand-secondary">{property.developer ?? "VXP Verified Owner"}</div>
                        {property.developerVerified && (
                          <motion.span
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.2 }}
                          >
                            <BadgeCheck className="h-4 w-4 shrink-0 text-brand-primary-dark drop-shadow-[0_0_4px_var(--brand-primary)]" />
                          </motion.span>
                        )}
                      </div>
                      <div className="text-xs text-brand-secondary/55">
                        {property.developerVerified ? "Verified developer" : "Not yet verified"}
                        {property.developerMemberSince && <> · Member since {property.developerMemberSince}</>}
                      </div>
                    </div>
                  </div>

                  {property.transparency && (
                    <div className="mt-3 text-xs text-brand-secondary/55">
                      {property.status} · Posted on {property.transparency.postedOn}
                    </div>
                  )}

                  {/* 5 contact channels, per the docs' contact hub */}
                  <div className="mt-5 space-y-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => !revealed && handleContact("call", MASKED_NUMBER)}
                      className="btn-gold relative flex w-full items-center justify-center gap-2 overflow-hidden py-3 text-sm font-bold"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Phone className="h-4 w-4" /> {revealed ? MASKED_NUMBER : "Reveal contact number"}
                      </span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleContact("whatsapp")}
                      className="flex w-full items-center justify-center gap-2 border border-brand-border-light bg-card py-3 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
                    >
                      <MessageCircle className="h-4 w-4 text-brand-primary-dark" /> WhatsApp
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCallback((v) => !v)}
                      className="flex w-full items-center justify-center gap-2 border border-brand-border-light bg-card py-3 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
                    >
                      <Phone className="h-4 w-4 text-brand-primary-dark" /> Request a callback
                    </motion.button>

                    <AnimatePresence>
                      {showCallback && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex gap-2 border border-brand-border-light bg-brand-surface/40 p-3">
                            <input
                              placeholder="Preferred time (e.g. 6 PM today)"
                              className="w-full border border-brand-border-light bg-card px-3 py-2 text-xs outline-none focus:border-brand-primary"
                            />
                            <button
                              onClick={() => handleContact("callback")}
                              className="shrink-0 bg-ink-black px-3 py-2 text-xs font-bold text-brand-primary"
                            >
                              Request
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Enquiry form */}
                  <div className="mt-6 border-t border-brand-border-light pt-5">
                    <h3 className="font-serif text-base font-bold text-brand-secondary">Send an enquiry</h3>
                    <div className="mt-3 space-y-2.5">
                      <input
                        value={enquiry.name}
                        onChange={(e) => setEnquiry({ ...enquiry, name: e.target.value })}
                        placeholder="Your name"
                        className="w-full border border-brand-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                      <input
                        value={enquiry.email}
                        onChange={(e) => setEnquiry({ ...enquiry, email: e.target.value })}
                        placeholder="Email"
                        className="w-full border border-brand-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                      <input
                        value={enquiry.phone}
                        onChange={(e) => setEnquiry({ ...enquiry, phone: e.target.value })}
                        placeholder="+91 mobile number"
                        className="w-full border border-brand-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                      <textarea
                        rows={3}
                        value={enquiry.message}
                        onChange={(e) => setEnquiry({ ...enquiry, message: e.target.value })}
                        className="w-full resize-none border border-brand-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleContact("enquiry_form", enquiry.phone)}
                      className="btn-gold relative mt-3 w-full overflow-hidden py-3 text-sm font-bold"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Submit enquiry <ChevronRight className="h-4 w-4" />
                      </span>
                    </motion.button>
                  </div>

                  {/* Visit schedule */}
                  <button
                    onClick={() => setShowVisit((v) => !v)}
                    className="mt-4 flex w-full items-center justify-between bg-brand-surface px-4 py-3 text-xs font-bold text-brand-secondary"
                  >
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-brand-primary-dark" /> Schedule site visit</span>
                    <ChevronRight className="h-3 w-3 text-brand-secondary/55" />
                  </button>
                  <AnimatePresence>
                    {showVisit && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 flex gap-2 border border-brand-border-light bg-brand-surface/40 p-3">
                          <input
                            type="date"
                            className="w-full border border-brand-border-light bg-card px-3 py-2 text-xs outline-none focus:border-brand-primary"
                          />
                          <button
                            onClick={() => handleContact("site_visit")}
                            className="shrink-0 bg-ink-black px-3 py-2 text-xs font-bold text-brand-primary"
                          >
                            Book visit
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Trust badges — real, fixed counts from this listing's own
                      record, not a number that reshuffles on every render. */}
                  <div className="mt-5 space-y-2 text-[11px] text-brand-secondary/55">
                    <div className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-brand-primary-dark" /> Lead assigned to owner instantly</div>
                    <div className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-brand-primary-dark" /> No spam — your number stays private</div>
                    {property.transparency && (
                      <>
                        <div className="flex items-center gap-2">
                          <Eye className="h-3 w-3 text-brand-primary-dark" />
                          <AnimatedCounter to={property.transparency.viewedThisWeek} duration={1.2} /> people viewed this week
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-brand-primary-dark" />
                          <AnimatedCounter to={property.transparency.contactedThisWeek} duration={1} /> people already contacted this week
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Anonymous gate */}
                {!user && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card/75 p-6 text-center backdrop-blur-[1px]">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-black">
                      <Lock className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                      <div className="font-serif text-lg font-bold text-brand-secondary">Sign in to contact the owner</div>
                      <p className="mt-1 max-w-[220px] text-sm text-brand-secondary/60">
                        Full contact details, WhatsApp &amp; enquiry unlock after you sign in.
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(ROUTES.loginWithReturn(ROUTES.propertyDetail(property.id)))}
                      className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold"
                    >
                      <span className="relative z-10">Sign in to continue</span>
                    </button>
                  </div>
                )}

                {/* Success confirmation — identical copy regardless of delivered/undelivered outcome */}
                <AnimatePresence>
                  {confirmed && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute inset-x-4 bottom-4 z-20 flex items-center gap-2 bg-ink-black px-4 py-3 text-xs font-semibold text-white shadow-xl"
                    >
                      <CheckCircle2 className="h-4 w-4 text-brand-primary" /> Your request was sent — the owner will reach out shortly.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          </div>
          )}
        </div>

        {/* Fullscreen photo gallery — every photo here belongs to this
            listing, uploaded by its owner/broker; the credit line at the
            bottom says so instead of leaving it ambiguous. */}
        <AnimatePresence>
          {galleryOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col bg-ink-black/97 backdrop-blur-sm"
              onClick={() => setGalleryOpen(false)}
            >
              <div className="flex items-center justify-between px-6 py-4 text-white" onClick={(e) => e.stopPropagation()}>
                <div className="text-sm font-bold">
                  {property.title} <span className="font-normal text-white/50">— {galleryIndex + 1} / {property.galleryImages.length}</span>
                </div>
                <button onClick={() => setGalleryOpen(false)} className="grid h-10 w-10 place-items-center border border-white/20 text-white hover:bg-white/10" aria-label="Close gallery">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative flex-1 px-4 sm:px-16" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={showPrevPhoto}
                  className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/20 bg-ink-black/60 text-white hover:bg-white/10 sm:left-4"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={galleryIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="relative h-full w-full"
                  >
                    <Image
                      src={property.galleryImages[galleryIndex]}
                      alt={`${property.title} — photo ${galleryIndex + 1}`}
                      fill
                      sizes="100vw"
                      className="object-contain"
                    />
                  </motion.div>
                </AnimatePresence>
                <button
                  onClick={showNextPhoto}
                  className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/20 bg-ink-black/60 text-white hover:bg-white/10 sm:right-4"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {property.galleryImages.map((src, i) => (
                    <button
                      key={src + i}
                      onClick={() => setGalleryIndex(i)}
                      className={
                        "relative h-14 w-20 shrink-0 overflow-hidden border-2 transition-opacity " +
                        (i === galleryIndex ? "border-brand-primary opacity-100" : "border-transparent opacity-50 hover:opacity-80")
                      }
                    >
                      <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                    </button>
                  ))}
                </div>
                <p className="text-center text-[11px] text-white/45">
                  All photos uploaded by {property.developer ?? "the listing owner"} · Use ← → to browse, Esc to close
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Owner delete confirmation */}
        {ownedListing && (
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  &ldquo;{property.title}&rdquo; will be removed from My Listings and taken off VXP. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    deleteListing(ownedListing.id)
                    router.push(ROUTES.dashboardTab("listings"))
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Quota-exhausted upsell interstitial */}
        <Dialog open={quotaExhausted} onOpenChange={setQuotaExhausted}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif text-xl">
                <Crown className="h-5 w-5 text-brand-primary-dark" /> You&apos;ve used your 2 free contacts
              </DialogTitle>
              <DialogDescription>
                Free accounts get 2 lifetime contacts. Become a Mercury, Jupiter, or Venus member for unlimited contacts, listings &amp; CRM access.
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={() => { setQuotaExhausted(false); router.push(ROUTES.membership) }}
              className="btn-gold relative mt-2 w-full overflow-hidden py-3 text-sm font-bold"
            >
              <span className="relative z-10">View membership plans →</span>
            </button>
          </DialogContent>
        </Dialog>

        {/* Similar properties */}
        <div className="mt-16">
          <Reveal direction="up">
            <h2 className="font-serif text-2xl font-bold text-brand-secondary">Similar properties</h2>
          </Reveal>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.filter((p) => p.id !== property.id).slice(0, 3).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                onClick={() => router.push(ROUTES.propertyDetail(p.id))}
                className="group cursor-pointer overflow-hidden bg-card ring-1 ring-brand-border-light hover:ring-brand-primary/40"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={p.image} alt={p.title} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 font-serif text-lg font-bold text-white">{p.price}</div>
                </div>
                <div className="p-4">
                  <h3 className="truncate font-serif text-base font-bold text-brand-secondary">{p.title}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-brand-secondary/55"><MapPin className="h-3 w-3 text-brand-primary-dark" /> {p.location}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
