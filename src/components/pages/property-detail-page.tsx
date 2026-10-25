"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  ArrowLeft, MapPin, Bed, Maximize2, BadgeCheck, Crown, Star, Phone,
  MessageCircle, Share2, Heart, Calendar, Building2, CheckCircle2, ChevronRight,
  ChevronLeft, ShieldCheck, Sparkles, Lock, Wallet, Tag, X, Expand, Flag, SearchX,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { useNav } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { useContactStore, leadsForAccount, LEAD_MESSAGE_MAX, CHANNEL_LABEL } from "@/lib/contact-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { searchDocToProperty, toShortlistSnapshot, type ApiProperty } from "@/lib/api-mappers"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { useGetPropertyBySlugQuery, useSearchQuery } from "@/store/api/searchApi"
import {
  useGetQuotaQuery,
  useLazyGetProfileQuery,
  missingProfileFields,
  REQUIREMENT_LABEL,
  type ProfileRequirement,
} from "@/store/api/usersApi"
import { useCallLeadMutation, useCreateLeadMutation, type LeadChannel } from "@/store/api/leadsApi"
import { useReportAbuseMutation } from "@/store/api/referralsApi"
import { VerifyContactField } from "@/components/settings/verify-contact-field"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Reveal } from "@/components/motion/reveal"
import { TiltCard } from "@/components/motion/tilt-card"
import { AnimatedCounter } from "@/components/motion/animated-counter"

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

const formatWhen = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true })

/** Same copy for delivered and undelivered leads — the buyer is never told the seller lapsed (BR-25). */
const GENERIC_SENT = "Your request was sent — the owner will reach out shortly."

type Gate = "mobile" | "profile" | "expired" | "quota" | "repeat" | null

type ContactRequest = { channel: LeadChannel; extra?: { message?: string; preferredTime?: string } }

const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/**
 * Public listing detail — GET /properties/:slug. The route segment is the
 * listing's slug (only live listings resolve; anything else is a 404,
 * shown as "no longer available").
 */
export function PropertyDetailPage({ propertyId: slug }: { propertyId: string }) {
  const { data: doc, isLoading, isError, error, refetch } = useGetPropertyBySlugQuery(slug)

  if (isLoading) return <DetailSkeleton />
  if (isError || !doc) {
    const status = (error as { status?: number } | undefined)?.status
    return <Unavailable notFound={status === 404 || status === 400} onRetry={refetch} />
  }
  return <PropertyDetail property={searchDocToProperty(doc)} description={doc.description} />
}

