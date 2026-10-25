import {
  BRAND_COLORS,
  BRAND_COLORS_STORAGE_KEY,
  DEFAULT_THEME_COLORS,
  ROOT_CSS_VARIABLES,
} from "@/lib/color-constants"

export type BrandColors = {
  primary: string
  secondary: string
  tertiary: string
  presetId?: string
}

export { BRAND_COLORS_STORAGE_KEY, DEFAULT_THEME_COLORS }

export const COLOR_PRESETS: { id: string; label: string; colors: BrandColors }[] = [
  { id: "vxp-royal", label: "VXP Royal", colors: { ...BRAND_COLORS, presetId: "vxp-royal" } },
  { id: "champagne", label: "Champagne", colors: { primary: "#b8963e", secondary: "#1a1816", tertiary: "#faf6ec", presetId: "champagne" } },
  { id: "midnight-gold", label: "Midnight Gold", colors: { primary: "#d4af37", secondary: "#0c0b0a", tertiary: "#f5f0e6", presetId: "midnight-gold" } },
  { id: "slate-accent", label: "Slate Accent", colors: { primary: "#8b7355", secondary: "#141210", tertiary: "#f4f1ea", presetId: "slate-accent" } },
]

function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.replace("#", "").trim()
  const normalized =
    raw.length === 3
      ? raw.split("").map((c) => c + c).join("")
      : raw.length === 6
        ? raw
        : null
  if (!normalized) return null
  const n = Number.parseInt(normalized, 16)
  if (Number.isNaN(n)) return null
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function normalizeHex(input: string): string | null {
  const trimmed = input.trim()
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`
  const rgb = parseHex(withHash)
  if (!rgb) return null
  return `#${rgb.map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

export function loadBrandColors(): BrandColors {
  if (typeof window === "undefined") return { ...DEFAULT_THEME_COLORS }
  try {
    const raw = localStorage.getItem(BRAND_COLORS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_THEME_COLORS }
    const parsed = JSON.parse(raw) as Partial<BrandColors>
    return {
      primary: normalizeHex(parsed.primary ?? "") ?? BRAND_COLORS.primary,
      secondary: normalizeHex(parsed.secondary ?? "") ?? BRAND_COLORS.secondary,
      tertiary: normalizeHex(parsed.tertiary ?? "") ?? BRAND_COLORS.tertiary,
      presetId: parsed.presetId,
    }
  } catch {
    return { ...DEFAULT_THEME_COLORS }
  }
}

export function saveBrandColors(colors: BrandColors) {
  try {
    localStorage.setItem(BRAND_COLORS_STORAGE_KEY, JSON.stringify(colors))
  } catch {
    // Private mode / storage blocked or full — the colours still apply for this visit.
  }
}

/**
 * Applies user-picked brand colors as inline CSS variables.
 *
 * Inline styles always win over stylesheet rules, including `.dark`, so in
 * dark mode we only carry the accent (primary/gold) across and leave
 * secondary/tertiary/background/foreground/sidebar to the `.dark` defaults
 * in globals.css — otherwise a light-mode brand pick would permanently
 * pin the page to light colors even after switching to dark.
 */
export function applyBrandColors(
  colors: BrandColors,
  root: HTMLElement = document.documentElement,
  /**
   * Explicit dark-mode flag. Pass this from a React effect reacting to
   * next-themes' `resolvedTheme` — reading `root.classList` there is racy
   * because next-themes applies the "dark" class in its *own* effect, and
   * child effects (this provider) fire before their parent's in the same
   * commit, so the class may not be on the DOM yet. Omit it (falls back to
   * classList) only for synchronous, non-React callers like the init script
   * and initial hydration, where the class is already settled.
   */
  forceDark?: boolean,
) {
  const { primary, secondary, tertiary } = colors
  const isDark = forceDark ?? root.classList.contains("dark")

  root.style.setProperty("--brand-primary", primary)
  root.style.setProperty("--primary", primary)
  root.style.setProperty("--ring", primary)
  root.style.setProperty("--brand-primary-light", `color-mix(in srgb, ${primary} 42%, white)`)
  root.style.setProperty("--brand-primary-dark", `color-mix(in srgb, ${primary} 72%, black)`)
  root.style.setProperty("--brand-primary-muted", `color-mix(in srgb, ${primary} 58%, white)`)

  if (isDark) {
    root.style.removeProperty("--brand-secondary")
    root.style.removeProperty("--brand-tertiary")
    root.style.removeProperty("--background")
    root.style.removeProperty("--foreground")
    root.style.removeProperty("--secondary")
    root.style.removeProperty("--secondary-foreground")
    root.style.removeProperty("--sidebar")
    root.style.removeProperty("--sidebar-foreground")
    root.style.removeProperty("--sidebar-primary")
    return
  }

  root.style.setProperty("--brand-secondary", secondary)
  root.style.setProperty("--brand-tertiary", tertiary)
  root.style.setProperty("--background", tertiary)
  root.style.setProperty("--foreground", secondary)
  root.style.setProperty("--secondary", tertiary)
  root.style.setProperty("--secondary-foreground", secondary)
  root.style.setProperty("--sidebar", tertiary)
  root.style.setProperty("--sidebar-foreground", secondary)
  root.style.setProperty("--sidebar-primary", primary)
}

export function resetBrandColors(root: HTMLElement = document.documentElement) {
  applyBrandColors({ ...DEFAULT_THEME_COLORS }, root)
  try {
    localStorage.removeItem(BRAND_COLORS_STORAGE_KEY)
  } catch {
    // Storage blocked — nothing was saved to remove.
  }
}

/**
 * Inline script rendered inside <ThemeProvider>, after next-themes' own
 * no-flash script — so `document.documentElement` already carries the
 * correct `.dark` class before this runs. See applyBrandColors() for why
 * secondary/tertiary/background/foreground/sidebar are skipped in dark mode.
 */
export function buildBrandColorsInitScript(): string {
  const defaults = JSON.stringify(ROOT_CSS_VARIABLES)
  return `(function(){try{var k="${BRAND_COLORS_STORAGE_KEY}";var d=JSON.parse(localStorage.getItem(k)||"null");var defs=${defaults};var r=document.documentElement;var isDark=r.classList.contains("dark");var primary=(d&&d.primary)||defs["--brand-primary"];r.style.setProperty("--brand-primary",primary);r.style.setProperty("--primary",primary);r.style.setProperty("--ring",primary);r.style.setProperty("--brand-primary-light","color-mix(in srgb, "+primary+" 42%, white)");r.style.setProperty("--brand-primary-dark","color-mix(in srgb, "+primary+" 72%, black)");r.style.setProperty("--brand-primary-muted","color-mix(in srgb, "+primary+" 58%, white)");if(!isDark){var secondary=(d&&d.secondary)||defs["--brand-secondary"];var tertiary=(d&&d.tertiary)||defs["--brand-tertiary"];r.style.setProperty("--brand-secondary",secondary);r.style.setProperty("--brand-tertiary",tertiary);r.style.setProperty("--background",tertiary);r.style.setProperty("--foreground",secondary);r.style.setProperty("--secondary",tertiary);r.style.setProperty("--secondary-foreground",secondary);r.style.setProperty("--sidebar",tertiary);r.style.setProperty("--sidebar-foreground",secondary);r.style.setProperty("--sidebar-primary",primary);}}catch(e){}})();`
}
