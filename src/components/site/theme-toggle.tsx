"use client"

import { useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
  lightClassName?: string
  darkClassName?: string
  /** Renders "Light mode" / "Dark mode" text alongside the icon (mobile menu rows). */
  showLabel?: boolean
}

/** Light/dark toggle — theme choice persists via next-themes (localStorage). */
export function ThemeToggle({ className, lightClassName, darkClassName, showLabel }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  // false during SSR/hydration, true once on the client — the theme is only
  // known client-side, so the icon renders after hydration (no mismatch).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        showLabel ? "flex items-center justify-between" : "grid place-items-center",
        "transition-colors duration-500",
        isDark ? darkClassName : lightClassName,
        className,
      )}
    >
      {showLabel && <span>{isDark ? "Dark mode" : "Light mode"}</span>}
      {mounted && (isDark ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />)}
    </button>
  )
}