function PropertyDetail({ property, description }: { property: ApiProperty; description: string | null }) {
  const { user } = useNav()
  const router = useRouter()
  const recordApiLead = useContactStore((s) => s.recordApiLead)
  const apiLeads = useContactStore((s) => s.apiLeads)
  const reportedListings = useContactStore((s) => s.reportedListings)
  const isShortlisted = useShortlistStore((s) => s.isShortlisted(property.id))
  const toggleShortlist = useShortlistStore((s) => s.toggleShortlist)
  const isOwner = !!user?.id && user.id === property.sellerId
  const detailHref = ROUTES.propertyDetail(property.slug)

  // Free users only — members have unlimited contacts. Fetched fresh, never cached.
  const { data: quota, refetch: refetchQuota } = useGetQuotaQuery(undefined, {
    skip: !user?.id || user.tier !== "F",
    refetchOnMountOrArgChange: true,
  })
  const [createLead, { isLoading: isSending }] = useCreateLeadMutation()
  const [callLead] = useCallLeadMutation()
  const [fetchProfile] = useLazyGetProfileQuery()
  const [profileMissing, setProfileMissing] = useState<ProfileRequirement[]>([])

  const [virtualNumber, setVirtualNumber] = useState<string | null>(null)
  const [showCallback, setShowCallback] = useState(false)
  const [showVisit, setShowVisit] = useState(false)
  const [callbackTime, setCallbackTime] = useState("")
  const [visitDate, setVisitDate] = useState("")
  const [message, setMessage] = useState("I'm interested in this property. Please share more details.")
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [contactError, setContactError] = useState<string | null>(null)
  const [gate, setGate] = useState<Gate>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  // Popup blocked → the WhatsApp link is offered as a plain link instead.
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null)
  // A repeat contact waiting on the "you already contacted this owner" confirm.
  const [pendingRepeat, setPendingRepeat] = useState<ContactRequest | null>(null)
  // Synchronous double-click guard — isSending only flips once POST /leads
  // starts, after the profile pre-check's own round-trip.
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)
  const flashTimer = useRef<number | undefined>(undefined)

  // This account's earlier leads on this listing (device-local record — the
  // API has no "my enquiries" list). The backend happily creates duplicates,
  // and each one burns a free contact, so repeats get a confirm step.
  const previousLeads = leadsForAccount(apiLeads, user?.id).filter((l) => l.listingId === property.id)
  const alreadyReported = !!user?.id && reportedListings.includes(`${user.id}:${property.id}`)

  const openGallery = (index: number) => {
    setGalleryIndex(index)
    setGalleryOpen(true)
  }
  const photoCount = property.galleryImages.length
  const showPrevPhoto = () => setGalleryIndex((i) => (i - 1 + photoCount) % photoCount)
  const showNextPhoto = () => setGalleryIndex((i) => (i + 1) % photoCount)

  // Keyboard nav for the fullscreen gallery — arrows to browse, Escape to
  // close — and no page scrolling underneath it while it's open.
  useEffect(() => {
    if (!galleryOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setGalleryIndex((i) => (i - 1 + photoCount) % photoCount)
      else if (e.key === "ArrowRight") setGalleryIndex((i) => (i + 1) % photoCount)
      else if (e.key === "Escape") setGalleryOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [galleryOpen, photoCount])

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  // One timer at a time, so an older flash can't cut a newer one short.
  const flash = (text: string) => {
    window.clearTimeout(flashTimer.current)
    setConfirmation(text)
    flashTimer.current = window.setTimeout(() => setConfirmation(null), 3600)
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      flash("Link copied to clipboard.")
    } catch (err) {
      // Dismissing the native share sheet isn't an error worth reporting.
      if ((err as Error)?.name !== "AbortError") flash("Couldn't copy the link — copy it from the address bar instead.")
    }
  }

  /** Gate a repeat contact behind a confirm (Free users only — it costs another free contact). */
  function requestContact(channel: LeadChannel, extra?: ContactRequest["extra"]) {
    if (user?.id && user.tier === "F" && previousLeads.length > 0) {
      setPendingRepeat({ channel, extra })
      setGate("repeat")
      return
    }
    void handleContact(channel, extra)
  }

  /**
   * POST /leads — one endpoint behind all 5 contact channels. The backend
   * runs the gates in order (mobile verified → profile complete → listing
   * live → quota) and each failure gets its own recovery path here.
   */
  async function handleContact(channel: LeadChannel, extra?: { message?: string; preferredTime?: string }) {
    if (!user) {
      router.push(ROUTES.loginWithReturn(detailHref))
      return
    }
    if (!user.id) {
      // Client-only demo account — nothing to send to the API.
      setContactError("Sign in with a real account to contact this owner.")
      return
    }
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setContactError(null)
    setWhatsappLink(null)
    try {
      await sendContact(channel, extra)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  async function sendContact(channel: LeadChannel, extra?: ContactRequest["extra"]) {
    if (!user?.id) return
    // Browsers block window.open once we're past the click (after an await),
    // so the WhatsApp tab is opened right now and pointed at the real link
    // when the API answers — or closed if there isn't one (undelivered lead).
    const whatsappTab = channel === "whatsapp" ? window.open("", "_blank") : null
    if (whatsappTab) whatsappTab.opener = null
    // Product rule, stricter than the backend's PROFILE_INCOMPLETE gate: every
    // profile field + a verified mobile and email before contacting anyone.
    // Checked against a fresh profile fetch, never the cached session copy.
    // A verified mobile is checked first, so the inline verify dialog still
    // handles the "no mobile" case the same way the backend gate does.
    const profile = await fetchProfile(undefined, false).unwrap().catch(() => null)
    if (profile) {
      const missing = missingProfileFields(profile, { phone: user.phone, email: user.email })
      if (missing.includes("mobile")) {
        whatsappTab?.close()
        setGate("mobile")
        return
      }
      if (missing.length > 0) {
        whatsappTab?.close()
        setProfileMissing(missing)
        setGate("profile")
        return
      }
    }
    try {
      const result = await createLead({ listingId: property.id, channel, ...extra }).unwrap()
      recordApiLead({
        accountId: user.id,
        leadId: result.lead.id,
        listingId: property.id,
        slug: property.slug,
        title: property.title,
        location: property.location,
        channel,
        createdAt: new Date().toISOString(),
      })
      if (user.tier === "F") refetchQuota()

      if (channel === "call") {
        // Masked number only exists for a delivered lead; an undelivered one
        // 409s — which the buyer must never be able to tell apart (BR-25).
        try {
          const call = await callLead(result.lead.id).unwrap()
          setVirtualNumber(call.virtualNumber)
        } catch {
          // Same generic confirmation as every other channel.
        }
      }
      if (whatsappTab) {
        if (result.whatsappUrl) whatsappTab.location.href = result.whatsappUrl
        else whatsappTab.close()
      } else if (result.whatsappUrl) {
        // The blank tab was blocked — offer the chat as a link instead of losing it.
        setWhatsappLink(result.whatsappUrl)
      }
      setShowCallback(false)
      setShowVisit(false)
      flash(result.confirmation ?? GENERIC_SENT)
    } catch (err) {
      whatsappTab?.close()
      const code = getApiErrorCode(err)
      if (code === "MOBILE_NOT_VERIFIED") setGate("mobile")
      else if (code === "PROFILE_INCOMPLETE") setGate("profile")
      else if (code === "CONTACT_BLOCKED_LISTING_EXPIRED") setGate("expired")
      else if (code === "QUOTA_EXHAUSTED") setGate("quota")
      else setContactError(getApiErrorMessage(err) ?? "Couldn't send your request. Please try again.")
    }
  }

  const snapshot = toShortlistSnapshot(property)

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <button
            onClick={() => router.push(ROUTES.properties)}
            className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={share}
              className="grid h-10 w-10 place-items-center border border-brand-border-light text-brand-secondary/65 hover:bg-brand-surface"
              aria-label="Share this listing"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleShortlist(property.id, snapshot)}
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
        {/* Breadcrumb — mirrors real filtered searches (city, then BHK-in-city). */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-brand-secondary/55">
          <button onClick={() => router.push(ROUTES.home)} className="hover:text-brand-secondary">Home</button>
          <ChevronRight className="h-3 w-3 shrink-0" />
          {property.city && (
            <>
              <button onClick={() => router.push(ROUTES.propertiesSearch({ city: property.city }))} className="hover:text-brand-secondary">
                Properties in {property.city}
              </button>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </>
          )}
          {property.city && property.beds > 0 && (
            <>
              <button
                onClick={() => router.push(ROUTES.propertiesSearch({ city: property.city, bhk: String(property.beds) }))}
                className="hover:text-brand-secondary"
              >
                {property.beds} BHK in {property.city}
              </button>
              <ChevronRight className="h-3 w-3 shrink-0" />
            </>
          )}
          <span className="truncate text-brand-secondary">{property.title}</span>
        </div>

        {isOwner && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-brand-border bg-brand-tertiary/40 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-secondary/70">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-primary-dark" /> This is your listing — this is how buyers see it.
            </div>
            <button
              onClick={() => router.push(ROUTES.dashboardTab("listings"))}
              className="border border-brand-border bg-card px-3 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-surface"
            >
              Manage in My Listings
            </button>
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
                {property.badges.length > 0 && (
                  <Badge className="bg-brand-surface text-brand-primary-dark hover:bg-brand-surface">
                    <BadgeCheck className="mr-1 h-3 w-3" />
                    {property.badges.includes("verified_developer") ? "Verified Developer" : "Verified Seller"}
                  </Badge>
                )}
                <Badge variant="outline" className="border-brand-border-light text-brand-secondary/70">For {property.purpose}</Badge>
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
              {property.priceCr > 0 && property.purpose === "Sale" && (
                <div className="mt-1 flex items-center justify-end gap-1 text-xs text-brand-secondary/55">
                  <Wallet className="h-3 w-3 text-brand-primary-dark" /> Est. EMI{" "}
                  <AnimatedCounter to={estimateEmi(property.priceCr)} prefix="₹" duration={1.1} className="font-semibold text-brand-secondary" />/mo
                </div>
              )}
            </motion.div>
          </div>
        </Reveal>

        {/* Gallery — listings don't expose their uploaded photos through the
            public API yet, so these are representative images for the
            property type, labelled as such rather than passed off as real. */}
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
          <Reveal direction="up" delay={0.1}>
            <div
              role="button"
              tabIndex={0}
              aria-label="Open photo gallery"
              onClick={() => openGallery(0)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  openGallery(0)
                }
              }}
              className="cursor-pointer"
            >
              <TiltCard max={4} scale={1.01} className="group relative aspect-[16/10] overflow-hidden">
                <Image src={property.galleryImages[0]} alt={property.title} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-black/30 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center bg-ink-black/0 opacity-0 transition-all duration-300 group-hover:bg-ink-black/20 group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 bg-card px-4 py-2 text-xs font-bold text-brand-secondary">
                    <Expand className="h-3.5 w-3.5" /> View gallery
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="rounded-full bg-ink-black/70 px-3 py-1 text-xs font-bold text-brand-primary backdrop-blur-sm">
                    Representative photos
                  </span>
                </div>
              </TiltCard>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {property.galleryImages.slice(1, 3).map((src, i) => (
              <Reveal key={src + i} direction="up" delay={0.15 + i * 0.05}>
                <button onClick={() => openGallery(i + 1)} className="group relative block aspect-[16/10] w-full overflow-hidden">
                  <Image src={src} alt={`${property.title} — photo ${i + 2}`} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-black/40 to-transparent" />
                </button>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div className={"mt-8 grid grid-cols-1 gap-8" + (isOwner ? "" : " lg:grid-cols-[1.5fr_1fr]")}>
          {/* Left — details */}
          <div className="space-y-8">
            {/* Quick specs — only what the listing actually has. */}
            <Reveal direction="up">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Bed, label: "Configuration", value: property.beds ? `${property.beds} BHK` : "—" },
                  { icon: Maximize2, label: "Area", value: property.area },
                  { icon: Building2, label: "Type", value: property.type },
                  { icon: Tag, label: "Purpose", value: `For ${property.purpose}` },
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

            {/* Description — the seller's own text when there is one. */}
            <Reveal direction="up">
              <section>
                <h2 className="font-serif text-2xl font-bold text-brand-secondary">About this property</h2>
                <div className="mt-3 space-y-4 whitespace-pre-line text-sm leading-relaxed text-brand-secondary/75">
                  {description?.trim() ? (
                    <p>{description}</p>
                  ) : (
                    <p>
                      {property.title} is a {property.type.toLowerCase()} for {property.purpose.toLowerCase()} in {property.location}.
                      {" "}The owner hasn&apos;t added a description yet — send an enquiry to ask for more details.
                    </p>
                  )}
                </div>
              </section>
            </Reveal>

            {/* Location */}
            <Reveal direction="up">
              <section>
                <h2 className="font-serif text-2xl font-bold text-brand-secondary">Location</h2>
                <div className="relative mt-4 aspect-[16/9] overflow-hidden border border-brand-border-light bg-brand-surface/40">
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
                  </div>
                </div>
              </section>
            </Reveal>

            {!isOwner &&
              (alreadyReported ? (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-secondary/50">
                  <Flag className="h-3.5 w-3.5" /> You reported this listing — our team is reviewing it.
                </p>
              ) : (
                <button
                  onClick={() => (user?.id ? setReportOpen(true) : router.push(ROUTES.loginWithReturn(detailHref)))}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-secondary/50 hover:text-red-600"
                >
                  <Flag className="h-3.5 w-3.5" /> Report this listing
                </button>
              ))}
          </div>

          {/* Right — contact card (sticky). Buyer-only: contacting your own
              listing makes no sense. */}
          {!isOwner && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Reveal direction="left">
                <div className="card-sheen relative overflow-hidden bg-card p-6">
                  <div className={!user ? "pointer-events-none select-none blur-sm" : ""}>
                    {user && (
                      <div className="mb-4 flex items-center gap-2 bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-primary-dark">
                        <CheckCircle2 className="h-3.5 w-3.5" /> You&apos;re signed in as {user.name.split(" ")[0]}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-ink-black to-ink-deep text-sm font-bold text-brand-primary">
                        VX
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <div className="font-serif text-base font-bold text-brand-secondary">VXP Listing Owner</div>
                          {property.badges.length > 0 && (
                            <BadgeCheck className="h-4 w-4 shrink-0 text-brand-primary-dark drop-shadow-[0_0_4px_var(--brand-primary)]" />
                          )}
                        </div>
                        <div className="text-xs text-brand-secondary/55">
                          {property.badges.includes("verified_developer")
                            ? "Verified developer"
                            : property.badges.includes("verified")
                              ? "KYC verified"
                              : "Not yet verified"}
                        </div>
                      </div>
                    </div>

                    {user?.tier === "F" && quota && (
                      <div className="mt-4 border border-brand-border-light bg-brand-surface/40 px-3 py-2 text-xs text-brand-secondary/70">
                        <b className="text-brand-primary-dark">{quota.remaining}</b> of {quota.limit} free contacts left
                        {quota.remaining === 0 && (
                          <>
                            {" "}·{" "}
                            <button onClick={() => router.push(ROUTES.membership)} className="font-bold text-brand-primary-dark underline">
                              Get unlimited contacts
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {previousLeads.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-brand-secondary/60">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-brand-primary-dark" />
                        You contacted this owner {formatWhen(previousLeads[0].createdAt)} ({CHANNEL_LABEL[previousLeads[0].channel].toLowerCase()}).
                      </div>
                    )}

                    {/* 5 contact channels, per the docs' contact hub */}
                    <div className="mt-5 space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSending || busy}
                        onClick={() => !virtualNumber && requestContact("call")}
                        className="btn-gold relative flex w-full items-center justify-center gap-2 overflow-hidden py-3 text-sm font-bold disabled:opacity-60"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <Phone className="h-4 w-4" /> {virtualNumber ?? "Call the owner"}
                        </span>
                      </motion.button>
                      {virtualNumber && (
                        <p className="text-center text-[11px] text-brand-secondary/55">
                          Masked number — your real number stays private.{" "}
                          <a href={`tel:${virtualNumber.replace(/[^\d+]/g, "")}`} className="font-bold text-brand-primary-dark underline">
                            Call now
                          </a>
                        </p>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSending || busy}
                        onClick={() => requestContact("whatsapp")}
                        className="flex w-full items-center justify-center gap-2 border border-brand-border-light bg-card py-3 text-sm font-bold text-brand-secondary hover:bg-brand-surface disabled:opacity-60"
                      >
                        <MessageCircle className="h-4 w-4 text-brand-primary-dark" /> WhatsApp
                      </motion.button>
                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-center text-[11px] font-bold text-brand-primary-dark underline"
                        >
                          Your browser blocked the pop-up — open the WhatsApp chat
                        </a>
                      )}
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
                                value={callbackTime}
                                onChange={(e) => setCallbackTime(e.target.value)}
                                maxLength={100}
                                aria-label="Preferred callback time"
                                placeholder="Preferred time (e.g. 6 PM today)"
                                className="w-full border border-brand-border-light bg-card px-3 py-2 text-xs outline-none focus:border-brand-primary"
                              />
                              <button
                                disabled={isSending || busy}
                                onClick={() => requestContact("callback", callbackTime.trim() ? { preferredTime: callbackTime.trim() } : undefined)}
                                className="shrink-0 bg-ink-black px-3 py-2 text-xs font-bold text-brand-primary disabled:opacity-60"
                              >
                                Request
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Enquiry form — name/phone come from the account itself, only the message is free text. */}
                    <div className="mt-6 border-t border-brand-border-light pt-5">
                      <h3 className="font-serif text-base font-bold text-brand-secondary">Send an enquiry</h3>
                      <textarea
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, LEAD_MESSAGE_MAX))}
                        maxLength={LEAD_MESSAGE_MAX}
                        aria-label="Your message to the owner"
                        className="mt-3 w-full resize-none border border-brand-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary"
                      />
                      <div className="text-right text-[10px] text-brand-secondary/45">
                        {message.length}/{LEAD_MESSAGE_MAX}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSending || busy || !message.trim()}
                        onClick={() => requestContact("enquiry_form", { message: message.trim() })}
                        className="btn-gold relative mt-3 w-full overflow-hidden py-3 text-sm font-bold disabled:opacity-60"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isSending || busy ? "Sending…" : "Submit enquiry"} <ChevronRight className="h-4 w-4" />
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
                              value={visitDate}
                              min={todayIso()}
                              aria-label="Visit date"
                              onChange={(e) => setVisitDate(e.target.value)}
                              className="w-full border border-brand-border-light bg-card px-3 py-2 text-xs outline-none focus:border-brand-primary"
                            />
                            <button
                              // A visit needs a date, and not one in the past.
                              disabled={isSending || busy || !visitDate || visitDate < todayIso()}
                              onClick={() => requestContact("site_visit", { preferredTime: visitDate })}
                              className="shrink-0 bg-ink-black px-3 py-2 text-xs font-bold text-brand-primary disabled:opacity-60"
                            >
                              Book visit
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {contactError && <p className="mt-3 text-xs font-semibold text-red-500">{contactError}</p>}

                    <div className="mt-5 space-y-2 text-[11px] text-brand-secondary/55">
                      <div className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-brand-primary-dark" /> Lead assigned to owner instantly</div>
                      <div className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-brand-primary-dark" /> No spam — your number stays private</div>
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
                          Calls, WhatsApp &amp; enquiries unlock after you sign in.
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(ROUTES.loginWithReturn(detailHref))}
                        className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold"
                      >
                        <span className="relative z-10">Sign in to continue</span>
                      </button>
                    </div>
                  )}

                  {/* Success confirmation — identical copy regardless of delivered/undelivered outcome */}
                  <AnimatePresence>
                    {confirmation && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-4 bottom-4 z-20 flex items-center gap-2 bg-ink-black px-4 py-3 text-xs font-semibold text-white shadow-xl"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-primary" /> {confirmation}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            </div>
          )}
        </div>

        {/* Fullscreen photo gallery */}
        <AnimatePresence>
          {galleryOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col bg-ink-black/97 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label={`${property.title} photos`}
              onClick={() => setGalleryOpen(false)}
            >
              <div className="flex items-center justify-between px-6 py-4 text-white" onClick={(e) => e.stopPropagation()}>
                <div className="text-sm font-bold">
                  {property.title} <span className="font-normal text-white/50">— {galleryIndex + 1} / {photoCount}</span>
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

              <p className="px-6 py-4 text-center text-[11px] text-white/45" onClick={(e) => e.stopPropagation()}>
                Representative photos for this property type · Use ← → to browse, Esc to close
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <ContactGateDialogs
          gate={gate}
          profileMissing={profileMissing}
          returnTo={detailHref}
          previousLead={previousLeads[0]}
          onClose={() => {
            setGate(null)
            setPendingRepeat(null)
          }}
          onVerified={() => {
            setGate(null)
            flash("Number verified — you can contact the owner now.")
          }}
          onConfirmRepeat={() => {
            const req = pendingRepeat
            setGate(null)
            setPendingRepeat(null)
            if (req) void handleContact(req.channel, req.extra)
          }}
        />

        {reportOpen && user?.id && (
          <ReportDialog
            listingId={property.id}
            onClose={() => setReportOpen(false)}
            onDone={() => {
              useContactStore.getState().markReported(user.id!, property.id)
              flash("Thanks — our team will review this listing.")
            }}
          />
        )}

        <SimilarProperties property={property} />
      </div>
    </div>
  )
}

