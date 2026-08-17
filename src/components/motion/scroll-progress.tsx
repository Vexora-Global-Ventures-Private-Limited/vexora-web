"use client"

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"

/** Direct scroll progress — no spring overshoot */
export function ScrollProgress() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  if (reduce) return null

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, willChange: "transform" }}
      className="scroll-progress-bar fixed inset-x-0 top-0 z-[60] origin-left"
    />
  )
}
