"use client"

import { CommandPalette } from "@/components/site/command-palette"
import { ThemeSettingsPanel } from "@/components/settings/theme-settings-panel"

export function SiteChrome() {
  return (
    <>
      <CommandPalette />
      <ThemeSettingsPanel />
    </>
  )
}
