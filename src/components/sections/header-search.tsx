"use client"

import { useId, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  SuggestionList,
  useCityNames,
  useSearchSuggestions,
  useSuggestionKeys,
} from "@/components/property/search-suggest"

type HeaderSearchProps = {
  className?: string
}

/**
 * Header-embedded quick search: keyword (with live title suggestions) +
 * city from the Location Master, submitted into /properties' filter grammar.
 */
export function HeaderSearch({ className }: HeaderSearchProps) {
  const router = useRouter()
  const [text, setText] = useState("")
  const [focused, setFocused] = useState(false)
  const [city, setCity] = useState("All")
  const cities = useCityNames()
  const suggestions = useSearchSuggestions(text)

  const listId = useId()

  const submit = (q = text) => {
    router.push(ROUTES.propertiesSearch({ q: q.trim() || undefined, city: city !== "All" ? city : undefined }))
  }
  const pick = (s: string) => {
    setText(s)
    submit(s)
  }
  const keys = useSuggestionKeys({ suggestions, onPick: pick, onSubmit: () => submit() })
  const showList = focused && keys.open && suggestions.length > 0

  return (
    <div
      className={cn(
        "flex h-11 items-stretch border border-brand-border-light bg-card/95 shadow-[var(--shadow-royal-sm)] transition-shadow duration-300 focus-within:shadow-[var(--shadow-royal-md)]",
        className,
      )}
    >
      <div className="relative flex min-w-0 flex-1 items-center">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={keys.onKeyDown}
          placeholder="Search homes…"
          aria-label="Search properties"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && keys.active >= 0 ? `${listId}-${keys.active}` : undefined}
          className="h-full w-full min-w-0 bg-transparent px-3 text-[12px] font-medium text-brand-secondary outline-none placeholder:text-brand-secondary/40"
        />
        {showList && <SuggestionList id={listId} suggestions={suggestions} active={keys.active} onPick={pick} />}
      </div>

      <span className="w-px shrink-0 self-stretch bg-brand-border-light" aria-hidden />

      <Select value={city} onValueChange={setCity}>
        <SelectTrigger
          aria-label="City"
          size="sm"
          className="h-full w-24 shrink-0 gap-1 rounded-none border-0 bg-transparent px-2.5 text-[11px] font-medium text-brand-secondary shadow-none focus-visible:ring-0 data-[size=sm]:h-full sm:w-28 [&_svg]:size-3 [&_svg]:opacity-40"
        >
          <MapPin className="shrink-0 text-brand-secondary/40" aria-hidden />
          <SelectValue placeholder="All cities" />
        </SelectTrigger>
        <SelectContent className="rounded-none border-brand-border-light" position="popper" sideOffset={6}>
          <SelectItem value="All" className="rounded-none text-xs">All cities</SelectItem>
          {cities.map((c) => (
            <SelectItem key={c} value={c} className="rounded-none text-xs">{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={() => submit()}
        className="flex shrink-0 items-center gap-1.5 bg-brand-primary px-4 text-[11px] font-bold uppercase tracking-wide text-ink-black transition-colors duration-300 hover:bg-brand-primary-light active:bg-brand-primary"
      >
        <Search className="h-3.5 w-3.5" />
        Search
      </button>
    </div>
  )
}
