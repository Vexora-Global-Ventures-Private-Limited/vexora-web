"use client"

import { CommandPalette } from "@/components/site/command-palette"
import { ThemeSettingsPanel } from "@/components/settings/theme-settings-panel"
import { BRAND_EDITOR_ENABLED } from "@/lib/theme-settings-store"

export function SiteChrome() {
  return (
    <>
      <CommandPalette />
      {BRAND_EDITOR_ENABLED && <ThemeSettingsPanel />}
    </>
  )
}
