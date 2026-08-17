"use client"

import { ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { propertyTypes, LIVING_CATEGORY_FILTER } from "@/lib/vxp-data"
import { ROUTES } from "@/lib/routes"
import { Reveal } from "@/components/motion/reveal"
import { MaskReveal } from "@/components/motion/text-reveal"

/**
 * Ways of living — hairline editorial index. No boxes, no icons in chips;
 * pure typography with a ghost numeral per row.
 */
export function PropertyTypes() {
  const router = useRouter()
  const rows = propertyTypes

  const goToCategory = (name: string) => {
    const mapped = LIVING_CATEGORY_FILTER[name] ?? {}
    const params = new URLSearchParams()
    if (mapped.type) params.set("propertyType", mapped.type)
    if (mapped.status) params.set("status", mapped.status)
    const qs = params.toString()
    router.push(qs ? `${ROUTES.properties}?${qs}` : ROUTES.properties)
  }

  return (
    <section id="rent" className="bg-card py-24 sm:py-28">
      <div className="mx-auto max-w-[90rem] px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Left — sticky heading */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <MaskReveal>
              <p className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-primary-dark">
                <span className="inline-block h-px w-12 bg-brand-primary/60" aria-hidden />
                Ways of living
              </p>
            </MaskReveal>
            <Reveal direction="up" delay={0.08}>
              <h2 className="text-display-grand mt-6 text-brand-secondary">
                Choose your <span className="italic text-gold-gradient">manner</span> of residence.
              </h2>
            </Reveal>
            <Reveal direction="up" delay={0.16}>
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-brand-secondary/60">
                Five disciplines of Indian luxury living — each with its own
                verified inventory, each held to the same standard of provenance.
              </p>
            </Reveal>
          </div>

          {/* Right — hairline index */}
          <div>
            {rows.map((pt, i) => (
              <Reveal key={pt.name} direction="up" index={i} staggerStep={0.07}>
                <button
                  type="button"
                  onClick={() => goToCategory(pt.name)}
                  className="maison-row group w-full grid-cols-[auto_1fr_auto] gap-6 py-8 text-left hover:pl-4 sm:grid-cols-[5rem_1fr_auto]"
                >
                  <span className="folio-numeral hidden !text-[3rem] transition-colors sm:block" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block font-serif text-2xl font-semibold text-brand-secondary transition-colors duration-300 group-hover:text-brand-primary-dark sm:text-3xl">
                      {pt.name}
                    </span>
                    <span className="mt-1.5 block text-sm text-brand-secondary/55">
                      {pt.desc} · <span className="font-medium text-brand-secondary/70">{pt.count}</span>
                    </span>
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center self-center rounded-full border border-brand-secondary/15 text-brand-secondary/50 transition-all duration-400 group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-ink-black">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </button>
              </Reveal>
            ))}
            <div className="hairline-row" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  )
}
