"use client"

import { Globe2, ShieldCheck, Lock, BadgeCheck } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"

const signals = [
  { icon: Globe2, label: "Global" },
  { icon: ShieldCheck, label: "Secure" },
  { icon: Lock, label: "Private" },
  { icon: BadgeCheck, label: "RERA" },
] as const

export function ExclusivityBar() {
  return (
    <section aria-hidden className="border-y border-brand-border/80 bg-gradient-to-r from-brand-tertiary via-white to-brand-tertiary">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-3 px-6 py-4 sm:gap-6">
        {signals.map((s, i) => (
          <Reveal key={s.label} index={i} staggerStep={0.05}>
            <div className="exclusivity-chip">
              <s.icon className="h-4 w-4 text-brand-primary-dark" strokeWidth={2} />
              <span>{s.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
