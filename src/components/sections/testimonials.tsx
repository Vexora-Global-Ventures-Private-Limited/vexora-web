"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { testimonials } from "@/lib/vxp-data"
import { Reveal } from "@/components/motion/reveal"
import { MaskReveal } from "@/components/motion/text-reveal"
import { EASE_OUT } from "@/lib/motion-tokens"

const AUTO_ADVANCE_MS = 9000

/**
 * Words kept — one monumental editorial quote at a time,
 * with hairline pagination. Replaces the three-card grid.
 */
export function Testimonials() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduce = useReducedMotion()
  const t = testimonials[index]

  const advance = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + testimonials.length) % testimonials.length),
    [],
  )

  useEffect(() => {
    if (paused || reduce) return
    const id = setInterval(() => advance(1), AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [paused, reduce, advance])

  return (
    <section
      className="bg-brand-tertiary py-24 sm:py-32"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        <MaskReveal>
          <p className="flex items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-primary-dark">
            <span className="inline-block h-px w-12 bg-brand-primary/60" aria-hidden />
            Words kept · Sample testimonials
            <span className="inline-block h-px w-12 bg-brand-primary/60" aria-hidden />
          </p>
        </MaskReveal>

        <Reveal direction="none" delay={0.1}>
          <div className="relative mt-14 min-h-[22rem] sm:min-h-[19rem]" aria-live="polite">
            <span className="quote-ligature absolute -top-8 left-0 select-none sm:-left-4" aria-hidden>
              &ldquo;
            </span>
            <AnimatePresence mode="wait">
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: reduce ? 0.01 : 0.6, ease: EASE_OUT }}
                className="relative"
              >
                <blockquote className="text-balance text-center font-serif text-2xl font-medium leading-[1.35] text-brand-secondary sm:text-[1.75rem]">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-10 text-center">
                  <p className="font-serif text-lg font-semibold text-brand-secondary">{t.name}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-secondary/50">
                    {t.role} · {t.city}
                  </p>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
        </Reveal>

        {/* Hairline pagination */}
        <Reveal direction="up" delay={0.15}>
          <div className="mt-12 flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={() => advance(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-secondary/18 text-brand-secondary/60 transition-all duration-300 hover:border-brand-primary hover:bg-brand-primary hover:text-ink-black"
              aria-label="Previous story"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3" role="tablist" aria-label="Testimonials">
              {testimonials.map((item, i) => (
                <button
                  key={item.name}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Story ${i + 1}: ${item.name}`}
                  onClick={() => setIndex(i)}
                  className={
                    "h-px transition-all duration-500 " +
                    (i === index ? "w-12 bg-brand-primary-dark" : "w-6 bg-brand-secondary/25 hover:bg-brand-secondary/50")
                  }
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => advance(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-secondary/18 text-brand-secondary/60 transition-all duration-300 hover:border-brand-primary hover:bg-brand-primary hover:text-ink-black"
              aria-label="Next story"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
