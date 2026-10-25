"use client"

import { useId, useState, type ReactNode } from "react"
import type { User } from "@/lib/nav-store"
import { useLoadSession } from "@/hooks/use-auth"
import { getApiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import {
  INDIAN_STATES,
  INTENT_OPTIONS,
  NAME_MAX_LENGTH,
  CITY_MAX_LENGTH,
  isValidAvatarUrl,
  isValidCity,
  isValidFullName,
  isValidPincode,
  isValidState,
} from "@/lib/profile-options"
import {
  useUpdateProfileMutation,
  missingProfileFields,
  REQUIREMENT_LABEL,
  type Profile,
  type ProfileIntent,
} from "@/store/api/usersApi"
import { useGetActiveLocationsQuery } from "@/store/api/searchApi"
import { VerifyContactField } from "@/components/settings/verify-contact-field"

type FormState = {
  fullName: string
  intent: ProfileIntent | ""
  city: string
  state: string
  pincode: string
  avatarUrl: string
}

type FieldKey = keyof FormState

const FIELD_ERROR: Record<Exclude<FieldKey, "intent">, string> = {
  fullName: `2–${NAME_MAX_LENGTH} letters; spaces, dots, apostrophes and hyphens allowed.`,
  city: `2–${CITY_MAX_LENGTH} letters.`,
  state: "Pick your state.",
  pincode: "6 digits, can't start with 0.",
  avatarUrl: "Must be an https:// image link.",
}

function fieldError(key: FieldKey, form: FormState): string | null {
  switch (key) {
    case "fullName":
      return isValidFullName(form.fullName) ? null : FIELD_ERROR.fullName
    case "city":
      return isValidCity(form.city) ? null : FIELD_ERROR.city
    case "state":
      return isValidState(form.state) ? null : FIELD_ERROR.state
    case "pincode":
      return isValidPincode(form.pincode) ? null : FIELD_ERROR.pincode
    case "avatarUrl":
      return isValidAvatarUrl(form.avatarUrl) ? null : FIELD_ERROR.avatarUrl
    case "intent":
      return form.intent ? null : "Pick one."
  }
}

/**
 * The one profile form, shared by Settings and the signup profile step, so
 * both always ask for the same fields, in the same order, with the same
 * rules (profile-options.ts). Every profile field + a verified mobile and
 * email is compulsory; the avatar is the only optional field.
 *
 * Mount it only once the server copy of the profile has loaded — the form
 * seeds its state from `profile` on mount.
 */
export function ProfileDetailsForm({
  profile,
  user,
  inputClass,
  labelClass,
  layout = "grid",
  submitLabel,
  savingLabel = "Saving…",
  requireEdit,
  showAvatar,
  missingBanner,
  onSaved,
}: {
  profile: Profile | null
  user: User
  inputClass: string
  labelClass: string
  layout?: "grid" | "stack"
  submitLabel: ReactNode
  savingLabel?: string
  /** Settings: keep Save disabled until something actually changed. */
  requireEdit?: boolean
  showAvatar?: boolean
  /** Settings: always show what's missing. Signup: only once the user has started typing. */
  missingBanner: "always" | "after-edit"
  onSaved?: () => void
}) {
  const ids = useId()
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation()
  const loadSession = useLoadSession()
  const { data: locations } = useGetActiveLocationsQuery()
  const [form, setForm] = useState<FormState>({
    fullName: profile?.fullName ?? "",
    intent: profile?.intent ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    pincode: profile?.pincode ?? "",
    avatarUrl: profile?.avatarUrl ?? "",
  })
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)

  const missing = missingProfileFields({ ...form, intent: form.intent || null }, { phone: user.phone, email: user.email })
  // Mobile/email are verified on their own via OTP — they don't block saving the rest.
  const formInvalid =
    missing.some((key) => key !== "mobile" && key !== "email") || !isValidAvatarUrl(form.avatarUrl)
  const isDirty =
    form.fullName.trim() !== (profile?.fullName ?? "") ||
    form.intent !== (profile?.intent ?? "") ||
    form.city.trim() !== (profile?.city ?? "") ||
    form.state !== (profile?.state ?? "") ||
    form.pincode !== (profile?.pincode ?? "") ||
    form.avatarUrl.trim() !== (profile?.avatarUrl ?? "")
  const anyTouched = Object.values(touched).some(Boolean)
  const showMissing = missing.length > 0 && (missingBanner === "always" || anyTouched)
  // Signup can't continue without the verified contacts; Settings saves them separately.
  const submitDisabled =
    isSaving || formInvalid || (requireEdit ? !isDirty : missing.length > 0)

  const update = <K extends FieldKey>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setTouched((t) => ({ ...t, [key]: true }))
    setMessage(null)
  }

  const showError = (key: FieldKey) => (touched[key] ? fieldError(key, form) : null)

  const save = async () => {
    if (submitDisabled) return
    setMessage(null)
    // Everything in one PATCH — fullName/city/intent must travel together for completedAt.
    const avatar = form.avatarUrl.trim()
    try {
      await updateProfile({
        fullName: form.fullName.trim().replace(/\s+/g, " "),
        intent: form.intent || undefined,
        city: form.city.trim().replace(/\s+/g, " "),
        state: form.state,
        pincode: form.pincode,
        ...(avatar || profile?.avatarUrl ? { avatarUrl: avatar || null } : {}),
      }).unwrap()
      await loadSession().catch(() => {})
      setTouched({})
      setMessage({ kind: "ok", text: "Profile saved." })
      onSaved?.()
    } catch (error) {
      setMessage({ kind: "error", text: getApiErrorMessage(error) ?? "Couldn't save your profile. Please try again." })
    }
  }

  const cityOptions = Array.from(
    new Set((locations ?? []).filter((l) => l.type === "city" || l.type === "district").map((l) => l.name)),
  )

  const errorText = (key: FieldKey) => {
    const err = showError(key)
    return err ? (
      <p id={`${ids}-${key}-err`} className="mt-1 text-[11px] text-red-500">
        {err}
      </p>
    ) : null
  }

  return (
    <>
      {showMissing && (
        <p className="mt-4 border border-brand-primary/40 bg-brand-primary/10 px-3 py-2 text-xs text-brand-secondary">
          Complete your profile to contact sellers — still needed:{" "}
          <b>{missing.map((k) => REQUIREMENT_LABEL[k]).join(", ")}</b>.
        </p>
      )}

      <div className={cn("mt-5 gap-4", layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2" : "space-y-4")}>
        <div>
          <label htmlFor={`${ids}-fullName`} className={labelClass}>Full name *</label>
          <input
            id={`${ids}-fullName`}
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value.slice(0, NAME_MAX_LENGTH))}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="name"
            placeholder="Aarav Mehta"
            aria-invalid={!!showError("fullName")}
            className={inputClass}
          />
          {errorText("fullName")}
        </div>

        <div>
          <label htmlFor={`${ids}-intent`} className={labelClass}>I am a *</label>
          <select
            id={`${ids}-intent`}
            value={form.intent}
            onChange={(e) => update("intent", e.target.value as ProfileIntent)}
            className={inputClass}
          >
            <option value="" disabled>Select…</option>
            {INTENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${ids}-city`} className={labelClass}>City *</label>
          <input
            id={`${ids}-city`}
            value={form.city}
            onChange={(e) => update("city", e.target.value.slice(0, CITY_MAX_LENGTH))}
            list={`${ids}-city-list`}
            maxLength={CITY_MAX_LENGTH}
            autoComplete="address-level2"
            placeholder="Mumbai"
            aria-invalid={!!showError("city")}
            className={inputClass}
          />
          <datalist id={`${ids}-city-list`}>
            {cityOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          {errorText("city")}
        </div>

        <div>
          <label htmlFor={`${ids}-state`} className={labelClass}>State *</label>
          <select
            id={`${ids}-state`}
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            aria-invalid={!!showError("state")}
            className={inputClass}
          >
            <option value="" disabled>Select…</option>
            {/* Keep a legacy free-text value visible so it can be corrected. */}
            {form.state && !isValidState(form.state) && <option value={form.state}>{form.state}</option>}
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errorText("state")}
        </div>

        <div>
          <label htmlFor={`${ids}-pincode`} className={labelClass}>Pincode *</label>
          <input
            id={`${ids}-pincode`}
            value={form.pincode}
            onChange={(e) => update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            placeholder="400001"
            aria-invalid={!!showError("pincode")}
            className={inputClass}
          />
          {errorText("pincode")}
        </div>

        {showAvatar && (
          <div>
            <label htmlFor={`${ids}-avatarUrl`} className={labelClass}>Photo URL (optional)</label>
            <input
              id={`${ids}-avatarUrl`}
              value={form.avatarUrl}
              onChange={(e) => update("avatarUrl", e.target.value)}
              inputMode="url"
              placeholder="https://…"
              aria-invalid={!!showError("avatarUrl")}
              className={inputClass}
            />
            {errorText("avatarUrl")}
          </div>
        )}

        {/* Account contacts, added via OTP — not part of the profile save. */}
        <VerifyContactField channel="mobile" value={user.phone} label="Mobile *" inputClass={inputClass} labelClass={labelClass} />
        <VerifyContactField channel="email" value={user.email || undefined} label="Email *" inputClass={inputClass} labelClass={labelClass} />
      </div>

      {message && (
        <p className={cn("mt-3 text-xs font-semibold", message.kind === "ok" ? "text-emerald-600" : "text-red-500")}>
          {message.text}
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={submitDisabled}
        className={cn(
          "btn-gold relative mt-5 overflow-hidden text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60",
          layout === "stack" ? "flex w-full items-center justify-center gap-2 py-3.5" : "px-5 py-2",
        )}
      >
        <span className="relative z-10 flex items-center gap-2">{isSaving ? savingLabel : submitLabel}</span>
      </button>
    </>
  )
}
