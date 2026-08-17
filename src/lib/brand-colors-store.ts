"use client"

import { create } from "zustand"
import {
  applyBrandColors,
  loadBrandColors,
  resetBrandColors,
  saveBrandColors,
  type BrandColors,
  DEFAULT_THEME_COLORS,
} from "@/lib/brand-colors"

type BrandColorState = {
  colors: BrandColors
  hydrated: boolean
  hydrate: () => void
  setColor: (role: keyof Pick<BrandColors, "primary" | "secondary" | "tertiary">, hex: string) => void
  applyPreset: (colors: BrandColors) => void
  reset: () => void
}

export const useBrandColors = create<BrandColorState>((set, get) => ({
  colors: DEFAULT_THEME_COLORS,
  hydrated: false,
  hydrate: () => {
    const colors = loadBrandColors()
    applyBrandColors(colors)
    set({ colors, hydrated: true })
  },
  setColor: (role, hex) => {
    const next = { ...get().colors, [role]: hex, presetId: undefined }
    applyBrandColors(next)
    saveBrandColors(next)
    set({ colors: next })
  },
  applyPreset: (colors) => {
    applyBrandColors(colors)
    saveBrandColors(colors)
    set({ colors })
  },
  reset: () => {
    resetBrandColors()
    const colors = { ...DEFAULT_THEME_COLORS }
    set({ colors })
  },
}))
