"use client"

import { motion, AnimatePresence } from "framer-motion"
import { type ReactNode } from "react"

/**
 * Premium page transition wrapper.
 * Clean fade + upward drift — no blur (avoids blurry-text issue + mobile lag).
 */
export function PageTransition({ children, k }: { children: ReactNode; k: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={k}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Gold curtain overlay that sweeps across on view change.
 * Place once near the top of the app.
 */
export function CurtainOverlay({ trigger }: { trigger: string }) {
  return (
    <AnimatePresence>
      <motion.div
        key={trigger}
        className="pointer-events-none fixed inset-0 z-[80] origin-top bg-gradient-to-b from-brand-primary to-brand-primary-dark"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: [0, 1, 0] }}
        transition={{
          duration: 0.8,
          times: [0, 0.5, 1],
          ease: [0.76, 0, 0.24, 1],
        }}
        style={{ transformOrigin: "top" }}
      />
    </AnimatePresence>
  )
}
