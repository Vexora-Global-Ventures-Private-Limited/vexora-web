"use client"

import { ArrowRight } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"
import { LinesReveal, MaskReveal } from "@/components/motion/text-reveal"
import { MagneticButton } from "@/components/motion/magnetic-button"
import { scrollToSection } from "@/lib/scroll-to-section"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"

/**
 * The Invitation — monumental closing statement.
 * One headline, one magnetic action, hairline assurances.
 */
export function CTASection() {
  const router = useRouter()
  const user = useNav((s) => s.user)

  return (
    <section className="hero-cinema relative overflow-hidden py-28 sm:py-40">
      {/* Ambient gold breath */}
      <div className="ambient-gold ambient-gold-a" aria-hidden />
      <div className="ambient-gold ambient-gold-b" aria-hidden />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center sm:px-10">
        <MaskReveal>
          <p className="flex items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-primary-light">
            <span className="inline-block h-px w-12 bg-brand-primary/60" aria-hidden />
            The invitation
            <span className="inline-block h-px w-12 bg-brand-primary/60" aria-hidden />
          </p>
        </MaskReveal>

        <LinesReveal
          as="h2"
          className="text-display-cinema mt-10 text-paper-ivory"
          lines={[
            <span key="1">Your next address</span>,
            <span key="2" className="italic text-gold-gradient">already exists.</span>,
          ]}
        />

        <Reveal direction="up" delay={0.25}>
          <p className="mx-auto mt-9 max-w-xl text-base leading-relaxed text-white/58 sm:text-lg">
            1,84,000 buyers use VXP to discover, verify and close India&apos;s
            most premium real estate. We&apos;ll simply introduce you to it.
          </p>
        </Reveal>

        <Reveal direction="up" delay={0.35}>
          <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-6">
            <MagneticButton
              strength={0.25}
              onClick={() => scrollToSection("buy")}
              className="group flex items-center gap-3 bg-brand-primary px-10 py-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-ink-black transition-colors duration-300 hover:bg-brand-primary-light"
            >
              Begin the search
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </MagneticButton>
            <button
              type="button"
              onClick={() => router.push(ROUTES.membership)}
              className="btn-ivory-line group flex items-center gap-3 px-10 py-5 text-[13px] font-semibold uppercase tracking-[0.16em]"
            >
              List your property
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </Reveal>

        <Reveal direction="up" delay={0.4}>
          <button
            type="button"
            onClick={() => router.push(user ? ROUTES.dashboard : ROUTES.login)}
            className="link-editorial mt-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-white/75 transition-colors hover:text-white"
          >
            {user ? "Go to dashboard" : "Speak with an advisor"}
          </button>
        </Reveal>

        <Reveal direction="up" delay={0.45}>
          <dl className="mx-auto mt-20 grid max-w-3xl grid-cols-2 border-t border-white/12 sm:grid-cols-4">
            {[
              "No spam, ever",
              "RERA-registered",
              "Stamp duty guidance",
              "Field-verified",
            ].map((label, i) => (
              <div
                key={label}
                className={
                  "py-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 " +
                  (i !== 0 ? "sm:border-l sm:border-white/10" : "")
                }
              >
                {label}
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  )
}
