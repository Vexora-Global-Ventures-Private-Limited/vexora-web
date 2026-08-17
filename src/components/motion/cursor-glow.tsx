"use client"

import { useEffect } from "react"
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion"

/**
 * Cursor-following gold glow. Desktop-only (pointer: fine + lg viewport).
 * Should be placed ONCE near the top of the page (e.g. inside <main>).
 */
export function CursorGlow() {
  const reduce = useReducedMotion()
  const x = useMotionValue(-500)
  const y = useMotionValue(-500)
  const sx = useSpring(x, { stiffness: 120, damping: 20, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 120, damping: 20, mass: 0.4 })

  useEffect(() => {
    if (reduce) return
    // Skip on touch / coarse pointer devices
    if (window.matchMedia("(pointer: coarse)").matches) return
    // Skip on small screens — continuous spring physics cost real CPU on mobile.
    if (window.matchMedia("(max-width: 1023px)").matches) return

    const handler = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener("pointermove", handler, { passive: true })
    return () => window.removeEventListener("pointermove", handler)
  }, [reduce, x, y])

  if (reduce) return null

  // Hidden on mobile via `hidden lg:block` — effect listener is also disabled.
  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden -translate-x-1/2 -translate-y-1/2 lg:block"
    >
      <div
        className="h-[420px] w-[420px] rounded-full opacity-[0.18]"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.45) 0%, rgba(212,175,55,0.18) 30%, transparent 70%)",
        }}
      />
    </motion.div>
  )
}
