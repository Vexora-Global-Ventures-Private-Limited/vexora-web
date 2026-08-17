/**
 * VXP color constants — single source of truth for the design system.
 * Keep `globals.css` :root values in sync when editing defaults here.
 */

export const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type ShadeStep = (typeof SHADE_STEPS)[number]

/** Main brand roles — primary (gold), secondary (black), tertiary (background) */
export const BRAND_COLORS = {
  primary: "#c4a23a",
  secondary: "#121110",
  tertiary: "#f7f3eb",
} as const

export type BrandColorRole = keyof typeof BRAND_COLORS

/** Balanced royal gold scale — slightly brighter, still editorial */
export const GOLD = {
  50: "#fcf9ef",
  100: "#f8efda",
  200: "#efdfb8",
  300: "#e3ca78",
  400: "#cfb244",
  500: "#c4a23a",
  600: "#a68c2c",
  700: "#816720",
  800: "#5a4a17",
  900: "#332910",
  950: "#1f1809",
} as const satisfies Record<ShadeStep, string>

/** Warm ink / charcoal scale */
export const INK = {
  50: "#f5f4f2",
  100: "#e8e6e2",
  200: "#d1cdc6",
  300: "#b0aaa0",
  400: "#8a8278",
  500: "#6b635a",
  600: "#524c45",
  700: "#3d3833",
  800: "#2a2622",
  900: "#1c1814",
  950: "#121110",
} as const satisfies Record<ShadeStep, string>

/** Soft cream / paper scale */
export const CREAM = {
  50: "#fefdfb",
  100: "#fbf8f3",
  200: "#f7f3eb",
  300: "#f0ebe2",
  400: "#e8e0d4",
  500: "#ddd4c4",
  600: "#c9bfb0",
  700: "#a89e90",
  800: "#857c70",
  900: "#6b635a",
  950: "#524c45",
} as const satisfies Record<ShadeStep, string>

/** Named VXP palette tokens (legacy aliases) */
export const VXP = {
  gold: GOLD,
  ink: INK,
  cream: CREAM,
  inkSoft: "#1c1814",
  champagne: "#ede6d8",
  royal: "#141210",
  royalDarkStart: "#141210",
  royalDarkEnd: "#121110",
} as const

/** Shared neutrals & utility colors */
export const NEUTRAL = {
  white: "#ffffff",
  black: "#0a0a0a",
  border: "#ddd4c4",
  borderHover: "#c4b59a",
  borderLight: "#ece4cf",
  muted: "#f0ebe2",
  mutedForeground: "#6b5d48",
  accent: "#ede6d8",
  surfaceHover: "#faf6ec",
  cardShadow: "rgba(18, 17, 16, 0.18)",
  inkShadow: "rgba(18, 17, 16, 0.12)",
} as const

/** Gold accent aliases used across marketing UI */
export const GOLD_ACCENT = {
  light: "#e3ca78",
  base: "#c4a23a",
  bright: "#e6c44f",
  deep: "#a68c2c",
  border: "#cfb244",
} as const

/** shadcn / semantic tokens — light mode defaults */
export const SEMANTIC_LIGHT = {
  background: BRAND_COLORS.tertiary,
  foreground: BRAND_COLORS.secondary,
  card: NEUTRAL.white,
  cardForeground: BRAND_COLORS.secondary,
  popover: NEUTRAL.white,
  popoverForeground: BRAND_COLORS.secondary,
  primary: BRAND_COLORS.primary,
  primaryForeground: NEUTRAL.white,
  secondary: BRAND_COLORS.tertiary,
  secondaryForeground: BRAND_COLORS.secondary,
  muted: NEUTRAL.muted,
  mutedForeground: NEUTRAL.mutedForeground,
  accent: NEUTRAL.accent,
  accentForeground: BRAND_COLORS.secondary,
  destructive: "oklch(0.577 0.245 27.325)",
  border: NEUTRAL.border,
  input: NEUTRAL.border,
  ring: BRAND_COLORS.primary,
  chart1: BRAND_COLORS.primary,
  chart2: GOLD[600],
  chart3: GOLD[300],
  chart4: VXP.inkSoft,
  chart5: NEUTRAL.mutedForeground,
  sidebar: BRAND_COLORS.tertiary,
  sidebarForeground: BRAND_COLORS.secondary,
  sidebarPrimary: BRAND_COLORS.primary,
  sidebarPrimaryForeground: NEUTRAL.white,
  sidebarAccent: NEUTRAL.muted,
  sidebarAccentForeground: BRAND_COLORS.secondary,
  sidebarBorder: NEUTRAL.border,
  sidebarRing: BRAND_COLORS.primary,
} as const

