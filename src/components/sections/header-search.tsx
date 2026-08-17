"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/routes"
import { CITIES } from "@/lib/vxp-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const INTENTS = [
  { label: "Invest", purpose: null },
  { label: "Sale", purpose: "Sale" },
  { label: "Rent", purpose: "Rent" },
] as const

type HeaderSearchProps = {
  className?: string
}

/** Header-embedded quick search: Invest/Sale/Rent intent + city, submits into /properties' existing filter grammar. */
export function HeaderSearch({ className }: HeaderSearchProps) {
  const router = useRouter()
  const [intent, setIntent] = useState<(typeof INTENTS)[number]["label"]>("Sale")
  const [city, setCity] = useState("All")

  const submit = () => {
    const params = new URLSearchParams()
    const purpose = INTENTS.find((i) => i.label === intent)?.purpose
    if (purpose) params.set("purpose", purpose)
    if (city !== "All") params.set("city", city)
    const qs = params.toString()
    router.push(qs ? `${ROUTES.properties}?${qs}` : ROUTES.properties)
  }

  return (
    <div
      className={cn(
        "flex h-11 items-stretch border border-brand-border-light bg-card/95 shadow-[var(--shadow-royal-sm)] transition-shadow duration-300 focus-within:shadow-[var(--shadow-royal-md)]",
        className,
      )}
    >
      <div className="flex shrink-0 items-stretch">
        {INTENTS.map((i) => (
          <button
            key={i.label}
            type="button"
            onClick={() => setIntent(i.label)}
            className={cn(
              "flex w-16 items-center justify-center text-[11px] font-bold uppercase tracking-wide transition-colors duration-300",
              intent === i.label
                ? "bg-brand-secondary text-brand-primary-light"
                : "text-brand-secondary/55 hover:bg-brand-surface hover:text-brand-secondary",
            )}
          >
            {i.label}
          </button>
        ))}
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
          {CITIES.map((c) => (
            <SelectItem key={c} value={c} className="rounded-none text-xs">{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={submit}
        className="flex shrink-0 items-center gap-1.5 bg-brand-primary px-4 text-[11px] font-bold uppercase tracking-wide text-ink-black transition-colors duration-300 hover:bg-brand-primary-light active:bg-brand-primary"
      >
        <Search className="h-3.5 w-3.5" />
        Search
      </button>
    </div>
  )
}
