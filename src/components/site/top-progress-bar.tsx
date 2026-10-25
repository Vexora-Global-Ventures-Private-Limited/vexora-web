"use client"

import { motion, useReducedMotion } from "framer-motion"

/**
 * Thin gold bar that sweeps across once on initial load. Pure animation —
 * keyframed by framer-motion rather than a chain of setState timers.
 */
export function TopProgressBar({ active }: { active?: boolean }) {
  const reduce = useReducedMotion()
  if (!active || reduce) return null
  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-0.5 origin-left bg-gradient-to-r from-brand-primary via-brand-primary-muted to-brand-primary-light"
      initial={{ width: "0%", opacity: 1 }}
      animate={{ width: ["12%", "55%", "88%", "100%", "100%"], opacity: [1, 1, 1, 1, 0] }}
      transition={{ duration: 0.9, times: [0, 0.13, 0.42, 0.62, 1], ease: "easeOut" }}
      aria-hidden
    />
  )
}
