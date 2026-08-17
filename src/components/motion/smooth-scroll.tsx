"use client"

import { useEffect, type ReactNode } from "react"
import Lenis from "lenis"

/**
 * Buttery smooth-scroll provider powered by Lenis.
 * Wraps the whole app; intercepts wheel/touch and animates scroll.
 * Respects prefers-reduced-motion.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Skip on mobile / touch — Lenis intercepts touch events and causes
    // scroll lag on low-end devices. Native momentum scroll is faster there.
    if (window.matchMedia("(max-width: 1023px)").matches) return

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
      touchMultiplier: 1.5,
      wheelMultiplier: 1,
    })

    let rafId = 0
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
