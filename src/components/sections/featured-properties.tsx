"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowUpRight, ArrowRight, Lock, Phone, Mail, Building2, Heart } from "lucide-react"
import { properties, type Property } from "@/lib/vxp-data"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/motion/reveal"
import { LinesReveal, MaskReveal } from "@/components/motion/text-reveal"
import { useRouter } from "next/navigation"
import { useNav } from "@/lib/nav-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { ROUTES } from "@/lib/routes"
import { SponsoredPropertiesAdSlot } from "@/components/ads/sponsored-properties-ad-slot"

const priorityOrder: Record<string, number> = { Sponsored: 0, Featured: 1, Organic: 2 }
const sorted = [...properties].sort(
  (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || (a.pos ?? 99) - (b.pos ?? 99),
)

const lead = sorted[0]
const rest = sorted.slice(1, 5)

export function FeaturedProperties() {
  const { user } = useNav()
  const router = useRouter()
  const [gated, setGated] = useState<Property | null>(null)
  const shortlistedIds = useShortlistStore((s) => s.shortlistedIds)
  const toggleShortlist = useShortlistStore((s) => s.toggleShortlist)

  const handleView = (p: Property) => {
    if (!user) {
      setGated(p)
      return
    }
    router.push(ROUTES.propertyDetail(p.id))
  }

  return (
    <section id="buy" aria-label="The collection" className="bg-brand-tertiary pt-14 pb-24 sm:pt-16 sm:pb-32">
      <div className="mx-auto max-w-[90rem] px-6 sm:px-10 lg:px-16">
        {/* Editorial header */}
        <div className="flex items-end justify-between gap-8">
          <div>
            <MaskReveal>
              <p className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-primary-dark">
                <span className="folio-numeral !text-[2.5rem]" aria-hidden>01</span>
                The Collection
              </p>
            </MaskReveal>
            <LinesReveal
              as="h2"
              className="text-display-grand mt-0 text-brand-secondary"
              lineClassName="leading-[1.02]"
              lines={[
                <span key="1">Residences of</span>,
                <span key="2" className="italic text-gold-gradient">rare provenance.</span>,
              ]}
            />
          </div>
          <Reveal direction="up" delay={0.2} className="hidden shrink-0 pb-2 md:block">
            <button
              type="button"
              onClick={() => handleView(lead)}
              className="link-editorial text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-secondary"
            >
              The full portfolio <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Reveal>
        </div>

        {/* Sponsored Properties ad — real advertiser placement, "top of listings". */}
        <Reveal direction="up" delay={0.05} className="mt-10">
          <SponsoredPropertiesAdSlot />
        </Reveal>

        {/* Lead residence — monumental editorial spread */}
        <Reveal direction="up" delay={0.1} className="mt-10">
          <article
            className="group grid cursor-pointer grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-14"
            onClick={() => handleView(lead)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleView(lead)}
            aria-label={`${lead.title} — ${lead.price}`}
          >
            <div className="media-reveal relative aspect-[16/10] lg:aspect-auto lg:min-h-[36rem]">
              <Image
                src={lead.image}
                alt={lead.title}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-cinema/50 via-transparent to-transparent" />
              <span className="absolute left-6 top-6 border border-white/25 bg-black/30 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur-md">
                Private launch
              </span>
              {!user ? (
                <span className="absolute bottom-6 right-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-md">
                  <Lock className="h-4 w-4" />
                </span>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleShortlist(lead.id) }}
                  aria-pressed={shortlistedIds.includes(lead.id)}
                  aria-label={shortlistedIds.includes(lead.id) ? "Remove from shortlist" : "Add to shortlist"}
                  className={
                    "absolute bottom-6 right-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-md hover:bg-black/50 " +
                    (shortlistedIds.includes(lead.id) ? "text-brand-primary" : "")
                  }
                >
                  <Heart className={"h-4 w-4" + (shortlistedIds.includes(lead.id) ? " fill-brand-primary" : "")} />
                </button>
              )}
            </div>

            <div className="flex flex-col justify-between py-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-primary-dark">
                  {lead.developer} · {lead.location}
                </p>
                <h3 className="mt-4 font-serif text-3xl font-semibold leading-[1.08] text-brand-secondary sm:text-4xl lg:text-[2.75rem]">
                  {lead.title}
                </h3>
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-brand-secondary/62">
                  A sky residence conceived for those who measure a home in
                  horizons — {lead.beds} bedrooms, {lead.area} of glass-lined
                  living, and the Arabian Sea below.
                </p>

                <dl className="mt-9 grid grid-cols-3 border-t border-brand-secondary/12">
                  {[
                    { k: "Bedrooms", v: String(lead.beds) },
                    { k: "Area", v: lead.area },
                    { k: "Status", v: lead.status },
                  ].map((item, i) => (
                    <div key={item.k} className={"py-4 " + (i !== 0 ? "border-l border-brand-secondary/10 pl-5" : "pr-5")}>
                      <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-brand-secondary/45">{item.k}</dt>
                      <dd className="mt-1 font-serif text-base font-semibold text-brand-secondary">{item.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-10 flex items-end justify-between border-t border-brand-secondary/12 pt-7">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-brand-secondary/45">From</p>
                  <p className="mt-1 font-serif text-3xl font-semibold text-brand-secondary">{lead.price}</p>
                </div>
                <span className="btn-piano px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em]">
                  {user ? "View residence" : "Request access"}
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </article>
        </Reveal>

        {/* Indexed grid */}
        <div className="mt-20 grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {rest.map((p, i) => (
            <Reveal key={p.id} direction="up" index={i} staggerStep={0.08}>
              <article
                className="group cursor-pointer"
                onClick={() => handleView(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleView(p)}
                aria-label={`${p.title} — ${p.price}`}
              >
                <div className="media-reveal relative aspect-[4/5]">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-cinema/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  {!user ? (
                    <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white opacity-0 backdrop-blur-md transition-opacity duration-500 group-hover:opacity-100">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleShortlist(p.id) }}
                      aria-pressed={shortlistedIds.includes(p.id)}
                      aria-label={shortlistedIds.includes(p.id) ? "Remove from shortlist" : "Add to shortlist"}
                      className={
                        "absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-md hover:bg-black/50 " +
                        (shortlistedIds.includes(p.id) ? "text-brand-primary opacity-100" : "opacity-0 group-hover:opacity-100")
                      }
                    >
                      <Heart className={"h-3.5 w-3.5" + (shortlistedIds.includes(p.id) ? " fill-brand-primary" : "")} />
                    </button>
                  )}
                </div>

                <div className="mt-5 border-t border-brand-secondary/12 pt-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-primary-dark">
                      {String(i + 2).padStart(2, "0")} · {p.city}
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-brand-secondary/40">
                      {p.type}
                    </p>
                  </div>
                  <h3 className="mt-2.5 line-clamp-2 font-serif text-lg font-semibold leading-snug text-brand-secondary">
                    {p.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-serif text-lg font-semibold text-brand-secondary">{p.price}</p>
                    <ArrowUpRight className="h-4 w-4 text-brand-secondary/35 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-primary-dark" />
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Mobile CTA */}
        <Reveal direction="up" className="mt-14 md:hidden">
          <button
            type="button"
            onClick={() => router.push(ROUTES.properties)}
            className="btn-piano w-full justify-center px-7 py-4 text-[12px] font-semibold uppercase tracking-[0.14em]"
          >
            The full portfolio <ArrowRight className="h-4 w-4" />
          </button>
        </Reveal>
      </div>

      <LoginGateDialog
        property={gated}
        onClose={() => setGated(null)}
        onLogin={() => {
          setGated(null)
          router.push(ROUTES.login)
        }}
      />
    </section>
  )
}

function LoginGateDialog({
  property,
  onClose,
  onLogin,
}: {
  property: Property | null
  onClose: () => void
  onLogin: () => void
}) {
  return (
    <Dialog open={!!property} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-none border-brand-border-light p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Authentication required</DialogTitle>
          <DialogDescription>
            Log in or sign up to view complete property details, contact information, and floor plans.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative hidden md:block">
            {property && (
              <>
                <Image src={property.image} alt={property.title} fill sizes="50vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-cinema/92 via-ink-cinema/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">
                    {property.type} · {property.location}
                  </span>
                  <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight text-white">{property.title}</h3>
                  <div className="mt-3 inline-flex w-fit items-center gap-1.5 border border-white/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    <Lock className="h-3 w-3" /> Full details locked
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col p-7">
            <div className="mb-1 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center bg-brand-secondary">
                <Lock className="h-4 w-4 text-brand-primary" />
              </div>
              <span className="font-serif text-lg font-semibold text-brand-secondary">Private access</span>
            </div>
            <p className="text-sm text-brand-secondary/65">
              Sign in to view complete details, owner contact, floor plans, and to submit an enquiry.
            </p>

            <div className="mt-5 space-y-2.5">
              <Button onClick={onLogin} className="btn-piano w-full rounded-none py-3 text-sm font-semibold">
                Continue with Google
              </Button>
              <Button
                onClick={onLogin}
                variant="outline"
                className="w-full rounded-none border-brand-border-light py-3 text-sm font-semibold text-brand-secondary hover:bg-brand-surface"
              >
                <Phone className="mr-2 h-4 w-4 text-brand-primary-dark" /> Mobile + OTP
              </Button>
              <Button
                onClick={onLogin}
                variant="outline"
                className="w-full rounded-none border-brand-border-light py-3 text-sm font-semibold text-brand-secondary hover:bg-brand-surface"
              >
                <Mail className="mr-2 h-4 w-4 text-brand-primary-dark" /> Email + Password
              </Button>
            </div>

            <div className="mt-5 flex items-center justify-between bg-brand-surface px-4 py-3 text-xs text-brand-secondary/70">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-brand-primary-dark" /> Free accounts
              </span>
              <span className="font-semibold text-brand-secondary">2 lifetime contacts</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
