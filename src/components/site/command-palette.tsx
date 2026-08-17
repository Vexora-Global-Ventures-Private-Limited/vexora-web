"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { useThemeSettings } from "@/lib/theme-settings-store"
import { loadCommandRecents, pushCommandRecent, type CommandRecent } from "@/lib/command-recents"
import {
  Building2,
  Crown,
  Headset,
  LayoutDashboard,
  LogIn,
  MapPin,
  Palette,
  Settings2,
  Sparkles,
} from "lucide-react"

const SECTIONS = [
  { id: "buy", label: "Featured Residences", href: "#buy" },
  { id: "developers", label: "Featured Developers", href: "#developers" },
  { id: "agents", label: "Popular Cities", href: "#agents" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [recents, setRecents] = useState<CommandRecent[]>([])
  const router = useRouter()
  const user = useNav((s) => s.user)
  const openSettings = useThemeSettings((s) => s.setOpen)

  const run = useCallback((item: CommandRecent, fn: () => void) => {
    setOpen(false)
    const next = pushCommandRecent(item)
    setRecents(next)
    fn()
  }, [])

  useEffect(() => {
    if (open) setRecents(loadCommandRecents())
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Search sections and actions">
      <CommandInput placeholder="Search residences, cities, actions…" />
      <CommandList>
        <CommandEmpty>No results — try &quot;Mumbai&quot; or &quot;settings&quot;</CommandEmpty>
        {recents.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recents.map((r) => (
                <CommandItem
                  key={r.id}
                  value={r.label}
                  onSelect={() => {
                    if (r.action === "settings") run(r, () => openSettings(true))
                    else if (r.action === "login") run(r, () => router.push(ROUTES.login))
                    else if (r.action === "dashboard") run(r, () => router.push(ROUTES.dashboard))
                    else if (r.action === "signup") run(r, () => router.push(ROUTES.signup))
                    else if (r.action === "top") run(r, () => window.scrollTo({ top: 0, behavior: "smooth" }))
                    else if (r.action.startsWith("#")) run(r, () => document.querySelector(r.action)?.scrollIntoView({ behavior: "smooth" }))
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4 text-brand-primary-dark" />
                  {r.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="Navigate">
          {SECTIONS.map((s) => (
            <CommandItem
              key={s.id}
              value={s.label}
              onSelect={() => run({ id: s.id, label: s.label, action: s.href }, () => document.querySelector(s.href)?.scrollIntoView({ behavior: "smooth" }))}
            >
              <MapPin className="mr-2 h-4 w-4 text-brand-primary-dark" />
              {s.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {user ? (
            <CommandItem value="dashboard" onSelect={() => run({ id: "advisor", label: "Dashboard", action: "dashboard" }, () => router.push(ROUTES.dashboard))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
          ) : (
            <CommandItem value="advisor login" onSelect={() => run({ id: "advisor", label: "Private advisor", action: "login" }, () => router.push(ROUTES.login))}>
              <Headset className="mr-2 h-4 w-4" />
              Private advisor
            </CommandItem>
          )}
          <CommandItem value="login" onSelect={() => run({ id: "login", label: "Log in", action: "login" }, () => router.push(ROUTES.login))}>
            <LogIn className="mr-2 h-4 w-4" />
            Log in
          </CommandItem>
          <CommandItem value="signup register" onSelect={() => run({ id: "signup", label: "Sign up", action: "signup" }, () => router.push(ROUTES.signup))}>
            <Crown className="mr-2 h-4 w-4" />
            Sign up
          </CommandItem>
          <CommandItem value="settings theme colors" onSelect={() => run({ id: "settings", label: "Open settings", action: "settings" }, () => openSettings(true))}>
            <Settings2 className="mr-2 h-4 w-4" />
            Open settings
          </CommandItem>
          <CommandItem value="scroll top reset" onSelect={() => run({ id: "scroll-top", label: "Scroll to top", action: "top" }, () => window.scrollTo({ top: 0, behavior: "smooth" }))}>
            <Sparkles className="mr-2 h-4 w-4" />
            Scroll to top
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Explore">
          <CommandItem value="properties luxury" onSelect={() => run({ id: "luxury", label: "Luxury listings", action: "#buy" }, () => document.getElementById("buy")?.scrollIntoView({ behavior: "smooth" }))}>
            <Building2 className="mr-2 h-4 w-4" />
            Luxury listings
          </CommandItem>
          <CommandItem value="brand colors palette" onSelect={() => run({ id: "palette", label: "Brand color picker", action: "settings" }, () => openSettings(true))}>
            <Palette className="mr-2 h-4 w-4" />
            Brand color picker
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
