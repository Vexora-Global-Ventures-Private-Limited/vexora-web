"use client"

import { popularCities } from "@/lib/vxp-data"
import { useEffect, useState, type KeyboardEvent, useMemo } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { cleanSuggestion } from "@/lib/api-mappers"
import { useGetActiveLocationsQuery, useSuggestQuery } from "@/store/api/searchApi"

/**
 * Debounced GET /search/suggest. Below 2 characters nothing is requested at
 * all — matching the backend, which returns [] for those anyway. The
 * suggestions are listing TITLES, not place names.
 */
export function useSearchSuggestions(input: string) {
  const [debounced, setDebounced] = useState(input.trim())
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input.trim()), 250)
    return () => window.clearTimeout(t)
  }, [input])
  const { data } = useSuggestQuery(debounced, { skip: debounced.length < 2 })
  return debounced.length < 2 ? [] : (data ?? []).map(cleanSuggestion)
}

/**
 * City names to offer / resolve typed text against: the Location Master
 * (district + city levels — listings store the district name, e.g. "Mumbai")
 * plus the cities the site already promotes. The Location Master is still
 * sparse on dev (Mumbai / Andheri only), and on its own it hid cities that do
 * have live listings — typing "Pune" became a text search that found nothing.
 * The search API matches `city` exactly, so names keep their canonical case.
 */
export function useCityNames(): string[] {
  const { data } = useGetActiveLocationsQuery()
  return useMemo(() => {
    const names = [
      ...(data ?? []).filter((l) => l.type === "district" || l.type === "city").map((l) => l.name),
      ...popularCities.map((c) => c.name),
    ]
    const byKey = new Map<string, string>()
    for (const n of names) if (!byKey.has(n.toLowerCase())) byKey.set(n.toLowerCase(), n)
    return Array.from(byKey.values()).sort()
  }, [data])
}

/** Typed text → search params: an exact (case-insensitive) city match becomes `city`, anything else `q`. */
export function resolveSearchText(text: string, cities: string[]): { city?: string; q?: string } {
  const trimmed = text.trim()
  if (!trimmed) return {}
  const city = cities.find((c) => c.toLowerCase() === trimmed.toLowerCase())
  return city ? { city } : { q: trimmed }
}

/**
 * Keyboard behaviour for a suggestion dropdown: ↑/↓ move the highlight,
 * Enter picks the highlighted suggestion (or submits the typed text when
 * nothing is highlighted), Escape closes the list.
 */
export function useSuggestionKeys({
  suggestions,
  onPick,
  onSubmit,
}: {
  suggestions: string[]
  onPick: (s: string) => void
  onSubmit: () => void
}) {
  const [active, setActive] = useState(-1)
  const [dismissed, setDismissed] = useState(false)
  const count = suggestions.length
  // A new suggestion set (the user typed) clears the highlight and reopens the list.
  const [lastSet, setLastSet] = useState(suggestions)
  if (lastSet !== suggestions && lastSet.join("\u0000") !== suggestions.join("\u0000")) {
    setLastSet(suggestions)
    setActive(-1)
    setDismissed(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && count > 0) {
      e.preventDefault()
      setDismissed(false)
      setActive((i) => (i + 1) % count)
    } else if (e.key === "ArrowUp" && count > 0) {
      e.preventDefault()
      setActive((i) => (i <= 0 ? count - 1 : i - 1))
    } else if (e.key === "Escape") {
      setDismissed(true)
      setActive(-1)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (!dismissed && active >= 0 && active < count) onPick(suggestions[active])
      else onSubmit()
      setDismissed(true)
    }
  }

  return { active: dismissed ? -1 : active, open: !dismissed, onKeyDown }
}

export function SuggestionList({
  id,
  suggestions,
  onPick,
  active = -1,
  className,
}: {
  /** Pair with the input's aria-controls; option ids derive from it. */
  id?: string
  suggestions: string[]
  onPick: (s: string) => void
  active?: number
  className?: string
}) {
  if (suggestions.length === 0) return null
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Search suggestions"
      className={cn(
        "absolute left-0 right-0 top-full z-40 mt-1 border border-brand-border-light bg-card py-1 text-left shadow-xl",
        className,
      )}
    >
      {suggestions.map((s, i) => (
        <li key={s} id={id ? `${id}-${i}` : undefined} role="option" aria-selected={i === active}>
          <button
            type="button"
            tabIndex={-1}
            // onMouseDown so the pick lands before the input's blur hides the list.
            onMouseDown={(e) => {
              e.preventDefault()
              onPick(s)
            }}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-brand-secondary hover:bg-brand-surface",
              i === active && "bg-brand-surface",
            )}
          >
            <Search className="h-3 w-3 shrink-0 text-brand-secondary/40" />
            <span className="truncate">{s}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
