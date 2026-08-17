"use client"

import { Marquee } from "@/components/motion/marquee"
import { Crown } from "lucide-react"

const items = [
  "Verified Inventory",
  "RERA-Registered Agents",
  "True-to-Life Photos",
  "DLD-Compliant Paperwork",
  "Dedicated Deal Manager",
  "Transparent Pricing",
  "24-Hour Pre-Launch Access",
  "No Ghost Listings",
  "Lead Pipeline CRM",
  "Sponsored Placements",
]

export function MarqueeBand({
  variant = "dark",
}: {
  variant?: "dark" | "gold" | "light"
}) {
  const styles =
    variant === "dark"
      ? "royal-dark border-y border-brand-primary-muted/15 py-6 text-paper-ivory"
      : variant === "gold"
      ? "border-y border-brand-border bg-brand-accent py-5 text-brand-secondary"
      : "border-y border-brand-border bg-brand-tertiary py-5 text-brand-secondary"

  return (
    <div className={styles}>
      <div className="section-rule mx-auto mb-4 max-w-7xl opacity-60" aria-hidden />
      <Marquee speedSec={40}>
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-6 px-6">
            <span className="font-serif text-base font-semibold uppercase tracking-[0.2em] opacity-90 sm:text-lg">
              {it}
            </span>
            <Crown className="h-3.5 w-3.5 fill-current opacity-60" />
          </div>
        ))}
      </Marquee>
      <div className="section-rule mx-auto mt-4 max-w-7xl opacity-60" aria-hidden />
    </div>
  )
}
