"use client"

import { useId, useRef, type ClipboardEvent, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"

export const OTP_LENGTH = 6
export const emptyOtp = () => Array.from({ length: OTP_LENGTH }, () => "")

/**
 * The 6-box OTP entry shared by login and signup.
 *
 * - Pasting (or SMS autofill via autocomplete="one-time-code") fills every
 *   box at once instead of dropping all 6 digits into the first one.
 * - Arrow keys / Backspace move between boxes.
 * - `onComplete` fires once all 6 digits are in, so callers can submit
 *   without an extra tap (they must still guard against double-submits).
 * - `disabled` locks the boxes once the code can no longer succeed.
 */
export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
}: {
  value: string[]
  onChange: (next: string[]) => void
  onComplete?: (code: string) => void
  disabled?: boolean
  invalid?: boolean
}) {
  const baseId = useId()
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const focusBox = (i: number) => refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus()

  const commit = (next: string[]) => {
    onChange(next)
    if (next.every((d) => d)) onComplete?.(next.join(""))
  }

  const fillFrom = (start: number, digits: string) => {
    const next = [...value]
    let i = start
    for (const d of digits) {
      if (i >= OTP_LENGTH) break
      next[i++] = d
    }
    commit(next)
    focusBox(i)
  }

  const onPaste = (start: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "")
    if (!digits) return
    e.preventDefault()
    fillFrom(digits.length >= OTP_LENGTH ? 0 : start, digits.slice(0, OTP_LENGTH))
  }

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      e.preventDefault()
      const next = [...value]
      next[i - 1] = ""
      onChange(next)
      focusBox(i - 1)
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      focusBox(i - 1)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      focusBox(i + 1)
    }
  }

  return (
    <div className="mt-6 flex justify-center gap-2" role="group" aria-label="6-digit verification code">
      {value.map((digit, i) => (
        <input
          key={i}
          id={`${baseId}-${i}`}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          // Lets iOS/Android offer the code from the SMS; the browser then
          // fills the first box with all 6 digits, handled like a paste.
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={digit}
          onPaste={onPaste(i)}
          onKeyDown={onKeyDown(i)}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "")
            if (digits.length > 1) {
              // Autofill / IME delivered several digits into one box.
              fillFrom(digits.length >= OTP_LENGTH ? 0 : i, digits.slice(0, OTP_LENGTH))
              return
            }
            const next = [...value]
            next[i] = digits
            commit(next)
            if (digits && i < OTP_LENGTH - 1) focusBox(i + 1)
          }}
          className={cn(
            "h-12 w-11 border bg-card text-center font-serif text-xl font-bold text-brand-secondary outline-none focus:border-brand-primary-dark focus:ring-2 focus:ring-brand-primary-dark/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-12",
            invalid ? "border-red-400" : "border-brand-border-light",
          )}
        />
      ))}
    </div>
  )
}

/** "4:59" from seconds. */
export function formatCountdown(seconds: number) {
  const s = Math.max(0, seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}
