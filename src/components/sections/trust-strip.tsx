"use client"

/**
 * Provenance band — a single kinetic hairline strip replacing the old
 * ExclusivityBar + TrustStrip stack. Slow gold ticker, editorial type.
 */
const marks = [
  "RERA-registered advisors",
  "100% field-verified inventory",
  "Private by design",
  "₹ 92,000 Cr+ closed volume",
  "25 Indian cities",
  "Zero commission, zero spam",
]

export function TrustStrip() {
  return (
    <section
      aria-label="Platform standards"
      className="overflow-hidden border-y border-brand-border/70 bg-brand-tertiary py-5"
    >
      <div className="ticker-track items-center" aria-hidden>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {marks.map((m) => (
              <span
                key={`${copy}-${m}`}
                className="flex items-center gap-8 pr-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-secondary/55"
              >
                {m}
                <span className="inline-block h-1 w-1 rotate-45 bg-brand-primary" />
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="sr-only">{marks.join(". ")}</p>
    </section>
  )
}
