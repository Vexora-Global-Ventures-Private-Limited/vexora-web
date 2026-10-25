"use client"

import { useId, useState } from "react"
import { Building2 } from "lucide-react"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import { isHttpsUrl, isValidCity, isValidPlaceName } from "@/components/listings/listing-validation"
import {
  useCreateBuilderProfileMutation,
  useUpdateBuilderProfileMutation,
  type BuilderProfile,
} from "@/store/api/listingsApi"

const inputClass =
  "mt-1.5 w-full border border-brand-border bg-card px-3 py-2 text-sm outline-none focus:border-brand-primary aria-[invalid=true]:border-red-400"
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground"

const NAME_MAX = 80
const ABOUT_MAX = 1000

type FormState = { displayName: string; city: string; logoUrl: string; about: string }

function errorsFor(form: FormState): Partial<Record<keyof FormState, string>> {
  return {
    displayName: isValidPlaceName(form.displayName, NAME_MAX) ? undefined : `2–${NAME_MAX} characters.`,
    city: !form.city.trim() || isValidCity(form.city) ? undefined : "Enter a city (letters only).",
    logoUrl: !form.logoUrl.trim() || isHttpsUrl(form.logoUrl) ? undefined : "Must be a full https:// image link.",
    about: form.about.length <= ABOUT_MAX ? undefined : `Keep it under ${ABOUT_MAX} characters.`,
  }
}

/**
 * Create (POST /builders/me — one per account, a second POST is a conflict)
 * or edit (PATCH /builders/me) the public builder page. Jupiter/Venus only.
 */
export function BuilderProfileForm({ profile, onDone }: { profile: BuilderProfile | null; onDone?: () => void }) {
  const ids = useId()
  const initial: FormState = {
    displayName: profile?.displayName ?? "",
    city: profile?.city ?? "",
    logoUrl: profile?.logoUrl ?? "",
    about: profile?.about ?? "",
  }
  const [form, setForm] = useState<FormState>(initial)
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({})
  const [createProfile, createState] = useCreateBuilderProfileMutation()
  const [updateProfile, updateState] = useUpdateBuilderProfileMutation()
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)
  const busy = createState.isLoading || updateState.isLoading

  const errors = errorsFor(form)
  const invalid = Object.values(errors).some(Boolean)
  const dirty = (Object.keys(form) as (keyof FormState)[]).some((k) => form[k].trim() !== initial[k].trim())

  const update = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setTouched((t) => ({ ...t, [key]: true }))
    setMessage(null)
  }

  const save = async () => {
    if (busy || invalid || (profile && !dirty)) {
      setTouched({ displayName: true, city: true, logoUrl: true, about: true })
      return
    }
    setMessage(null)
    const trimmed = {
      displayName: form.displayName.trim().replace(/\s+/g, " "),
      city: form.city.trim(),
      logoUrl: form.logoUrl.trim(),
      about: form.about.trim(),
    }
    try {
      if (profile) {
        // On edit, a cleared optional field is sent as null so it's actually
        // removed (omitting it would leave the old value in place).
        await updateProfile({
          displayName: trimmed.displayName,
          city: trimmed.city || null,
          logoUrl: trimmed.logoUrl || null,
          about: trimmed.about || null,
        }).unwrap()
      } else {
        await createProfile(Object.fromEntries(Object.entries(trimmed).filter(([, v]) => v))).unwrap()
      }
      setMessage({ kind: "ok", text: profile ? "Builder profile saved." : "Builder profile created." })
      onDone?.()
    } catch (err) {
      const code = getApiErrorCode(err)
      setMessage({
        kind: "error",
        text:
          code === "CONFLICT" && !profile
            ? "You already have a builder profile — reload the page to edit it."
            : code === "FORBIDDEN"
              ? "Builder pages are part of the Jupiter and Venus plans."
              : getApiErrorMessage(err) ?? "Couldn't save your builder profile.",
      })
    }
  }

  const field = (key: keyof FormState) => ({
    id: `${ids}-${key}`,
    "aria-invalid": !!(touched[key] && errors[key]),
    "aria-describedby": touched[key] && errors[key] ? `${ids}-${key}-err` : undefined,
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
  })
  const errorText = (key: keyof FormState) =>
    touched[key] && errors[key] ? (
      <p id={`${ids}-${key}-err`} className="mt-1 text-[11px] text-red-500">
        {errors[key]}
      </p>
    ) : null

  return (
    <div className="card-sheen bg-card p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-brand-primary-dark" />
        <h3 className="font-serif text-lg font-bold text-brand-secondary">
          {profile ? "Builder profile" : "Create your builder profile"}
        </h3>
      </div>
      {!profile && (
        <p className="mt-1 text-sm text-brand-muted-foreground">
          Your public developer page — buyers see your name, logo and city, and your projects are listed under it.
        </p>
      )}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${ids}-displayName`} className={labelClass}>Company / display name *</label>
          <input {...field("displayName")} value={form.displayName} onChange={(e) => update("displayName", e.target.value)} maxLength={NAME_MAX} className={inputClass} />
          {errorText("displayName")}
        </div>
        <div>
          <label htmlFor={`${ids}-city`} className={labelClass}>City</label>
          <input {...field("city")} value={form.city} onChange={(e) => update("city", e.target.value)} maxLength={50} className={inputClass} />
          {errorText("city")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${ids}-logoUrl`} className={labelClass}>Logo URL (optional)</label>
          <input {...field("logoUrl")} value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} inputMode="url" placeholder="https://…" className={inputClass} />
          {errorText("logoUrl")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${ids}-about`} className={labelClass}>About (shown to signed-in buyers)</label>
          <textarea {...field("about")} value={form.about} onChange={(e) => update("about", e.target.value.slice(0, ABOUT_MAX))} rows={3} maxLength={ABOUT_MAX} className={inputClass} />
          <div className="flex justify-between">
            {errorText("about") ?? <span />}
            <span className="mt-1 text-[11px] text-brand-muted-foreground">{form.about.length}/{ABOUT_MAX}</span>
          </div>
        </div>
      </div>
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={cn("mt-3 text-xs font-semibold", message.kind === "ok" ? "text-emerald-600" : "text-red-500")}>
          {message.text}
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={busy || (!!profile && !dirty)}
        className="btn-gold relative mt-4 overflow-hidden px-5 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="relative z-10">{busy ? "Saving…" : profile ? "Save profile" : "Create profile"}</span>
      </button>
    </div>
  )
}
