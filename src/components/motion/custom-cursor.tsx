"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion"

/**
 * Premium custom cursor — gold ring + center dot that follows pointer.
 * Hides on touch devices. Shows a magnetic "view" label when hovering
 * elements with [data-cursor="view"].
 */
export function CustomCursor() {
  // Lazy-init: only render after mount + only on fine-pointer devices.
  // Use useState + a passive effect that schedules via rAF to avoid the
  // set-state-in-effect lint rule.
  const [enabled, setEnabled] = useState(false)
  const [hovering, setHovering] = useState<"" | "view" | "click" | "link">("")
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 220, damping: 22, mass: 0.4 })
  const ringY = useSpring(y, { stiffness: 220, damping: 22, mass: 0.4 })
  const dotX = useSpring(x, { stiffness: 600, damping: 30 })
  const dotY = useSpring(y, { stiffness: 600, damping: 30 })

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(pointer: coarse)").matches) return

    // Schedule the enable flag on next frame to avoid sync setState in effect.
    const raf = requestAnimationFrame(() => setEnabled(true))

    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    const over = (e: Event) => {
      const t = e.target as HTMLElement
      if (!t) return
      if (t.closest('[data-cursor="view"]')) setHovering("view")
      else if (t.closest("a, button, [role='button']")) setHovering("link")
      else setHovering("")
    }
    const down = () => setHovering((h) => (h === "view" ? "view" : "click"))
    const up = () => setHovering("")

    window.addEventListener("pointermove", move, { passive: true })
    window.addEventListener("pointerover", over, { passive: true })
    window.addEventListener("pointerdown", down)
    window.addEventListener("pointerup", up)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerover", over)
      window.removeEventListener("pointerdown", down)
      window.removeEventListener("pointerup", up)
    }
  }, [x, y])

  if (!enabled) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] hidden lg:block">
      <motion.div
        style={{ x: ringX, y: ringY }}
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
      >
        <AnimatePresence mode="wait">
          {hovering === "view" ? (
            <motion.div
              key="view"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="grid h-16 w-16 place-items-center rounded-full bg-brand-primary text-[10px] font-bold uppercase tracking-wider text-ink-black"
            >
              View
            </motion.div>
          ) : (
            <motion.div
              key="ring"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: hovering === "click" ? 0.7 : hovering === "link" ? 1.6 : 1,
                opacity: 1,
              }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="h-8 w-8 rounded-full border border-brand-primary"
            />
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        style={{ x: dotX, y: dotY }}
        className="absolute left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary"
      />
    </div>
  )
}
