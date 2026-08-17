"use client"

import { motion } from "framer-motion"
import { EASE_OUT } from "@/lib/motion-tokens"

export function SectionDivider() {
  return (
    <div className="mx-auto max-w-7xl px-6" aria-hidden>
      <motion.div
        className="section-rule h-px"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.65, ease: EASE_OUT }}
        style={{ transformOrigin: "center" }}
      />
    </div>
  )
}
