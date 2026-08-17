"use client"

import { useEffect, useState } from "react"

/**
 * Returns true when the viewport is mobile-width (< 1024px).
 * Use this to gate expensive animations (blur filters, particle fields,
 * 3D canvases) on mobile for performance.
 *
 * Always starts as `false` on SSR / first render to avoid hydration
 * mismatches, then upgrades on the first effect run.
 */
export function useIsMobile(breakpoint = 1023): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [breakpoint])
  return isMobile
}
