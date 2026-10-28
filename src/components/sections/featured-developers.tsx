"use client"

import { ArrowUpRight, ArrowRight, BadgeCheck } from "lucide-react"
import { useGetFeaturedBuildersQuery } from "@/store/api/listingsApi"
import { Reveal } from "@/components/motion/reveal"
import { LinesReveal, MaskReveal } from "@/components/motion/text-reveal"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { FeaturedDeveloperAdSlot } from "@/components/ads/featured-developer-ad-slot"

/**
 * The Maisons — developers presented as a couture house index.
 * Dark ground, hairline rows, serif nameplates. No cards, no chips.
 *
 * Real data: GET /builders/featured (developers with an active "featured"
 * ad — viewer's city first). The whole section stays hidden while that list
 * is empty rather than padding it with placeholder developers.
 */
export function FeaturedDevelopers() {
  const router = useRouter()
  const { data: developers = [] } = useGetFeaturedBuildersQuery()

  if (developers.length === 0) return null

  return (
    <section id="developers" className="royal-dark py-24 sm:py-32">
      <div className="mx-auto max-w-[90rem] px-6 sm:px-10 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <MaskReveal>
              <p className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-primary-light">
                <span className="inline-block h-px w-12 bg-brand-primary/60" aria-hidden />
                The Maisons
              </p>
            </MaskReveal>
            <LinesReveal
              as="h2"
              className="text-display-grand mt-6 text-paper-ivory"
              lines={[
                <span key="1">Built by houses</span>,
                <span key="2">of <span className="italic text-gold-gradient">consequence.</span></span>,
              ]}
            />
          </div>
          <Reveal direction="up" delay={0.2} className="max-w-xs pb-2">
            <p className="text-sm leading-relaxed text-white/55">
              {developers.length} featured developer{developers.length === 1 ? "" : "s"}. Pre-launch access and
              project-level detail, direct from each house.
            </p>
          </Reveal>
        </div>

        {/* Featured Developer ad — real advertiser placement, same slot used on city pages. */}
        <Reveal direction="up" delay={0.1} className="mt-14">
          <FeaturedDeveloperAdSlot developerNames={developers.map((d) => d.displayName)} dark />
        </Reveal>

        {/* Maison index */}
        <div className="mt-10">
          {developers.map((d, i) => (
            <Reveal key={d._id} direction="up" index={i} staggerStep={0.06}>
              <button
                type="button"
                // The builder's own page when it has a slug; otherwise a project search by name.
                onClick={() =>
                  router.push(d.slug ? ROUTES.builderDetail(d.slug) : `${ROUTES.projects}?q=${encodeURIComponent(d.displayName)}`)
                }
                className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-5 border-t border-white/12 py-7 text-left transition-all duration-500 hover:bg-white/[0.035] hover:pl-5 sm:grid-cols-[4.5rem_1.6fr_1fr_auto] sm:gap-8"
              >
                <span className="folio-numeral folio-numeral-dark hidden !text-[2.5rem] sm:block" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span>
                  <span className="flex items-center gap-3">
                    <span className="font-serif text-2xl font-semibold text-white transition-colors duration-300 group-hover:text-brand-primary-light sm:text-3xl">
                      {d.displayName}
                    </span>
                    {d.badge && <BadgeCheck className="h-5 w-5 text-brand-primary-light" aria-label="Verified developer" />}
                    <span className="hidden border border-brand-primary/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-brand-primary-light md:inline-block">
                      Featured
                    </span>
                  </span>
                  {d.city && <span className="mt-1 block text-sm text-white/45">{d.city}</span>}
                </span>

                <span className="hidden text-right sm:block">
                  {typeof d.projectCount === "number" && (
                    <span className="block font-serif text-lg font-semibold text-white/85">
                      {d.projectCount} project{d.projectCount === 1 ? "" : "s"}
                    </span>
                  )}
                </span>

                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/18 text-white/60 transition-all duration-400 group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-ink-black">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </button>
            </Reveal>
          ))}
          <div className="border-t border-white/12" aria-hidden />
        </div>

        {/* Developer invitation */}
        <Reveal direction="up" delay={0.15}>
          <div className="mt-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <p className="max-w-md text-sm leading-relaxed text-white/50">
              Represent a house of comparable standing?{" "}
              <span className="text-white/80">Apply for a featured placement</span> —
              account and campaign approval required.
            </p>
            <button
              type="button"
              onClick={() => router.push(ROUTES.promote)}
              className="btn-ivory-line shrink-0 px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.14em]"
            >
              Apply for placement <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
