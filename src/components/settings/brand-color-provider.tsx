"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { useBrandColors } from "@/lib/brand-colors-store"
import { applyBrandColors } from "@/lib/brand-colors"

export function BrandColorProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useBrandColors((s) => s.hydrate)
  const hydrated = useBrandColors((s) => s.hydrated)
  const colors = useBrandColors((s) => s.colors)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Re-apply whenever the light/dark class flips so brand colors don't get
  // stuck inline-pinned to whichever mode was active on first load.
  useEffect(() => {
    if (!hydrated || !resolvedTheme) return
    applyBrandColors(colors, document.documentElement, resolvedTheme === "dark")
  }, [resolvedTheme, hydrated, colors])

  return <>{children}</>
}
