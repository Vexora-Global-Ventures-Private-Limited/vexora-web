"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import {
  LayoutPanelTop, MapPin, Building2, Play, Crown, ArrowUpRight, Check, Wallet, ShieldCheck,
} from "lucide-react"
import { adTypes, advertiserAudiences } from "@/lib/vxp-data"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "@/components/sections/section-heading"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  banner: LayoutPanelTop,
  "map-pin": MapPin,
  building: Building2,
  play: Play,
  crown: Crown,
}

export function AdvertiserSection() {
  const router = useRouter()
  return (
    <section id="promote" className="royal-dark section-home relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-primary-muted/30 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeading
          dark
          eyebrow="Promote on VXP"
          title={<>Anyone can promote. <span className="text-gold-gradient italic">Anyone.</span></>}
          description="Property owners, brokers, developers, builders, agencies, businesses, investors, interior brands, banks and NBFCs — create an account, pick an ad package, pay, upload your content, and your placement goes live after admin approval."
        />

        {/* Audience chips */}
        <Reveal direction="up" delay={0.15}>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Who advertises:
            </span>
            {advertiserAudiences.map((a) => (
              <span
                key={a.label}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/75"
              >
                {a.label}
              </span>
            ))}
          </div>
        </Reveal>

        {/* 5 ad types grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {adTypes.map((ad) => {
            const Icon = iconMap[ad.icon] ?? LayoutPanelTop
            return (
              <motion.div
                key={ad.code}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
                }}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 280, damping: 20 }}
                className="group relative overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-7 backdrop-blur-sm transition-colors hover:border-brand-primary/40"
              >
                {/* Numbered code */}
                <span className="absolute right-5 top-4 font-serif text-5xl font-bold text-white/[0.06]">
                  {ad.code}
                </span>

                <motion.div
                  whileHover={{ rotate: -8, scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 320, damping: 14 }}
                  className="grid h-12 w-12 place-items-center bg-gradient-to-br from-brand-primary to-brand-primary-dark text-ink-black shadow-lg shadow-brand-primary/20"
                >
                  <Icon className="h-5 w-5" />
                </motion.div>

                <h3 className="mt-5 font-serif text-xl font-bold text-white">{ad.name}</h3>

                <p className="mt-2 text-xs italic text-brand-primary/90">
                  &ldquo;{ad.example}&rdquo;
                </p>

                <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs">
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="text-white/45">Placement:</span>
                    <span className="font-medium text-white/85">{ad.placement}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="text-white/45">Visible to:</span>
                    <span className="font-medium text-white/85">{ad.audience}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* 6th cell — process card */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
            }}
            className="flex flex-col justify-between bg-gradient-to-br from-brand-primary/15 via-brand-primary/8 to-transparent p-7 ring-1 ring-brand-primary/30"
          >
            <div>
              <h3 className="font-serif text-2xl font-bold text-white">How it works</h3>
              <ol className="mt-5 space-y-3">
                {[
                  { icon: ShieldCheck, t: "Create an account", d: "Sign up as an advertiser" },
                  { icon: Wallet, t: "Pick a package & pay", d: "Home banner, city, developer, project or sponsored" },
                  { icon: Check, t: "Upload content", d: "Banner creative, video, brochure, virtual tour" },
                  { icon: ArrowUpRight, t: "Admin approves & goes live", d: "Track clicks, performance, ROI" },
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-primary text-[10px] font-bold text-ink-black">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{s.t}</div>
                      <div className="text-xs text-white/55">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <motion.button
              // Was a dead button. /promote is portal-guarded, so a visitor
              // who isn't signed in lands on login first.
              onClick={() => router.push(ROUTES.promote)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="btn-gold mt-6 inline-flex items-center justify-center gap-2 overflow-hidden py-3 text-sm font-bold"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start advertising <ArrowUpRight className="h-4 w-4" />
              </span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
