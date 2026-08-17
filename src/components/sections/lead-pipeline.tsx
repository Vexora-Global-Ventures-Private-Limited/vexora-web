"use client"

import { motion } from "framer-motion"
import { ChevronRight, MousePointerClick, Phone, RefreshCw, MapPin, Handshake, FileText, Trophy } from "lucide-react"
import { leadPipeline, leadSources } from "@/lib/vxp-data"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/sections/section-heading"
import { AnimatedCounter } from "@/components/motion/animated-counter"

const stageIcons = [
  MousePointerClick, Phone, RefreshCw, MapPin, Handshake, FileText, Trophy,
]

export function LeadPipeline() {
  return (
    <section className="bg-card section-home">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          align="center"
          eyebrow="Lead Management System"
          title={<>From click to closed — <span className="text-gold-gradient italic">tracked.</span></>}
          description="Every lead — from a property click, contact request, callback, site visit, listing enquiry, sponsored click, or ad click — flows through the same seven-stage pipeline. No lead falls through the cracks."
        />

        {/* Pipeline visual — horizontal on desktop, vertical on mobile */}
        <Reveal direction="up" delay={0.2}>
          <div className="mt-14">
            {/* Desktop horizontal */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Connecting line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute left-0 right-0 top-7 h-px origin-left bg-gradient-to-r from-brand-primary via-brand-primary-dark to-ink-black"
                />
                <div className="grid grid-cols-7 gap-2">
                  {leadPipeline.map((stage, i) => {
                    const Icon = stageIcons[i] ?? MousePointerClick
                    return (
                      <motion.div
                        key={stage.stage}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.12, duration: 0.6 }}
                        className="relative flex flex-col items-center text-center"
                      >
                        {/* Stage dot */}
                        <motion.div
                          whileHover={{ scale: 1.12, rotate: 6 }}
                          transition={{ type: "spring", stiffness: 320, damping: 14 }}
                          className="relative z-10 grid h-14 w-14 place-items-center rounded-full border-2 bg-card shadow-lg"
                          style={{ borderColor: stage.color }}
                        >
                          <Icon className="h-5 w-5" style={{ color: stage.color }} />
                        </motion.div>
                        <div className="mt-3 font-serif text-base font-bold text-brand-secondary">
                          {stage.stage}
                        </div>
                        <div className="mt-1 text-[11px] leading-snug text-brand-secondary/55">
                          {stage.description}
                        </div>
                        {i < leadPipeline.length - 1 && (
                          <ChevronRight className="absolute -right-1 top-5 hidden h-5 w-5 text-brand-primary-dark/50 xl:block" />
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Mobile vertical */}
            <div className="lg:hidden">
              <div className="space-y-3">
                {leadPipeline.map((stage, i) => {
                  const Icon = stageIcons[i] ?? MousePointerClick
                  return (
                    <motion.div
                      key={stage.stage}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className="flex items-start gap-4 border border-brand-border-light bg-card p-4"
                    >
                      <div
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 bg-card"
                        style={{ borderColor: stage.color }}
                      >
                        <Icon className="h-4 w-4" style={{ color: stage.color }} />
                      </div>
                      <div>
                        <div className="font-serif text-base font-bold text-brand-secondary">{stage.stage}</div>
                        <div className="mt-1 text-xs text-brand-secondary/60">{stage.description}</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Lead sources breakdown */}
        <Reveal direction="up" delay={0.3}>
          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="border border-brand-border-light bg-brand-surface p-7">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary-dark">
                Lead sources
              </span>
              <h3 className="mt-2 font-serif text-2xl font-bold text-brand-secondary">
                Where leads come from
              </h3>
              <p className="mt-2 text-sm text-brand-secondary/65">
                Seven sources — every lead tagged at origin for accurate attribution.
              </p>

              <div className="mt-6 space-y-3">
                {leadSources.map((s, i) => (
                  <motion.div
                    key={s.source}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-brand-secondary">{s.source}</span>
                      <span className="font-bold text-brand-primary-dark">
                        <AnimatedCounter to={s.count} suffix="" duration={1.6} separator="," />
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-brand-border-light">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.share}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.4 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Lead object card */}
            <div className="border border-brand-border-light bg-card p-7">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary-dark">
                Lead object
              </span>
              <h3 className="mt-2 font-serif text-2xl font-bold text-brand-secondary">
                What we capture on every lead
              </h3>
              <p className="mt-2 text-sm text-brand-secondary/65">
                Every lead is a structured object — assigned, tracked, and reported on.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                {["Lead ID", "User", "Property", "Owner", "Source", "Created Time", "Status", "Assigned To", "Notes"].map((f, i) => (
                  <motion.div
                    key={f}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                    className="border border-brand-border-light bg-brand-surface px-3 py-2.5 text-xs font-semibold text-brand-secondary"
                  >
                    <span className="text-brand-primary-dark">›</span> {f}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 bg-ink-black p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                  Lead distribution rule
                </div>
                <div className="mt-1.5 text-sm text-white/85">
                  <span className="font-bold text-brand-primary">Sponsored</span> properties
                  → assigned to listing owner first,
                  <span className="font-bold text-brand-primary"> Venus</span> partners get priority.
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
