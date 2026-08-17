"use client"

import { create } from "zustand"

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
