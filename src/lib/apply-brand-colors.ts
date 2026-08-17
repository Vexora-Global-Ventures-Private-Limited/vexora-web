import { ROOT_CSS_VARIABLES } from "@/lib/color-constants"
import { buildBrandColorsInitScript } from "@/lib/brand-colors"

/** Inject default brand CSS variables on the document root (client-only). */
export function applyRootColorVariables(root: HTMLElement = document.documentElement) {
  for (const [key, value] of Object.entries(ROOT_CSS_VARIABLES)) {
    root.style.setProperty(key, value)
  }
}

/** Inline script string for layout — prevents flash before React hydrates. */
export const BRAND_COLORS_INIT_SCRIPT = buildBrandColorsInitScript()