/**
 * Recovery paths for each POST /leads gate. MOBILE_NOT_VERIFIED is solved
 * right here — the same OTP endpoints with purpose "mobile_verify" (Bearer
 * attached, no new tokens issued) — so an email/Google user never has to
 * leave the listing to add a phone number.
 */
function ContactGateDialogs({
  gate,
  profileMissing,
  returnTo,
  previousLead,
  onClose,
  onVerified,
  onConfirmRepeat,
}: {
  gate: Gate
  profileMissing: ProfileRequirement[]
  returnTo: string
  previousLead?: { createdAt: string; channel: LeadChannel }
  onClose: () => void
  onVerified: () => void
  onConfirmRepeat: () => void
}) {
  const router = useRouter()
  return (
    <>
      <Dialog open={gate === "repeat"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">You&apos;ve already contacted this owner</DialogTitle>
            <DialogDescription>
              {previousLead && <>You reached out {formatWhen(previousLead.createdAt)}. </>}
              Contacting them again uses another of your free contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 border border-brand-border-light py-3 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
            >
              Cancel
            </button>
            <button onClick={onConfirmRepeat} className="btn-gold relative flex-1 overflow-hidden py-3 text-sm font-bold">
              <span className="relative z-10">Contact again</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={gate === "quota"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl">
              <Crown className="h-5 w-5 text-brand-primary-dark" /> You&apos;ve used your free contacts
            </DialogTitle>
            <DialogDescription>
              Free accounts get a limited number of lifetime contacts. Become a Mercury, Jupiter, or Venus member for unlimited contacts, listings &amp; CRM access.
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => { onClose(); router.push(ROUTES.membership) }}
            className="btn-gold relative mt-2 w-full overflow-hidden py-3 text-sm font-bold"
          >
            <span className="relative z-10">View membership plans →</span>
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={gate === "profile"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Complete your profile first</DialogTitle>
            <DialogDescription>
              Sellers see who&apos;s contacting them — finish your profile and you&apos;ll come straight back to this listing.
              {profileMissing.length > 0 && (
                <>
                  {" "}Still needed: <b>{profileMissing.map((k) => REQUIREMENT_LABEL[k]).join(", ")}</b>.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => {
              onClose()
              router.push(`${ROUTES.signup}?${new URLSearchParams({ step: "profile", returnTo })}`)
            }}
            className="btn-gold relative mt-2 w-full overflow-hidden py-3 text-sm font-bold"
          >
            <span className="relative z-10">Complete profile →</span>
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={gate === "expired"} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">This listing isn&apos;t accepting enquiries</DialogTitle>
            <DialogDescription>It may have expired or been taken down. Browse similar homes instead.</DialogDescription>
          </DialogHeader>
          <button
            onClick={() => { onClose(); router.push(ROUTES.properties) }}
            className="btn-gold relative mt-2 w-full overflow-hidden py-3 text-sm font-bold"
          >
            <span className="relative z-10">Browse properties →</span>
          </button>
        </DialogContent>
      </Dialog>

      {gate === "mobile" && <VerifyMobileDialog onClose={onClose} onVerified={onVerified} />}
    </>
  )
}

/**
 * MOBILE_NOT_VERIFIED, solved in place: the same OTP field Settings uses
 * (POST /auth/otp/request purpose "mobile_verify", Bearer attached, no new
 * tokens), so validation, resend cooldown and every OTP error read the same
 * everywhere. Once the session shows a verified number, Continue appears.
 */
function VerifyMobileDialog({ onClose, onVerified }: { onClose: () => void; onVerified: () => void }) {
  const phone = useNav((s) => s.user?.phone)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Verify your mobile number</DialogTitle>
          <DialogDescription>
            {phone
              ? "Your number is verified — you can contact the owner now."
              : "Sellers can only be contacted from a verified mobile number. It stays private — calls go through a masked number."}
          </DialogDescription>
        </DialogHeader>
        <VerifyContactField
          channel="mobile"
          value={phone}
          label="Mobile number"
          inputClass="mt-1.5 w-full border border-brand-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary"
          labelClass="text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/55"
        />
        {phone && (
          <button onClick={onVerified} className="btn-gold relative mt-2 w-full overflow-hidden py-3 text-sm font-bold">
            <span className="relative z-10">Continue</span>
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}

const REPORT_REASONS = ["Fake or misleading", "Already sold / rented", "Wrong price", "Duplicate listing", "Spam or fraud"]

/** POST /abuse-reports (BR-06) — reason is capped at 40 chars server-side. */
function ReportDialog({ listingId, onClose, onDone }: { listingId: string; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(REPORT_REASONS[0])
  const [details, setDetails] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [reportAbuse, { isLoading }] = useReportAbuseMutation()

  const submit = async () => {
    setError(null)
    try {
      await reportAbuse({ listingId, reason, ...(details.trim() && { details: details.trim() }) }).unwrap()
      onClose()
      onDone()
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "Couldn't send the report. Please try again.")
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Report this listing</DialogTitle>
          <DialogDescription>Tell us what&apos;s wrong — our moderation team reviews every report.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-1.5">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={
                "px-2.5 py-1.5 text-[11px] font-bold " +
                (reason === r ? "bg-ink-black text-brand-primary" : "border border-brand-border-light text-brand-secondary/65 hover:bg-brand-surface")
              }
            >
              {r}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 500))}
          maxLength={500}
          aria-label="Report details"
          placeholder="Anything else we should know? (optional)"
          className="w-full resize-none border border-brand-border-light px-3 py-2.5 text-sm outline-none focus:border-brand-primary"
        />
        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
        <button onClick={submit} disabled={isLoading} className="btn-gold relative w-full overflow-hidden py-3 text-sm font-bold disabled:opacity-60">
          <span className="relative z-10">{isLoading ? "Sending…" : "Submit report"}</span>
        </button>
      </DialogContent>
    </Dialog>
  )
}

/** Same city first; falls back to anything recent when the city has nothing else. */
function SimilarProperties({ property }: { property: ApiProperty }) {
  const router = useRouter()
  const { data } = useSearchQuery({ city: property.city || undefined, limit: 4 })
  const { data: fallback } = useSearchQuery({ limit: 4, sort: "newest" }, { skip: !data || data.hits.length > 1 })
  const hits = [...(data?.hits ?? []), ...(fallback?.hits ?? [])]
    .filter((h, i, all) => h.id !== property.id && all.findIndex((x) => x.id === h.id) === i)
    .slice(0, 3)
    .map(searchDocToProperty)
  if (hits.length === 0) return null

  return (
    <div className="mt-16">
      <Reveal direction="up">
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Similar properties</h2>
      </Reveal>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {hits.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            onClick={() => router.push(ROUTES.propertyDetail(p.slug))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                router.push(ROUTES.propertyDetail(p.slug))
              }
            }}
            role="link"
            tabIndex={0}
            aria-label={`${p.title}, ${p.price}`}
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
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-6 py-24">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/3" />
      <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="aspect-[16/10] w-full" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <Skeleton className="aspect-[16/10] w-full" />
          <Skeleton className="aspect-[16/10] w-full" />
        </div>
      </div>
    </div>
  )
}

function Unavailable({ notFound, onRetry }: { notFound: boolean; onRetry: () => void }) {
  const router = useRouter()
  return (
    <div className="grid min-h-screen place-items-center bg-brand-surface px-6">
      <div className="max-w-md border border-brand-border-light bg-card p-10 text-center">
        <SearchX className="mx-auto h-10 w-10 text-brand-primary-dark" />
        <h1 className="mt-4 font-serif text-2xl font-bold text-brand-secondary">
          {notFound ? "This listing is no longer available" : "Couldn't load this listing"}
        </h1>
        <p className="mt-2 text-sm text-brand-secondary/60">
          {notFound
            ? "It may have been sold, expired, or taken down by the owner."
            : "Please check your connection and try again."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {!notFound && (
            <button onClick={onRetry} className="border border-brand-border-light px-5 py-2.5 text-sm font-bold text-brand-secondary hover:bg-brand-surface">
              Retry
            </button>
          )}
          <button onClick={() => router.push(ROUTES.properties)} className="btn-gold relative overflow-hidden px-5 py-2.5 text-sm font-bold">
            <span className="relative z-10">Browse properties</span>
          </button>
        </div>
      </div>
    </div>
  )
}
