"use client"

import { create } from "zustand"

/**
 * The brand-colour editor is a design/dev tool — it recolours the whole site
 * for whoever opens it. Only available in development, never on the live
 * site (it used to be open to every public visitor via the command palette).
 */
export const BRAND_EDITOR_ENABLED = process.env.NODE_ENV !== "production"

type ThemeSettingsState = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useThemeSettings = create<ThemeSettingsState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}))
