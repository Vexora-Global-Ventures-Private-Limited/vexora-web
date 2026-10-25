"use client"

import { motion } from "framer-motion"
import { Check, Crown, Briefcase, Building2, Sparkles, ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/sections/section-heading"
import { useLiveTiers, type LiveTier } from "@/components/billing/live-tiers"
import { ROUTES } from "@/lib/routes"

const tierIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  M: Crown,
  J: Briefcase,
  V: Building2,
}

export function MembershipTiers() {
  // Live price/duration/quota from GET /membership-plans over the static copy.
  const { tiers } = useLiveTiers()
  return (
    <section id="membership" className="paper-texture section-home">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          align="center"
          eyebrow="VXP Membership Ecosystem"
          title={<>Three tiers. One marketplace.</>}
          description="From referral rewards to broker CRM to enterprise inventory management — pick the membership that fits your role in India's real estate ecosystem."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
          className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          {tiers.map((tier) => (
            <TierCard key={tier.code} tier={tier} />
          ))}
        </motion.div>

        {/* Bottom rule */}
        <Reveal direction="up" delay={0.2}>
          <p className="mt-12 text-center text-sm text-brand-secondary/55">
            All memberships include listing uploads (photos, videos, floor plans, maps, amenities) and
            <span className="font-semibold text-brand-secondary"> smart-match lead notifications.</span>
            <br />
            VXP does not collect commissions or settle property sales — membership fees are the only revenue.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function TierCard({ tier }: { tier: LiveTier }) {
  const router = useRouter()
  const Icon = tierIcons[tier.code] ?? Crown
  const popular = tier.popular

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const } },
      }}
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={
        "group relative flex flex-col overflow-hidden p-8 transition-shadow " +
        (popular
          ? "tier-glow bg-ink-black text-white lg:-mt-4 lg:mb-4"
          : "bg-card text-brand-secondary ring-1 ring-brand-border hover:shadow-[var(--shadow-royal-md)]")
      }
    >
      {/* Popular ribbon */}
      {popular && (
        <div className="absolute right-6 top-6 inline-flex items-center gap-1 rounded-full border border-brand-primary-muted/40 bg-ink-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-primary-light">
          <Sparkles className="h-3 w-3" /> Most Popular
        </div>
      )}

      <div className="relative">
        {/* Tier code + icon */}
        <div className="flex items-center gap-3">
          <div
            className={
              "grid h-12 w-12 place-items-center bg-gradient-to-br " +
              tier.accent +
              " shadow-lg"
            }
          >
            <Icon className="h-5 w-5 text-brand-secondary" />
          </div>
          <div>
            <div className={"font-serif text-2xl font-bold " + (popular ? "text-white" : "text-brand-secondary")}>
              {tier.name}
            </div>
            <div className={"text-[10px] font-semibold uppercase tracking-[0.2em] " + (popular ? "text-brand-primary" : "text-brand-primary-dark")}>
              Tier {tier.code}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p className={"mt-4 text-sm " + (popular ? "text-white/70" : "text-brand-secondary/65")}>
          {tier.tagline}
        </p>

        {/* Price */}
        <div className="mt-6 flex items-end gap-2">
          <span className={"font-serif text-5xl font-bold " + (popular ? "text-white" : "text-brand-secondary")}>
            {tier.price}
          </span>
          <span className={"mb-1.5 text-sm " + (popular ? "text-white/60" : "text-brand-secondary/55")}>
            {tier.unavailable ? "" : `/ ${tier.duration}`}
          </span>
        </div>

        {/* Audience */}
        <div className={"mt-5 border px-4 py-3 text-xs " + (popular ? "border-white/15 bg-white/5 text-white/70" : "border-brand-border-light bg-brand-surface text-brand-secondary/70")}>
          <div className={"text-[10px] font-semibold uppercase tracking-[0.16em] " + (popular ? "text-brand-primary" : "text-brand-primary-dark")}>
            Target audience
          </div>
          <div className="mt-1 font-medium">{tier.audience}</div>
        </div>

        {/* Purpose */}
        <p className={"mt-4 text-sm italic " + (popular ? "text-white/60" : "text-brand-secondary/55")}>
          {tier.purpose}
        </p>

        {/* Listings */}
        <div className={"mt-5 flex items-baseline gap-2 border-y py-3 " + (popular ? "border-white/15" : "border-brand-border-light")}>
          <span className={"font-serif text-3xl font-bold " + (popular ? "text-brand-primary" : "text-brand-primary-dark")}>
            {tier.unavailable ? "—" : tier.listings}
          </span>
          <span className={"text-sm " + (popular ? "text-white/70" : "text-brand-secondary/70")}>
            listings included
          </span>
        </div>

        {/* Features */}
        <ul className="mt-6 space-y-3">
          {tier.features.map((f, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.04, duration: 0.4 }}
              className="flex items-start gap-2.5 text-sm"
            >
              <Check className={"mt-0.5 h-4 w-4 shrink-0 " + (popular ? "text-brand-primary" : "text-brand-primary-dark")} />
              <span className={popular ? "text-white/85" : "text-brand-secondary/80"}>{f}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => router.push(ROUTES.membership)}
        className={
          "mt-8 inline-flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all " +
          (popular
            ? "btn-gold relative overflow-hidden"
            : "bg-ink-black text-brand-primary hover:bg-ink-deep")
        }
      >
        <span className="relative z-10 flex items-center gap-2">
          Choose {tier.name}
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </motion.button>
    </motion.div>
  )
}
