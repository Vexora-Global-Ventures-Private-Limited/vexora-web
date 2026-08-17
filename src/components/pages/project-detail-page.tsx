"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import {
  ArrowLeft, MapPin, BadgeCheck, Crown, Star, Phone, MessageCircle, Share2, Heart,
  CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Sparkles, Eye, Lock,
  Pencil, Trash2, RotateCcw, FileCheck2, Users, ShieldAlert, ExternalLink, X, Expand,
  FileText, Download, Waves, Droplets, Dumbbell, Bell, Cpu, ArrowUpDown, Trees, Car,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useProjectsStore, getProjectExpiry } from "@/lib/projects-store"
import { projectPriceRangeCr, projectAreaRangeSqft, type ProjectGalleryCategory, type ProjectContact } from "@/lib/projects-data"
import { useNav } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { useContactStore, type ContactChannel } from "@/lib/contact-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Reveal } from "@/components/motion/reveal"
import { TiltCard } from "@/components/motion/tilt-card"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import { ProjectPromotionAdSlot } from "@/components/ads/project-promotion-ad-slot"

/** A distinct icon per amenity, same idiom as the property detail page —
 *  falls back to a plain check for anything unmapped. */
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

const GALLERY_TABS: ProjectGalleryCategory[] = ["Aerial / Master Plan", "Elevation", "Amenities"]

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const { user } = useNav()
  const router = useRouter()
  const submitContact = useContactStore((s) => s.submitContact)
  const projects = useProjectsStore((s) => s.projects)
  const deleteProject = useProjectsStore((s) => s.deleteProject)
  const renewProject = useProjectsStore((s) => s.renewProject)
  const project = projects.find((p) => p.id === projectId) ?? projects[0]
  const isShortlisted = useShortlistStore((s) => s.isShortlisted(project.id))
  const toggleShortlist = useShortlistStore((s) => s.toggleShortlist)

  const isOwner = !!user && user.tier === "V" && project.isMine === true

  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryTab, setGalleryTab] = useState<ProjectGalleryCategory>("Aerial / Master Plan")
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [revealedContactId, setRevealedContactId] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [quotaExhausted, setQuotaExhausted] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [enquiry, setEnquiry] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: "", message: "I'm interested in this project. Please share more details." })
  const [showEnquiry, setShowEnquiry] = useState(false)

  const galleryPhotos = project.gallery.filter((g) => g.category === galleryTab).map((g) => g.src)
  const allPhotos = project.galleryImages

  const openGallery = (category: ProjectGalleryCategory, index: number) => {
    setGalleryTab(category)
    setGalleryIndex(index)
    setGalleryOpen(true)
  }
  const showPrevPhoto = () => setGalleryIndex((i) => (i - 1 + galleryPhotos.length) % galleryPhotos.length)
  const showNextPhoto = () => setGalleryIndex((i) => (i + 1) % galleryPhotos.length)

  const mobileVerified = !!user?.phone

  useEffect(() => {
    if (!galleryOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") showPrevPhoto()
      else if (e.key === "ArrowRight") showNextPhoto()
      else if (e.key === "Escape") setGalleryOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [galleryOpen, galleryTab])

  function handleContact(channel: ContactChannel, contact: ProjectContact) {
    if (!user) {
      router.push(ROUTES.loginWithReturn(ROUTES.projectDetail(project.id)))
      return
    }
    if (!mobileVerified) {
      router.push(ROUTES.loginWithReturn(ROUTES.projectDetail(project.id)))
      return
    }

    const result = submitContact({
      propertyId: project.id,
      channel,
      buyerName: user.name,
      buyerPhone: user.phone || "",
      sellerMembershipActive: true,
      hasQuota: user.tier === "F",
    })

    if (!result.ok) {
      setQuotaExhausted(true)
      return
    }

    if (channel === "call") setRevealedContactId(contact.id)
    if (channel === "whatsapp") window.open("https://wa.me/919876543210", "_blank", "noopener,noreferrer")
    setConfirmed(true)
    window.setTimeout(() => setConfirmed(false), 3200)
  }

  const { min: priceMin, max: priceMax } = projectPriceRangeCr(project)
  const { min: areaMin, max: areaMax } = projectAreaRangeSqft(project)
  const reraOk = project.reraRegistrations.length > 0
  const primaryContact = project.contacts.find((c) => c.isPrimary) ?? project.contacts[0]


  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <button
            onClick={() => router.push(isOwner ? ROUTES.dashboardTab("projects") : ROUTES.projects)}
            className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> {isOwner ? "Back to my projects" : "Back to projects"}
          </button>
          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center border border-brand-border-light text-brand-secondary/65 hover:bg-brand-surface"><Share2 className="h-4 w-4" /></button>
            <button
              onClick={() => toggleShortlist(project.id)}
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
        {/* Breadcrumb */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-brand-secondary/55">
          <button onClick={() => router.push(ROUTES.home)} className="hover:text-brand-secondary">Home</button>
          <ChevronRight className="h-3 w-3 shrink-0" />
          {isOwner ? (
            <button onClick={() => router.push(ROUTES.dashboardTab("projects"))} className="hover:text-brand-secondary">
              My Projects
            </button>
          ) : (
            <button onClick={() => router.push(`${ROUTES.projects}?city=${encodeURIComponent(project.city)}`)} className="hover:text-brand-secondary">
              Projects in {project.city}
            </button>
          )}
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate text-brand-secondary">{project.name}</span>
        </div>

        {/* Owner toolbar */}
        {isOwner && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-brand-border bg-brand-tertiary/40 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-secondary/70">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-primary-dark" /> You&apos;re viewing this as the project owner
            </div>
            <div className="flex items-center gap-2">
              {getProjectExpiry(project).expired && (
                <button
                  onClick={() => renewProject(project.id)}
                  className="flex items-center gap-1.5 border border-brand-border bg-card px-3 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-surface"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Renew project
                </button>
              )}
              <button
                onClick={() => router.push(ROUTES.editProject(project.id))}
                className="flex items-center gap-1.5 border border-brand-border bg-card px-3 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-surface"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit project
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-1.5 border border-red-200 bg-card px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete project
              </button>
            </div>
          </div>
        )}

        {/* Title row */}
        <Reveal direction="up">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {project.priority === "Sponsored" && (
                  <Badge className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-ink-black hover:from-brand-primary hover:to-brand-primary-dark">
                    <Crown className="mr-1 h-3 w-3" /> Sponsored
                  </Badge>
                )}
                {project.priority === "Featured" && (
                  <Badge className="bg-ink-black text-brand-primary hover:bg-ink-black">
                    <Star className="mr-1 h-3 w-3 fill-brand-primary" /> Featured
                  </Badge>
                )}
                {reraOk ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <FileCheck2 className="mr-1 h-3 w-3" /> RERA Registered
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    <ShieldAlert className="mr-1 h-3 w-3" /> RERA Registration Pending
                  </Badge>
                )}
                {project.zeroBrokerage && (
                  <Badge variant="outline" className="border-brand-border-light text-brand-secondary/70">Zero Brokerage</Badge>
                )}
                <Badge variant="outline" className="border-brand-border-light text-brand-secondary/70">{project.status}</Badge>
              </div>
              <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-brand-secondary sm:text-4xl">
                {project.name}
              </h1>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-brand-secondary/65">
                <MapPin className="h-4 w-4 text-brand-primary-dark" /> {project.location}
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
              className="text-right"
            >
              <div className="font-serif text-3xl font-bold text-brand-secondary sm:text-4xl">
                {priceMin === priceMax ? `₹ ${priceMin} Cr` : `₹ ${priceMin} – ${priceMax} Cr`}
              </div>
              <div className="text-sm text-brand-secondary/55">
                {areaMin === areaMax ? `${areaMin.toLocaleString("en-IN")} sq.ft` : `${areaMin.toLocaleString("en-IN")} – ${areaMax.toLocaleString("en-IN")} sq.ft`}
              </div>
            </motion.div>
          </div>
        </Reveal>

        <div className="mt-6">
          <ProjectPromotionAdSlot projectId={project.id} />
        </div>

        {/* Gallery — categorized tabs above the grid */}
        <div className="mt-6">
          <div className="flex flex-wrap gap-1.5">
            {GALLERY_TABS.map((tab) => {
              const count = project.gallery.filter((g) => g.category === tab).length
              if (count === 0) return null
              return (
                <button
                  key={tab}
                  onClick={() => setGalleryTab(tab)}
                  className={
                    "px-3 py-1.5 text-xs font-bold transition-colors " +
                    (galleryTab === tab ? "bg-ink-black text-brand-primary" : "border border-brand-border-light bg-card text-brand-secondary/65 hover:bg-brand-surface")
                  }
                >
                  {tab} ({count})
                </button>
              )
            })}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
            <Reveal direction="up" delay={0.1}>
              <div role="button" tabIndex={0} onClick={() => openGallery(galleryTab, 0)} onKeyDown={(e) => e.key === "Enter" && openGallery(galleryTab, 0)} className="cursor-pointer">
                <TiltCard max={4} scale={1.01} className="group relative aspect-[16/10] overflow-hidden">
                  <Image src={galleryPhotos[0] ?? project.coverImage} alt={project.name} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-black/30 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center bg-ink-black/0 opacity-0 transition-all duration-300 group-hover:bg-ink-black/20 group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 bg-card px-4 py-2 text-xs font-bold text-brand-secondary">
                      <Expand className="h-3.5 w-3.5" /> View gallery
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="rounded-full bg-ink-black/70 px-3 py-1 text-xs font-bold text-brand-primary backdrop-blur-sm">
                      {galleryTab} · {galleryPhotos.length} photo{galleryPhotos.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </TiltCard>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {galleryPhotos.slice(1, 3).map((src, i) => (
                <Reveal key={src + i} direction="up" delay={0.15 + i * 0.05}>
                  <button onClick={() => openGallery(galleryTab, i + 1)} className="group relative block aspect-[16/10] w-full overflow-hidden">
                    <Image src={src} alt={`${project.name} — photo ${i + 2}`} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-black/40 to-transparent" />
                  </button>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-RERA trust banner — one line per registration, honest pending state when empty */}
        <Reveal direction="up" delay={0.15}>
          <div className={
            "mt-6 border px-4 py-3 text-sm " +
            (reraOk
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-400")
          }>
            {reraOk ? (
              <div className="space-y-2">
                {project.reraRegistrations.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <FileCheck2 className="h-4 w-4 shrink-0" /> {r.label} — reg. no. {r.number}
                    </div>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold underline underline-offset-2 hover:no-underline">
                        Verify on the state RERA site <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4 shrink-0" /> RERA registration in progress — not yet approved for any phase
              </div>
            )}
          </div>
        </Reveal>

        {/* Main grid */}
        <div className={"mt-8 grid grid-cols-1 gap-8" + (isOwner ? "" : " lg:grid-cols-[1.5fr_1fr]")}>
          <div className="space-y-8">
            {/* Configuration table */}
            <Reveal direction="up">
              <section>
                <h2 className="font-serif text-2xl font-bold text-brand-secondary">Configurations &amp; pricing</h2>
                <div className="mt-4 overflow-hidden border border-brand-border-light">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-tertiary">
                      <tr className="text-[10px] font-bold uppercase tracking-wide text-brand-secondary/55">
                        <th className="px-4 py-2.5 text-left">Configuration</th>
                        <th className="px-4 py-2.5 text-left">Carpet area</th>
                        <th className="px-4 py-2.5 text-left">Price</th>
                        <th className="px-4 py-2.5 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border-light">
                      {project.configurations.map((c) => (
                        <tr key={c.id} className="hover:bg-brand-tertiary/40">
                          <td className="px-4 py-3 font-bold text-brand-secondary">{c.type}</td>
                          <td className="px-4 py-3 text-brand-secondary/70">{c.area}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-brand-primary-dark">{c.price}</div>
                            {c.pricePerSqft && <div className="text-[11px] text-brand-secondary/50">{c.pricePerSqft}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (c.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                              {c.available ? "Available" : "Sold out"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </Reveal>

            {/* Key highlights */}
            {project.highlights.length > 0 && (
              <Reveal direction="up">
                <section>
                  <h2 className="font-serif text-2xl font-bold text-brand-secondary">Key highlights</h2>
                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {project.highlights.map((h, i) => (
                      <motion.div
                        key={h.label}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ x: 3 }}
                        className="flex items-start gap-2.5 border border-brand-border-light bg-card px-3 py-2.5 text-xs font-medium text-brand-secondary"
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-primary/15">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-primary-dark" />
                        </span>
                        <span>
                          <span className="font-bold">{h.label}</span>
                          {h.detail && <span className="block text-brand-secondary/55">{h.detail}</span>}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </Reveal>
            )}

            {/* Description */}
            <Reveal direction="up">
              <section>
                <h2 className="font-serif text-2xl font-bold text-brand-secondary">About this project</h2>
                <p className="mt-3 text-sm leading-relaxed text-brand-secondary/75">{project.description}</p>
              </section>
            </Reveal>

            {/* Amenities — icon left, label right */}
            {project.amenities.length > 0 && (
              <Reveal direction="up">
                <section>
                  <h2 className="font-serif text-2xl font-bold text-brand-secondary">Amenities</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {project.amenities.map((a, i) => {
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
            )}

            {/* Brochure */}
            <Reveal direction="up">
              <section>
                <h2 className="font-serif text-2xl font-bold text-brand-secondary">Project brochure</h2>
                {project.brochureUrl ? (
                  <a
                    href={project.brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold relative mt-4 flex w-fit items-center gap-2 overflow-hidden px-5 py-3 text-sm font-bold"
                  >
                    <span className="relative z-10 flex items-center gap-2"><Download className="h-4 w-4" /> Download brochure (PDF)</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="mt-4 flex w-fit cursor-not-allowed items-center gap-2 border border-brand-border-light bg-brand-surface px-5 py-3 text-sm font-bold text-brand-secondary/50"
                  >
                    <FileText className="h-4 w-4" /> Brochure — coming soon
                  </button>
                )}
              </section>
            </Reveal>
          </div>

          {/* Right — contact roster (sticky), buyer-only */}
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
                        {project.developer.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <div className="font-serif text-base font-bold text-brand-secondary">{project.developer}</div>
                          {project.developerVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-primary-dark" />}
                        </div>
                        <div className="text-xs text-brand-secondary/55">
                          {project.developerVerified ? "Verified developer" : "Not yet verified"}
                          {project.developerMemberSince && <> · Member since {project.developerMemberSince}</>}
                        </div>
                      </div>
                    </div>

                    {/* Contact roster — builder + every authorized broker, each with its own RERA badge */}
                    <div className="mt-5 space-y-3 border-t border-brand-border-light pt-5">
                      <h3 className="font-serif text-sm font-bold text-brand-secondary">Authorized contacts</h3>
                      {project.contacts.map((c) => (
                        <div key={c.id} className="border border-brand-border-light bg-brand-surface/40 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-brand-secondary">{c.name}</div>
                              <div className="text-[11px] text-brand-secondary/55">{c.role}{c.company ? ` · ${c.company}` : ""}</div>
                            </div>
                            {c.reraRegistered ? (
                              <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                <FileCheck2 className="h-2.5 w-2.5" /> RERA
                              </span>
                            ) : (
                              <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                <ShieldAlert className="h-2.5 w-2.5" /> Unregistered
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex gap-1.5">
                            <button
                              onClick={() => handleContact("call", c)}
                              className="flex flex-1 items-center justify-center gap-1.5 bg-ink-black py-2 text-[11px] font-bold text-brand-primary hover:bg-brand-secondary"
                            >
                              <Phone className="h-3 w-3" /> {revealedContactId === c.id ? c.phone : "Call"}
                            </button>
                            <button
                              onClick={() => handleContact("whatsapp", c)}
                              className="flex flex-1 items-center justify-center gap-1.5 border border-brand-border-light bg-card py-2 text-[11px] font-bold text-brand-secondary hover:bg-brand-surface"
                            >
                              <MessageCircle className="h-3 w-3 text-brand-primary-dark" /> WhatsApp
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Enquiry form */}
                    <div className="mt-5 border-t border-brand-border-light pt-5">
                      <button
                        onClick={() => setShowEnquiry((v) => !v)}
                        className="flex w-full items-center justify-between text-left text-sm font-bold text-brand-secondary"
                      >
                        Send an enquiry <ChevronRight className={"h-3.5 w-3.5 transition-transform " + (showEnquiry ? "rotate-90" : "")} />
                      </button>
                      <AnimatePresence>
                        {showEnquiry && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 space-y-2.5">
                              <input
                                value={enquiry.name}
                                onChange={(e) => setEnquiry({ ...enquiry, name: e.target.value })}
                                placeholder="Your name"
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
                              <button
                                onClick={() => primaryContact && handleContact("enquiry_form", primaryContact)}
                                className="btn-gold relative w-full overflow-hidden py-3 text-sm font-bold"
                              >
                                <span className="relative z-10 flex items-center justify-center gap-2">Submit enquiry <ChevronRight className="h-4 w-4" /></span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mt-5 space-y-2 text-[11px] text-brand-secondary/55">
                      <div className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-brand-primary-dark" /> Lead assigned to the contact instantly</div>
                      <div className="flex items-center gap-2"><Sparkles className="h-3 w-3 text-brand-primary-dark" /> No spam — your number stays private</div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3 text-brand-primary-dark" />
                        <AnimatedCounter to={project.viewedThisWeek} duration={1.2} /> people viewed this week
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-brand-primary-dark" />
                        <AnimatedCounter to={project.interestedThisWeek} duration={1} /> people showed interest this week
                      </div>
                    </div>
                  </div>

                  {/* Anonymous gate */}
                  {!user && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card/75 p-6 text-center backdrop-blur-[1px]">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-black">
                        <Lock className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div>
                        <div className="font-serif text-lg font-bold text-brand-secondary">Sign in to contact the builder</div>
                        <p className="mt-1 max-w-[220px] text-sm text-brand-secondary/60">
                          Full contact details for the builder and every authorized broker unlock after you sign in.
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(ROUTES.loginWithReturn(ROUTES.projectDetail(project.id)))}
                        className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold"
                      >
                        <span className="relative z-10">Sign in to continue</span>
                      </button>
                    </div>
                  )}

                  <AnimatePresence>
                    {confirmed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute inset-x-4 bottom-4 z-20 flex items-center gap-2 bg-ink-black px-4 py-3 text-xs font-semibold text-white shadow-xl"
                      >
                        <CheckCircle2 className="h-4 w-4 text-brand-primary" /> Your request was sent — the contact will reach out shortly.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            </div>
          )}
        </div>

        {/* Fullscreen gallery lightbox */}
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
                  {project.name} — {galleryTab} <span className="font-normal text-white/50">— {galleryIndex + 1} / {galleryPhotos.length}</span>
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
                    key={galleryTab + galleryIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="relative h-full w-full"
                  >
                    {galleryPhotos[galleryIndex] && (
                      <Image src={galleryPhotos[galleryIndex]} alt={`${project.name} — photo ${galleryIndex + 1}`} fill sizes="100vw" className="object-contain" />
                    )}
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
                  {GALLERY_TABS.map((tab) => {
                    const count = project.gallery.filter((g) => g.category === tab).length
                    if (count === 0) return null
                    return (
                      <button
                        key={tab}
                        onClick={() => { setGalleryTab(tab); setGalleryIndex(0) }}
                        className={"shrink-0 px-3 py-1.5 text-xs font-bold " + (galleryTab === tab ? "bg-brand-primary text-ink-black" : "border border-white/20 text-white/70 hover:bg-white/10")}
                      >
                        {tab}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {galleryPhotos.map((src, i) => (
                    <button
                      key={src + i}
                      onClick={() => setGalleryIndex(i)}
                      className={"relative h-14 w-20 shrink-0 overflow-hidden border-2 transition-opacity " + (i === galleryIndex ? "border-brand-primary opacity-100" : "border-transparent opacity-50 hover:opacity-80")}
                    >
                      <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                    </button>
                  ))}
                </div>
                <p className="text-center text-[11px] text-white/45">
                  All renders &amp; photos uploaded by {project.developer} · Use ← → to browse, Esc to close
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Owner delete confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this project?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{project.name}&rdquo; will be removed from My Projects and taken off VXP. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteProject(project.id)
                  router.push(ROUTES.dashboardTab("projects"))
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Quota-exhausted upsell */}
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

        {/* Similar projects */}
        <div className="mt-16">
          <Reveal direction="up">
            <h2 className="font-serif text-2xl font-bold text-brand-secondary">Similar new launches nearby</h2>
          </Reveal>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.filter((p) => p.id !== project.id && p.city === project.city).slice(0, 3).map((p, i) => {
              const range = projectPriceRangeCr(p)
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -6 }}
                  onClick={() => router.push(ROUTES.projectDetail(p.id))}
                  className="group cursor-pointer overflow-hidden bg-card ring-1 ring-brand-border-light hover:ring-brand-primary/40"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={p.coverImage} alt={p.name} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 font-serif text-lg font-bold text-white">
                      {range.min === range.max ? `₹ ${range.min} Cr` : `₹ ${range.min} – ${range.max} Cr`}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-serif text-base font-bold text-brand-secondary">{p.name}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-brand-secondary/55"><MapPin className="h-3 w-3 text-brand-primary-dark" /> {p.location}</div>
                  </div>
                </motion.div>
              )
            })}
            {projects.filter((p) => p.id !== project.id && p.city === project.city).length === 0 && (
              <p className="text-sm text-brand-secondary/55">No other developer projects in {project.city} yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