/** shadcn / semantic tokens — dark mode defaults */
export const SEMANTIC_DARK = {
  background: NEUTRAL.black,
  foreground: "oklch(0.985 0 0)",
  card: "#1a1410",
  cardForeground: "oklch(0.985 0 0)",
  popover: "#1a1410",
  popoverForeground: "oklch(0.985 0 0)",
  primary: GOLD_ACCENT.bright,
  primaryForeground: NEUTRAL.black,
  secondary: "#2a2218",
  secondaryForeground: "oklch(0.985 0 0)",
  muted: "#2a2218",
  mutedForeground: "oklch(0.708 0 0)",
  accent: "#2a2218",
  accentForeground: "oklch(0.985 0 0)",
  destructive: "oklch(0.704 0.191 22.216)",
  border: "oklch(1 0 0 / 10%)",
  input: "oklch(1 0 0 / 15%)",
  ring: GOLD_ACCENT.bright,
} as const

/** CSS custom property names for brand tokens */
export const CSS_VARS = {
  brandPrimary: "--brand-primary",
  brandSecondary: "--brand-secondary",
  brandTertiary: "--brand-tertiary",
  brandPrimaryLight: "--brand-primary-light",
  brandPrimaryDark: "--brand-primary-dark",
  brandPrimaryMuted: "--brand-primary-muted",
  brandBorder: "--brand-border",
  brandMuted: "--brand-muted",
  brandMutedForeground: "--brand-muted-foreground",
  brandAccent: "--brand-accent",
} as const

/** Default :root CSS variable map (light theme) */
export const ROOT_CSS_VARIABLES: Record<string, string> = {
  [CSS_VARS.brandPrimary]: BRAND_COLORS.primary,
  [CSS_VARS.brandSecondary]: BRAND_COLORS.secondary,
  [CSS_VARS.brandTertiary]: BRAND_COLORS.tertiary,
  [CSS_VARS.brandPrimaryLight]: GOLD[300],
  [CSS_VARS.brandPrimaryDark]: GOLD[600],
  [CSS_VARS.brandPrimaryMuted]: GOLD[400],
  [CSS_VARS.brandBorder]: NEUTRAL.border,
  "--brand-border-light": NEUTRAL.borderLight,
  "--brand-surface": NEUTRAL.surfaceHover,
  [CSS_VARS.brandMuted]: NEUTRAL.muted,
  [CSS_VARS.brandMutedForeground]: NEUTRAL.mutedForeground,
  [CSS_VARS.brandAccent]: NEUTRAL.accent,
  "--background": SEMANTIC_LIGHT.background,
  "--foreground": SEMANTIC_LIGHT.foreground,
  "--card": SEMANTIC_LIGHT.card,
  "--card-foreground": SEMANTIC_LIGHT.cardForeground,
  "--popover": SEMANTIC_LIGHT.popover,
  "--popover-foreground": SEMANTIC_LIGHT.popoverForeground,
  "--primary": SEMANTIC_LIGHT.primary,
  "--primary-foreground": SEMANTIC_LIGHT.primaryForeground,
  "--secondary": SEMANTIC_LIGHT.secondary,
  "--secondary-foreground": SEMANTIC_LIGHT.secondaryForeground,
  "--muted": SEMANTIC_LIGHT.muted,
  "--muted-foreground": SEMANTIC_LIGHT.mutedForeground,
  "--accent": SEMANTIC_LIGHT.accent,
  "--accent-foreground": SEMANTIC_LIGHT.accentForeground,
  "--destructive": SEMANTIC_LIGHT.destructive,
  "--border": SEMANTIC_LIGHT.border,
  "--input": SEMANTIC_LIGHT.input,
  "--ring": SEMANTIC_LIGHT.ring,
  "--chart-1": SEMANTIC_LIGHT.chart1,
  "--chart-2": SEMANTIC_LIGHT.chart2,
  "--chart-3": SEMANTIC_LIGHT.chart3,
  "--chart-4": SEMANTIC_LIGHT.chart4,
  "--chart-5": SEMANTIC_LIGHT.chart5,
  "--sidebar": SEMANTIC_LIGHT.sidebar,
  "--sidebar-foreground": SEMANTIC_LIGHT.sidebarForeground,
  "--sidebar-primary": SEMANTIC_LIGHT.sidebarPrimary,
  "--sidebar-primary-foreground": SEMANTIC_LIGHT.sidebarPrimaryForeground,
  "--sidebar-accent": SEMANTIC_LIGHT.sidebarAccent,
  "--sidebar-accent-foreground": SEMANTIC_LIGHT.sidebarAccentForeground,
  "--sidebar-border": SEMANTIC_LIGHT.sidebarBorder,
  "--sidebar-ring": SEMANTIC_LIGHT.sidebarRing,
}

/** localStorage key for client theme overrides */
export const BRAND_COLORS_STORAGE_KEY = "vxp-brand-colors"

/** Default theme selection for the color picker */
export const DEFAULT_THEME_COLORS = {
  ...BRAND_COLORS,
  presetId: "vxp-royal",
} as const
