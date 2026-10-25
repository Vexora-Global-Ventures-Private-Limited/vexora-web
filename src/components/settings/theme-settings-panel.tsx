"use client"

import { useId, useState } from "react"
import { Palette, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useBrandColors } from "@/lib/brand-colors-store"
import { COLOR_PRESETS, normalizeHex } from "@/lib/brand-colors"
import { useThemeSettings } from "@/lib/theme-settings-store"
import { cn } from "@/lib/utils"

const ROLES = [
  { key: "primary" as const, label: "Primary (Gold)", hint: "Buttons, accents, highlights" },
  { key: "secondary" as const, label: "Secondary (Ink)", hint: "Text, headers, dark surfaces" },
  { key: "tertiary" as const, label: "Tertiary (Background)", hint: "Page background, cards" },
]

export function ThemeSettingsPanel() {
  const { open, setOpen } = useThemeSettings()
  const { colors, setColor, applyPreset, reset } = useBrandColors()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className={cn(
          "panel-scroll flex w-full flex-col gap-0 overflow-hidden border-brand-border p-0",
          "sm:max-w-[340px]",
        )}
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-brand-border/60 px-5 pb-4 pt-5">
          <SheetTitle className="font-serif text-lg tracking-tight">Settings</SheetTitle>
          <SheetDescription className="text-sm text-brand-muted-foreground">
            Brand colors. Saved to this browser.
          </SheetDescription>
        </SheetHeader>

        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 [-webkit-overflow-scrolling:touch]"
        >
          <div className="space-y-8 pb-2">
            <section>
              <h3 className="text-eyebrow mb-3 text-brand-primary-dark">Brand colors</h3>
              <div className="space-y-4">
                {ROLES.map(({ key, label, hint }) => (
                  <ColorRow
                    key={key}
                    label={label}
                    hint={hint}
                    value={colors[key]}
                    onChange={(hex) => setColor(key, hex)}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-eyebrow mb-3 text-brand-primary-dark">Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.colors)}
                    className="flex items-center gap-2 border border-brand-border bg-card p-2.5 text-left text-xs font-medium transition-colors hover:bg-brand-surface active:scale-[0.98]"
                  >
                    <span className="flex shrink-0 gap-0.5">
                      <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: preset.colors.primary }} />
                      <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: preset.colors.secondary }} />
                      <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: preset.colors.tertiary }} />
                    </span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <Button
              variant="outline"
              className="w-full border-brand-border"
              onClick={() => reset()}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset colors
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-brand-border/60 px-5 py-4 text-[11px] text-brand-muted-foreground">
          <Palette className="h-3.5 w-3.5 shrink-0" />
          <span>Changes apply instantly · stored in localStorage</span>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * One colour role: native picker + hex text box. The text box keeps its own
 * draft so partial input ("#a", "#ab3") can be typed — it used to be bound
 * straight to the stored colour and every incomplete keystroke was
 * rejected, which made typing a hex code impossible. It applies as soon as
 * the draft is a valid colour.
 */
function ColorRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string
  onChange: (hex: string) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  // Re-seed the box when the colour changes from outside (picker, preset,
  // reset) — but never while the user is typing in it, or a valid short hex
  // like "#abc" would be swapped for "#aabbcc" mid-keystroke.
  const [seenValue, setSeenValue] = useState(value)
  if (value !== seenValue) {
    setSeenValue(value)
    if (!editing) setDraft(value)
  }
  const invalid = draft.trim() !== "" && normalizeHex(draft) === null

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-hex`} className="text-xs font-medium text-brand-secondary">{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => {
            const hex = normalizeHex(e.target.value)
            if (hex) onChange(hex)
          }}
          className="h-10 w-14 shrink-0 cursor-pointer border border-brand-border bg-card p-1"
          aria-label={`${label} picker`}
        />
        <input
          id={`${id}-hex`}
          type="text"
          value={draft}
          maxLength={7}
          onChange={(e) => {
            setDraft(e.target.value)
            const hex = normalizeHex(e.target.value)
            if (hex) onChange(hex)
          }}
          onFocus={() => setEditing(true)}
          onBlur={() => {
            setEditing(false)
            setDraft(value)
          }}
          aria-invalid={invalid}
          aria-describedby={`${id}-hint`}
          className={cn(
            "h-10 min-w-0 flex-1 border bg-card px-3 font-mono text-xs uppercase tracking-wide",
            invalid ? "border-red-400" : "border-brand-border",
          )}
          spellCheck={false}
        />
      </div>
      <p id={`${id}-hint`} className="text-[11px] text-brand-muted-foreground">
        {invalid ? "Enter a hex colour like #BD9935." : hint}
      </p>
    </div>
  )
}
