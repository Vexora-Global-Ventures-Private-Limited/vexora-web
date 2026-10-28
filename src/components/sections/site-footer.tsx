"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, MapPin, Mail, Phone } from "lucide-react"
import { popularCities } from "@/lib/vxp-data"
import { ROUTES } from "@/lib/routes"
import { formatPaise } from "@/lib/api-mappers"
import { isValidEmail } from "@/lib/profile-options"
import { useGetMembershipPlansQuery } from "@/store/api/billingApi"

/** href null = no page exists yet — rendered as plain text, never a dead "#" link. */
type FooterLink = { label: string; href: string | null }

// Property types match the admin-configured list (GET /config/public) —
// the old "Penthouse" link filtered on a type that doesn't exist.
const residenceLinks: FooterLink[] = [
  { label: "Apartments", href: ROUTES.propertiesSearch({ propertyType: "apartment" }) },
  { label: "Villas", href: ROUTES.propertiesSearch({ propertyType: "villa" }) },
  { label: "Plots & land", href: ROUTES.propertiesSearch({ propertyType: "plot" }) },
  { label: "Commercial", href: ROUTES.commercial },
  { label: "New projects", href: ROUTES.projects },
]

const companyLinks: FooterLink[] = [
  { label: "About VXP", href: null },
  { label: "Careers", href: null },
  { label: "Press", href: null },
  { label: "Contact", href: "mailto:care@vxp.in" },
  { label: "Partner with us", href: ROUTES.signup },
]

const socials = ["Instagram", "LinkedIn", "X", "YouTube"]

/** Plan names + live prices from GET /membership-plans (the hardcoded ones were wrong). */
function useMembershipLinks(): FooterLink[] {
  const { data: plans } = useGetMembershipPlansQuery()
  const planLinks: FooterLink[] = plans?.length
    ? [...plans]
        .sort((a, b) => a.pricePaise - b.pricePaise)
        .map((p) => ({ label: `${p.name} · ${p.pricePaise ? formatPaise(p.pricePaise) : "Free"}`, href: ROUTES.membership }))
    : ["Mercury", "Jupiter", "Venus"].map((name) => ({ label: name, href: ROUTES.membership }))
  return [...planLinks, { label: "Referral program", href: ROUTES.membership }]
}

function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [note, setNote] = useState<string | null>(null)
  return (
    <form
      className="group"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        // No newsletter API exists yet — say so instead of silently
        // swallowing the address and implying it was saved.
        setNote(
          isValidEmail(email)
            ? "Newsletter sign-ups open soon — nothing was saved yet. Create an account to save homes you like."
            : "Enter a valid email address.",
        )
      }}
    >
      <div className="flex items-end gap-4 border-b border-white/25 pb-3 transition-colors focus-within:border-brand-primary">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setNote(null)
          }}
          placeholder="Your email address"
          autoComplete="email"
          className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-white/30"
          aria-label="Email address"
          aria-describedby="newsletter-note"
        />
        <button
          type="submit"
          className="flex shrink-0 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-primary-light transition-colors hover:text-brand-primary"
        >
          Subscribe <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      <p id="newsletter-note" className="mt-2 min-h-4 text-xs text-white/55" aria-live="polite">
        {note}
      </p>
    </form>
  )
}

export function SiteFooter() {
  const footerNav: { title: string; links: FooterLink[] }[] = [
    { title: "Residences", links: residenceLinks },
    { title: "Cities", links: popularCities.map((c) => ({ label: c.name, href: ROUTES.cityDetail(c.slug) })) },
    { title: "Membership", links: useMembershipLinks() },
    { title: "Company", links: companyLinks },
  ]

  return (
    <footer className="bg-ink-cinema text-white/60">
      {/* Newsletter — hairline editorial band */}
      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-8 px-6 py-16 sm:px-10 md:grid-cols-[1.2fr_1fr] md:items-end lg:px-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-primary-light">
              The private list
            </p>
            <h3 className="mt-4 font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl">
              New residences, before they&apos;re public.
            </h3>
          </div>
          <NewsletterForm />
        </div>
      </div>

      {/* Nav + contact */}
      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-14 px-6 py-16 sm:px-10 lg:grid-cols-[1.1fr_2fr] lg:px-16">
          <div>
            <p className="font-serif text-2xl font-semibold tracking-tight text-white">VXP</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-primary-light">
              Elite Real Estate
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/50">
              India&apos;s premium real estate marketplace — visibility and leads
              for elite buyers, brokers, developers and investors. No
              commissions. No settlement.
            </p>
            {/* SAMPLE CONTACT DETAILS — placeholders until the real office address and phone are supplied (UNRESOLVED #50). */}
            <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Sample contact details</p>
            <address className="mt-2 space-y-2.5 text-sm not-italic text-white/55">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                Pinnacle Corporate Park, BKC, Mumbai 400051
              </p>
              <p className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                +91 22 5550 0199
              </p>
              <p className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                care@vxp.in
              </p>
            </address>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {footerNav.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/85">
                  {col.title}
                </h4>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.href ? (
                        <Link
                          href={l.href}
                          className="text-sm text-white/48 transition-colors duration-300 hover:text-brand-primary-light"
                        >
                          {l.label}
                        </Link>
                      ) : (
                        <span className="text-sm text-white/30" title="Coming soon">
                          {l.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </div>

      {/* Monumental wordmark */}
      <div className="overflow-hidden px-6 sm:px-10 lg:px-16" aria-hidden>
        <p className="footer-wordmark translate-y-[12%] text-center">VXP</p>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[90rem] flex-col items-center justify-between gap-4 px-6 py-6 text-[11px] uppercase tracking-[0.12em] text-white/35 sm:px-10 md:flex-row lg:px-16">
          <p>© 2026 VXP Real Estate Marketplace Pvt. Ltd.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {/* No social profiles to link to yet — plain text, not dead "#" links. */}
            {socials.map((s) => (
              <span key={s} className="text-white/25" title="Coming soon">
                {s}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {/* Legal pages don't exist yet (see review notes) — plain text until they do. */}
            <span className="text-white/25" title="Coming soon">Privacy</span>
            <span className="text-white/25" title="Coming soon">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
