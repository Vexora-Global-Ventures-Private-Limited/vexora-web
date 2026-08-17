"use client"

import { motion } from "framer-motion"
import { ShieldCheck, Camera, Headset, BadgeDollarSign } from "lucide-react"
import { Reveal } from "@/components/motion/reveal"

const features = [
  {
    icon: ShieldCheck,
    title: "100% verified listings",
    body: "Every property is physically visited and re-photographed by our field team within the last 90 days. No ghosts, no bait-and-switch.",
    accent: "Every listing carries a Verified badge only after a field agent confirms the address, owner, and current condition.",
  },
  {
    icon: Camera,
    title: "True-to-life media",
    body: "Wide-angle lies are banned. Photos, floor plans, and 360° tours match what you'll actually see on a site visit.",
    accent: "Each tour is shot at the same time of day as the listing's headline photo, so lighting surprises are eliminated.",
  },
  {
    icon: Headset,
    title: "Dedicated deal manager",
    body: "From first call to handover, a single point-of-contact handles paperwork, Escrow, and DLD registration.",
    accent: "Your deal manager's name, photo, and direct WhatsApp appear in your dashboard the moment you shortlist a property.",
  },
  {
    icon: BadgeDollarSign,
    title: "Transparent pricing",
    body: "Price-per-square-foot benchmarks are shown next to every listing, pulled from the last 90 days of DLD transactions.",
    accent: "You'll know whether the asking price is in the 25th or 75th percentile for that building before you make an offer.",
  },
]

export function WhyChooseUs() {
  return (
    <section id="insights" className="bg-brand-surface py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Left intro */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal direction="left">
              <div className="mb-3 flex items-center gap-3">
                <span className="h-px w-12 bg-brand-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-primary">
                  Why Estatara
                </span>
              </div>
            </Reveal>
            <Reveal direction="up" delay={0.1}>
              <h2 className="text-balance text-3xl font-bold leading-tight text-brand-secondary sm:text-4xl md:text-5xl">
                Built for buyers who&apos;ve been burned by other portals.
              </h2>
            </Reveal>
            <Reveal direction="up" delay={0.2}>
              <p className="mt-5 text-base leading-relaxed text-brand-secondary/65">
                The reason most property searches take six months isn&apos;t the
                market — it&apos;s the noise. Estatara strips out the noise. We
                start with verified inventory, true-to-life media, and a real
                human on the other end of every enquiry. Everything else is
                designed to disappear.
              </p>
            </Reveal>
            <Reveal direction="up" delay={0.3}>
              <div className="mt-8 inline-flex items-center gap-3 bg-card px-5 py-4 ring-1 ring-brand-secondary/8">
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.4 }}
                  className="grid h-11 w-11 place-items-center bg-brand-primary/15 text-2xl font-bold text-brand-primary"
                >
                  4.9
                </motion.div>
                <div>
                  <div className="text-sm font-bold text-brand-secondary">4.9 / 5 from 18,400+ buyers</div>
                  <div className="text-xs text-brand-secondary/55">Across Dubai, Mumbai, Bengaluru & Delhi NCR</div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right feature grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className={"group flex flex-col bg-card p-6 ring-1 ring-brand-secondary/8 transition-all hover:shadow-xl hover:shadow-brand-secondary/5 hover:ring-brand-primary/30 " + (i % 2 === 1 ? "sm:mt-10" : "")}
              >
                <motion.div
                  whileHover={{ rotate: -8, scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 320, damping: 14 }}
                  className="grid h-12 w-12 place-items-center bg-brand-secondary text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-ink-black"
                >
                  <f.icon className="h-5 w-5" />
                </motion.div>
                <h3 className="mt-4 text-lg font-bold text-brand-secondary">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-secondary/65">{f.body}</p>
                <p className="mt-3 border-l-2 border-brand-primary/40 pl-3 text-xs leading-relaxed text-brand-secondary/50">
                  {f.accent}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
