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
      touchMultiplier: 1.5,
      wheelMultiplier: 1,
      // Let anything that scrolls on its own (dialogs, sheets, dropdowns,
      // listboxes, the command palette) keep the wheel — otherwise Lenis
      // hijacks it and scrolls the page behind instead of the open list.
      prevent: (node: HTMLElement) =>
        !!node.closest(
          '[role="dialog"],[role="alertdialog"],[role="listbox"],[role="menu"],[data-radix-popper-content-wrapper],[cmdk-list],[data-lenis-prevent]',
        ),
    })

    // Radix dialogs/sheets lock page scroll by marking <body> with
    // data-scroll-locked; Lenis drives scroll itself and ignores that, so
    // the page kept scrolling behind open modals. Pause it while locked.
    const syncLock = () => (document.body.hasAttribute("data-scroll-locked") ? lenis.stop() : lenis.start())
    const lockObserver = new MutationObserver(syncLock)
    lockObserver.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] })

    let rafId = 0
    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lockObserver.disconnect()
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
