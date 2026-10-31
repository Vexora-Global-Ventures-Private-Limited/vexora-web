"use client"

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Check, ChevronLeft, ChevronRight, Crown, ImagePlus, Loader2, Pencil, Plus, ShieldAlert, X } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { HOMEPAGE_IMAGES } from "@/lib/homepage-images"
import { isUnsignedUploadConfigured } from "@/lib/cloudinary"
import { ImageUploadButton } from "@/components/site/image-upload-button"
import { ListingPhotos } from "@/components/listings/listing-photos"
import { formatPaise, propertyTypeLabel } from "@/lib/api-mappers"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { useGetActiveLocationsQuery, useGetPublicConfigQuery } from "@/store/api/searchApi"
import {
  useCreateListingMutation,
  useSaveListingMediaMutation,
  useSignListingMediaMutation,
  useSubmitListingMutation,
  useUpdateListingStepMutation,
  type Listing,
} from "@/store/api/listingsApi"
import {
  ADDRESS_MAX,
  AREA_MAX,
  AREA_MIN,
  DESCRIPTION_MAX,
  INDIAN_STATES,
  LOCALITY_MAX,
  MAX_PHOTOS,
  NO_BHK_TYPES,
  PRICE_MAX_RUPEES,
  PRICE_MIN_RUPEES,
  TITLE_MAX,
  TITLE_MIN,
  digitsOnly,
  isHttpsUrl,
  isValidArea,
  isValidCity,
  isValidPincode,
  isValidPlaceName,
  isValidPriceRupees,
  isValidState,
  isValidTitle,
  rupeesDigitsToPaise,
} from "@/components/listings/listing-validation"

/**
 * The real listing wizard (Module 4):
 *
 *   1 Basics   → POST /listings (new) + PATCH /steps/1
 *   2 Location → PATCH /steps/2
 *   3 Details  → PATCH /steps/3
 *   4 Photos   → POST /listings/media/sign, then POST /listings/:id/media
 *   5 Review   → POST /listings/:id/submit
 *
 * Every "Next" saves that step, so a seller can leave and resume later from
 * the listing's own `wizardStep` (the edit page passes the draft in). The
 * backend validates almost nothing (see listing-validation.ts) and accepts
 * steps out of order, so every field is checked here before it's sent.
 */

type Step = 1 | 2 | 3 | 4 | 5

const STEP_LABELS: Record<Step, string> = { 1: "Basics", 2: "Location", 3: "Details", 4: "Photos", 5: "Review" }

// Sample photos for testing. Real photos are uploaded to Cloudinary
// (ImageUploadButton) or pasted as https links; all are saved as plain URLs.
const SAMPLE_PHOTOS = [
  HOMEPAGE_IMAGES.apartmentHighrise,
  HOMEPAGE_IMAGES.apartmentInterior,
  HOMEPAGE_IMAGES.penthouse,
  HOMEPAGE_IMAGES.villa,
  HOMEPAGE_IMAGES.luxuryResidence,
  HOMEPAGE_IMAGES.estate,
  HOMEPAGE_IMAGES.commercialTower,
  HOMEPAGE_IMAGES.landPlot,
]

const inputClass =
  "mt-1.5 w-full border border-brand-border bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary disabled:opacity-60 aria-[invalid=true]:border-red-400"
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground"

type Form = {
  propertyType: string
  purpose: "sale" | "rent"
  title: string
  bhk: string
  priceRupees: string
  city: string
  locality: string
  subLocality: string
  address: string
  state: string
  district: string
  pincode: string
  areaSqft: string
  description: string
}

type FieldKey = keyof Form

function formFromListing(listing?: Listing | null): Form {
  return {
    propertyType: listing?.propertyType ?? "",
    purpose: listing?.purpose === "rent" ? "rent" : "sale",
    // The backend titles a fresh draft "<type> listing" — don't prefill that.
    title: listing?.title && listing.title !== `${listing.propertyType} listing` ? listing.title : "",
    bhk: listing?.bhk ? String(listing.bhk) : "",
    // Whole rupees only (the form never produces fractional paise).
    priceRupees: listing?.pricePaise && listing.pricePaise > 0 ? String(Math.round(listing.pricePaise / 100)) : "",
    city: listing?.city ?? "",
    locality: listing?.locality ?? "",
    subLocality: listing?.subLocality ?? "",
    address: listing?.address ?? "",
    state: listing?.state ?? "",
    district: listing?.district ?? "",
    pincode: listing?.pincode ?? "",
    areaSqft: listing?.areaSqft && listing.areaSqft > 0 ? String(listing.areaSqft) : "",
    description: listing?.description ?? "",
  }
}

const STEP_FIELDS: Record<1 | 2 | 3, FieldKey[]> = {
  1: ["propertyType", "purpose", "title", "bhk", "priceRupees"],
  2: ["city", "locality", "subLocality", "district", "state", "pincode", "address"],
  3: ["areaSqft", "description"],
}

/** Per-field error message, or null when valid. */
function fieldError(key: FieldKey, form: Form, bhkValues: number[]): string | null {
  const showBhk = !!form.propertyType && !NO_BHK_TYPES.has(form.propertyType)
  switch (key) {
    case "propertyType":
      return form.propertyType ? null : "Pick a property type."
    case "title":
      return isValidTitle(form.title) ? null : `Use ${TITLE_MIN}–${TITLE_MAX} characters.`
    case "bhk":
      if (!showBhk) return null
      if (!form.bhk) return "Pick a BHK option."
      return bhkValues.length === 0 || bhkValues.includes(Number(form.bhk)) ? null : "That BHK option isn't available."
    case "priceRupees":
      return isValidPriceRupees(form.priceRupees)
        ? null
        : `Enter an amount between ${formatPaise(PRICE_MIN_RUPEES * 100)} and ${formatPaise(PRICE_MAX_RUPEES * 100)}.`
    case "city":
      return isValidCity(form.city) ? null : "Enter a city (letters only)."
    case "locality":
      return isValidPlaceName(form.locality) ? null : "Enter the locality, e.g. Bandra West."
    case "subLocality":
      return !form.subLocality.trim() || isValidPlaceName(form.subLocality) ? null : "Use letters, numbers and basic punctuation."
    case "district":
      return !form.district.trim() || isValidCity(form.district) ? null : "Enter a district name (letters only)."
    case "state":
      return isValidState(form.state) ? null : "Pick a state."
    case "pincode":
      return !form.pincode || isValidPincode(form.pincode) ? null : "6 digits, can't start with 0."
    case "address":
      return form.address.trim().length <= ADDRESS_MAX ? null : `Keep it under ${ADDRESS_MAX} characters.`
    case "areaSqft":
      return isValidArea(form.areaSqft)
        ? null
        : `Enter an area between ${AREA_MIN.toLocaleString("en-IN")} and ${AREA_MAX.toLocaleString("en-IN")} sq.ft.`
    case "description":
      return form.description.trim().length <= DESCRIPTION_MAX ? null : `Keep it under ${DESCRIPTION_MAX.toLocaleString("en-IN")} characters.`
    default:
      return null
  }
}

function stepIsValid(step: 1 | 2 | 3, form: Form, bhkValues: number[]) {
  return STEP_FIELDS[step].every((k) => fieldError(k, form, bhkValues) === null)
}

/** Only include keys with a real value — the backend stores "" as-is. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined && v !== null)) as Partial<T>
}

export function ListingWizard({ draft }: { draft?: Listing | null }) {
  const router = useRouter()
  const ids = useId()
  const [listing, setListing] = useState<Listing | null>(draft ?? null)
  const [form, setForm] = useState<Form>(() => formFromListing(draft))
  // Resume where the seller left off — but never past a step whose saved
  // data is missing/invalid (the backend lets steps be saved out of order,
  // so wizardStep alone can't be trusted). BHK options aren't known yet on
  // the first render, so they're ignored for this check.
  const [step, setStepState] = useState<Step>(() => {
    if (!draft) return 1
    const saved = formFromListing(draft)
    const resumeAt = Math.min(Math.max(draft.wizardStep, 1), 5) as Step
    const firstInvalid = ([1, 2, 3] as const).find((s) => !stepIsValid(s, saved, []))
    return firstInvalid && firstInvalid < resumeAt ? firstInvalid : resumeAt
  })
  const [photos, setPhotos] = useState<string[]>([])
  const [brokenPhotos, setBrokenPhotos] = useState<string[]>([])
  const [photoUrl, setPhotoUrl] = useState("")
  const [photoError, setPhotoError] = useState<string | null>(null)
  // Media isn't returned on GET /listings/:id, so on resume we only know
  // photos exist because the wizard already got past step 4.
  const [photosAlreadySaved, setPhotosAlreadySaved] = useState(() => (draft?.wizardStep ?? 0) >= 5)
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [attempted, setAttempted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<null | "submitted" | "membership_required" | "kyc_required">(null)
  // A synchronous lock: RTK's isLoading only flips after a re-render, so a
  // fast double-click could otherwise fire two creates (two drafts) or two
  // submits before `busy` turns true.
  const inFlight = useRef(false)

  const { data: config, isError: configFailed, refetch: refetchConfig } = useGetPublicConfigQuery()
  const { data: locations } = useGetActiveLocationsQuery()
  const [createListing, createState] = useCreateListingMutation()
  const [updateStep, updateState] = useUpdateListingStepMutation()
  const [signMedia] = useSignListingMediaMutation()
  const [saveMedia, mediaState] = useSaveListingMediaMutation()
  const [submitListing, submitState] = useSubmitListingMutation()
  const busy = createState.isLoading || updateState.isLoading || mediaState.isLoading || submitState.isLoading
  // Device uploads: a backend-signed ticket when the API has Cloudinary
  // credentials (probed once on reaching the photos step), else the
  // unsigned preset from env. Neither → link pasting only.
  const [signedUploads, setSignedUploads] = useState(false)
  const listingId = listing?._id
  useEffect(() => {
    if (step !== 4 || !listingId) return
    let cancelled = false
    signMedia(listingId)
      .unwrap()
      .then((ticket) => !cancelled && setSignedUploads(!!ticket))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [step, listingId, signMedia])
  const canUpload = signedUploads || isUnsignedUploadConfigured()
  const addUploadedPhotos = (urls: string[]) => {
    setPhotoError(null)
    setPhotos((p) => {
      const room = MAX_PHOTOS - p.length
      const fresh = urls.filter((u) => !p.includes(u))
      if (fresh.length > room) setPhotoError(`You can add up to ${MAX_PHOTOS} photos.`)
      return [...p, ...fresh.slice(0, Math.max(0, room))]
    })
  }

  const propertyTypes = config?.allowedPropertyTypes ?? []
  const bhkValues = config?.allowedBhkValues ?? []
  const showBhk = !!form.propertyType && !NO_BHK_TYPES.has(form.propertyType)

  // City suggestions from the Location Master. Free text is still allowed —
  // the Location Master is far too sparse to restrict to.
  const cityOptions = useMemo(
    () => Array.from(new Set((locations ?? []).filter((l) => l.type === "city" || l.type === "district").map((l) => l.name))).sort(),
    [locations],
  )
  const localityOptions = useMemo(
    () => Array.from(new Set((locations ?? []).filter((l) => l.type === "locality").map((l) => l.name))).sort(),
    [locations],
  )
  const stateForCity = (city: string) =>
    (locations ?? []).find((l) => l.name.toLowerCase() === city.trim().toLowerCase() && l.state)?.state ?? ""

  const setStep = (next: Step) => {
    setStepState(next)
    setError(null)
    setAttempted(false)
  }

  const set = <K extends FieldKey>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setTouched((t) => ({ ...t, [key]: true }))
    setError(null)
  }

  const errorFor = (key: FieldKey) => (touched[key] || attempted ? fieldError(key, form, bhkValues) : null)

  const stepValid: Record<Step, boolean> = {
    1: stepIsValid(1, form, bhkValues),
    2: stepIsValid(2, form, bhkValues),
    3: stepIsValid(3, form, bhkValues),
    4: (photos.length > 0 && photos.every((p) => !brokenPhotos.includes(p))) || (photos.length === 0 && photosAlreadySaved),
    5: true,
  }

  // Unsaved edits on the current step — warn before the tab is closed.
  const saved = formFromListing(listing)
  const dirty =
    (step <= 3 && STEP_FIELDS[step as 1 | 2 | 3].some((k) => form[k].trim() !== saved[k].trim())) || (step === 4 && photos.length > 0)
  useEffect(() => {
    if (!dirty || outcome) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty, outcome])

  const fail = (err: unknown, fallback: string) => {
    const code = getApiErrorCode(err)
    if (code === "BHK_NOT_ALLOWED") return setError("That BHK option isn't available — please pick another.")
    if (code === "PROPERTY_TYPE_NOT_ALLOWED") return setError("That property type isn't available any more — please pick another.")
    if (code === "FORBIDDEN") return setError("This listing belongs to another account.")
    if (code === "CONFLICT" && /submitted/i.test(getApiErrorMessage(err) ?? "")) {
      return setError("This listing has already been submitted and can't be edited.")
    }
    if (!code) return setError("Network problem — check your connection and try again.")
    setError(getApiErrorMessage(err) ?? fallback)
  }

  const saveCurrentStep = async (): Promise<boolean> => {
    setError(null)
    let current = listing
    try {
      if (step === 1) {
        if (!current) {
          // Quota is meant to be enforced HERE (409), not at submit.
          current = await createListing({ propertyType: form.propertyType, purpose: form.purpose }).unwrap()
          // Keep the draft even if the step PATCH below fails — otherwise
          // the next click would create a second, duplicate draft.
          setListing(current)
          // Swap the URL to the draft's own edit page so a refresh resumes it.
          window.history.replaceState(null, "", ROUTES.editListing(current._id))
        }
        const updated = await updateStep({
          id: current._id,
          step: 1,
          body: {
            propertyType: form.propertyType,
            purpose: form.purpose,
            title: form.title.trim().replace(/\s+/g, " "),
            ...(showBhk ? { bhk: Number(form.bhk) } : {}),
            pricePaise: rupeesDigitsToPaise(form.priceRupees),
          },
        }).unwrap()
        setListing(updated)
      } else if (step === 2 && current) {
        const updated = await updateStep({
          id: current._id,
          step: 2,
          body: compact({
            city: form.city.trim().replace(/\s+/g, " "),
            locality: form.locality.trim().replace(/\s+/g, " "),
            subLocality: form.subLocality.trim(),
            address: form.address.trim(),
            state: form.state,
            district: form.district.trim(),
            pincode: form.pincode,
          }),
        }).unwrap()
        setListing(updated)
      } else if (step === 3 && current) {
        const updated = await updateStep({
          id: current._id,
          step: 3,
          body: compact({ areaSqft: Number(form.areaSqft), description: form.description.trim() }),
        }).unwrap()
        setListing(updated)
      } else if (step === 4 && current) {
        if (photos.length > 0) {
          // Uploaded photos are already on Cloudinary (uploaded when picked),
          // so every entry is a plain https URL here. POST /media APPENDS to
          // the saved photos (verified 2026-10-30) — the saved ones are
          // managed separately in the photo step (ListingPhotos).
          const res = await saveMedia({ id: current._id, urls: photos }).unwrap()
          setListing(res.listing)
          setPhotosAlreadySaved(true)
          setPhotos([])
        }
      }
      return true
    } catch (err) {
      if (getApiErrorCode(err) === "CONFLICT" && step === 1 && !listing && !current) {
        setError("You've reached your plan's listing limit. Delete an old listing or upgrade your membership to add more.")
        return false
      }
      fail(err, "Couldn't save this step. Please try again.")
      return false
    }
  }

  const next = async () => {
    if (busy || inFlight.current) return
    if (!stepValid[step]) {
      setAttempted(true)
      if (step === 4) setPhotoError(photos.length === 0 ? "Add at least one photo." : "Remove the photos that failed to load.")
      return
    }
    inFlight.current = true
    try {
      if (await saveCurrentStep()) setStep(Math.min(step + 1, 5) as Step)
    } finally {
      inFlight.current = false
    }
  }

  const submit = async () => {
    if (!listing || busy || inFlight.current) return
    // The backend only checks wizardStep >= 5, not the data itself — so a
    // draft with a step saved out of order could go to review half-empty.
    const firstInvalid = ([1, 2, 3] as const).find((s) => !stepIsValid(s, formFromListing(listing), bhkValues))
    if (firstInvalid) {
      setStep(firstInvalid)
      setAttempted(true)
      setError(`Please complete the ${STEP_LABELS[firstInvalid]} step before submitting.`)
      return
    }
    inFlight.current = true
    setError(null)
    try {
      await submitListing(listing._id).unwrap()
      setOutcome("submitted")
    } catch (err) {
      const code = getApiErrorCode(err)
      // A Free user's finished draft is kept server-side — this is the
      // upsell moment, not a dead end.
      if (code === "MEMBERSHIP_REQUIRED") return setOutcome("membership_required")
      if (code === "KYC_REQUIRED_FOR_SUBMISSION") return setOutcome("kyc_required")
      if (code === "VALIDATION_ERROR" && /steps/i.test(getApiErrorMessage(err) ?? "")) {
        return setError("Some steps aren't saved yet — go back and save each step, then submit again.")
      }
      // Submitted already (e.g. from another tab) — show the success state.
      if (code === "CONFLICT" && /already submitted/i.test(getApiErrorMessage(err) ?? "")) return setOutcome("submitted")
      fail(err, "Couldn't submit your listing. Please try again.")
    } finally {
      inFlight.current = false
    }
  }

  const addPhoto = (raw: string) => {
    const url = raw.trim()
    setPhotoError(null)
    if (!url) return
    if (!isHttpsUrl(url)) return setPhotoError("Paste a full https:// image link.")
    if (photos.includes(url)) return setPhotoError("That photo is already added.")
    if (photos.length >= MAX_PHOTOS) return setPhotoError(`You can add up to ${MAX_PHOTOS} photos.`)
    setPhotos((p) => [...p, url])
    setPhotoUrl("")
  }

  const removePhoto = (url: string) => {
    setPhotos((p) => p.filter((x) => x !== url))
    setBrokenPhotos((b) => b.filter((x) => x !== url))
    setPhotoError(null)
  }

  const togglePhoto = (url: string) => (photos.includes(url) ? removePhoto(url) : addPhoto(url))

  const makeCover = (url: string) => setPhotos((p) => [url, ...p.filter((x) => x !== url)])

  const cancel = () => {
    if (dirty && !window.confirm("Discard the changes on this step?")) return
    router.push(ROUTES.dashboardTab("listings"))
  }

  if (outcome) {
    return <WizardOutcome outcome={outcome} onBack={() => setOutcome(null)} />
  }

  const fieldId = (key: string) => `${ids}-${key}`
  const errorText = (key: FieldKey) => {
    const err = errorFor(key)
    return err ? (
      <p id={`${fieldId(key)}-err`} className="mt-1 text-[11px] text-red-500">
        {err}
      </p>
    ) : null
  }
  const a11y = (key: FieldKey) => ({
    id: fieldId(key),
    "aria-invalid": !!errorFor(key),
    "aria-describedby": errorFor(key) ? `${fieldId(key)}-err` : undefined,
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
  })

  return (
    <div>
      {/* Step indicator */}
      <ol className="flex flex-wrap items-center gap-2" aria-label="Listing steps">
        {([1, 2, 3, 4, 5] as Step[]).map((s) => (
          <li key={s} className="flex items-center gap-2" aria-current={s === step ? "step" : undefined}>
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-xs font-bold",
                s < step ? "bg-brand-primary text-ink-black" : s === step ? "bg-brand-secondary text-brand-primary" : "bg-brand-tertiary text-brand-secondary/50",
              )}
            >
              {s < step ? <Check className="h-3.5 w-3.5" aria-hidden /> : s}
            </span>
            <span className={cn("text-xs font-bold", s === step ? "text-brand-secondary" : "text-brand-secondary/50", s !== step && "hidden sm:inline")}>
              {STEP_LABELS[s]}
            </span>
            {s < 5 && <span className="h-px w-4 bg-brand-border" aria-hidden />}
          </li>
        ))}
      </ol>

      <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-sheen mt-6 bg-card p-4 sm:p-6">
        {step === 1 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <fieldset className="sm:col-span-2">
              <legend className={labelClass}>I want to</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(["sale", "rent"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={form.purpose === p}
                    onClick={() => set("purpose", p)}
                    className={cn(
                      "border py-2.5 text-sm font-bold transition-colors",
                      form.purpose === p ? "border-brand-primary-dark bg-brand-surface text-brand-secondary" : "border-brand-border text-brand-secondary/60 hover:bg-brand-surface",
                    )}
                  >
                    {p === "sale" ? "Sell" : "Rent out"}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="sm:col-span-2">
              <legend className={labelClass}>Property type *</legend>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {configFailed ? (
                  <span className="text-xs text-red-500">
                    Couldn&apos;t load property types.{" "}
                    <button type="button" onClick={() => refetchConfig()} className="font-bold underline">Retry</button>
                  </span>
                ) : propertyTypes.length === 0 ? (
                  <span className="text-xs text-brand-muted-foreground">Loading…</span>
                ) : null}
                {propertyTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={form.propertyType === t}
                    onClick={() => {
                      setForm((f) => ({ ...f, propertyType: t, bhk: NO_BHK_TYPES.has(t) ? "" : f.bhk }))
                      setTouched((x) => ({ ...x, propertyType: true }))
                    }}
                    className={cn(
                      "border px-4 py-2 text-xs font-bold transition-colors",
                      form.propertyType === t ? "border-brand-primary-dark bg-brand-surface text-brand-secondary" : "border-brand-border text-brand-secondary/60 hover:bg-brand-surface",
                    )}
                  >
                    {propertyTypeLabel(t)}
                  </button>
                ))}
              </div>
              {errorText("propertyType")}
            </fieldset>
            <div className="sm:col-span-2">
              <label htmlFor={fieldId("title")} className={labelClass}>Listing title *</label>
              <input
                {...a11y("title")}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="2BHK sea-view apartment in Bandra West"
                maxLength={TITLE_MAX}
                className={inputClass}
              />
              <div className="flex justify-between">
                {errorText("title") ?? <span />}
                <span className="mt-1 text-[11px] text-brand-muted-foreground">{form.title.trim().length}/{TITLE_MAX}</span>
              </div>
            </div>
            {showBhk && (
              <div>
                <label htmlFor={fieldId("bhk")} className={labelClass}>BHK *</label>
                <select {...a11y("bhk")} value={form.bhk} onChange={(e) => set("bhk", e.target.value)} className={inputClass}>
                  <option value="" disabled>Select…</option>
                  {bhkValues.map((b) => (
                    <option key={b} value={b}>{b} BHK</option>
                  ))}
                </select>
                {errorText("bhk")}
              </div>
            )}
            <div>
              <label htmlFor={fieldId("priceRupees")} className={labelClass}>
                {form.purpose === "rent" ? "Monthly rent (₹) *" : "Price (₹) *"}
              </label>
              <input
                {...a11y("priceRupees")}
                value={form.priceRupees}
                onChange={(e) => set("priceRupees", digitsOnly(e.target.value, 11))}
                inputMode="numeric"
                placeholder={form.purpose === "rent" ? "45000" : "8500000"}
                className={inputClass}
              />
              {errorText("priceRupees") ??
                (Number(form.priceRupees) > 0 && (
                  <p className="mt-1 text-xs text-brand-muted-foreground">{formatPaise(rupeesDigitsToPaise(form.priceRupees))}</p>
                ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={fieldId("city")} className={labelClass}>City *</label>
              <input
                {...a11y("city")}
                value={form.city}
                onChange={(e) => {
                  const city = e.target.value
                  // Auto-fill the state from the Location Master when it's known and not chosen yet.
                  const knownState = stateForCity(city)
                  setForm((f) => ({ ...f, city, state: !f.state && isValidState(knownState) ? knownState : f.state }))
                  setTouched((t) => ({ ...t, city: true }))
                  setError(null)
                }}
                list={`${ids}-cities`}
                maxLength={50}
                autoComplete="address-level2"
                placeholder="Mumbai"
                className={inputClass}
              />
              <datalist id={`${ids}-cities`}>
                {cityOptions.map((c) => <option key={c} value={c} />)}
              </datalist>
              {errorText("city")}
            </div>
            <div>
              <label htmlFor={fieldId("locality")} className={labelClass}>Locality *</label>
              <input
                {...a11y("locality")}
                value={form.locality}
                onChange={(e) => set("locality", e.target.value)}
                list={`${ids}-localities`}
                maxLength={LOCALITY_MAX}
                placeholder="Bandra West"
                className={inputClass}
              />
              <datalist id={`${ids}-localities`}>
                {localityOptions.map((c) => <option key={c} value={c} />)}
              </datalist>
              {errorText("locality")}
            </div>
            <div>
              <label htmlFor={fieldId("subLocality")} className={labelClass}>Sub-locality / society (optional)</label>
              <input {...a11y("subLocality")} value={form.subLocality} onChange={(e) => set("subLocality", e.target.value)} maxLength={LOCALITY_MAX} className={inputClass} />
              {errorText("subLocality")}
            </div>
            <div>
              <label htmlFor={fieldId("district")} className={labelClass}>District (optional)</label>
              <input {...a11y("district")} value={form.district} onChange={(e) => set("district", e.target.value)} maxLength={50} className={inputClass} />
              {errorText("district")}
            </div>
            <div>
              <label htmlFor={fieldId("state")} className={labelClass}>State *</label>
              <select {...a11y("state")} value={form.state} onChange={(e) => set("state", e.target.value)} className={inputClass}>
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
              <label htmlFor={fieldId("pincode")} className={labelClass}>Pincode (optional)</label>
              <input
                {...a11y("pincode")}
                value={form.pincode}
                onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                className={inputClass}
              />
              {errorText("pincode")}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={fieldId("address")} className={labelClass}>Address (optional — not shown publicly)</label>
              <input {...a11y("address")} value={form.address} onChange={(e) => set("address", e.target.value)} maxLength={ADDRESS_MAX} className={inputClass} />
              {errorText("address")}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 gap-4">
            <div className="sm:max-w-xs">
              <label htmlFor={fieldId("areaSqft")} className={labelClass}>Area (sq.ft) *</label>
              <input
                {...a11y("areaSqft")}
                value={form.areaSqft}
                onChange={(e) => set("areaSqft", digitsOnly(e.target.value, 8))}
                inputMode="numeric"
                placeholder="950"
                className={inputClass}
              />
              {errorText("areaSqft")}
            </div>
            <div>
              <label htmlFor={fieldId("description")} className={labelClass}>Description (optional)</label>
              <textarea
                {...a11y("description")}
                value={form.description}
                onChange={(e) => set("description", e.target.value.slice(0, DESCRIPTION_MAX))}
                rows={6}
                maxLength={DESCRIPTION_MAX}
                placeholder="What makes this home special — views, amenities, nearby schools and transport…"
                className={inputClass}
              />
              <div className="flex justify-between">
                {errorText("description") ?? <span />}
                <span className="mt-1 text-[11px] text-brand-muted-foreground">
                  {form.description.length.toLocaleString("en-IN")}/{DESCRIPTION_MAX.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="text-sm text-brand-muted-foreground">
              {canUpload ? "Upload photos, paste an https link" : "Add photos by https link"} or pick sample images (up to {MAX_PHOTOS}). The first photo is the cover.
            </p>
            {photosAlreadySaved && listing && (
              <div className="mt-4">
                <p className={labelClass}>Saved photos</p>
                <ListingPhotos listingId={listing._id} editable className="mt-2" />
                <p className={cn(labelClass, "mt-5")}>Add more</p>
              </div>
            )}
            {canUpload && listing && (
              <ImageUploadButton
                folder="listings"
                multiple
                maxFiles={MAX_PHOTOS - photos.length}
                disabled={photos.length >= MAX_PHOTOS}
                getTicket={signedUploads ? () => signMedia(listing._id).unwrap() : undefined}
                onUploaded={addUploadedPhotos}
                className="mt-4"
              />
            )}
            <div className="mt-4 flex gap-2">
              <label htmlFor={`${ids}-photo`} className="sr-only">Photo link</label>
              <input
                id={`${ids}-photo`}
                value={photoUrl}
                onChange={(e) => {
                  setPhotoUrl(e.target.value)
                  setPhotoError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addPhoto(photoUrl)
                  }
                }}
                inputMode="url"
                placeholder="https://…/photo.jpg"
                className="w-full border border-brand-border bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary"
              />
              <button
                type="button"
                onClick={() => addPhoto(photoUrl)}
                disabled={!photoUrl.trim()}
                className="flex shrink-0 items-center gap-1.5 border border-brand-border px-4 text-xs font-bold text-brand-secondary hover:bg-brand-surface disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {photoError && <p className="mt-2 text-xs font-semibold text-red-500">{photoError}</p>}

            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {photos.map((url, i) => {
                  const broken = brokenPhotos.includes(url)
                  return (
                    <div key={url} className={cn("relative aspect-[4/3] overflow-hidden bg-brand-tertiary", broken && "ring-2 ring-red-400")}>
                      {broken ? (
                        <span className="grid h-full place-items-center px-2 text-center text-[11px] font-semibold text-red-600">
                          Couldn&apos;t load this image
                        </span>
                      ) : (
                        <img
                          src={url}
                          alt={`Photo ${i + 1}`}
                          onError={() => setBrokenPhotos((b) => (b.includes(url) ? b : [...b, url]))}
                          className="h-full w-full object-cover"
                        />
                      )}
                      {i === 0 ? (
                        <span className="absolute left-1.5 top-1.5 bg-ink-black/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-primary">Cover</span>
                      ) : (
                        !broken && (
                          <button
                            type="button"
                            onClick={() => makeCover(url)}
                            className="absolute left-1.5 top-1.5 bg-card/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand-secondary"
                          >
                            Make cover
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(url)}
                        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-card/90 text-brand-secondary"
                        aria-label={`Remove photo ${i + 1}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            <p className={cn(labelClass, "mt-6")}>Sample photos</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SAMPLE_PHOTOS.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  aria-pressed={photos.includes(url)}
                  aria-label={`Sample photo ${i + 1}`}
                  onClick={() => togglePhoto(url)}
                  className={cn(
                    "relative aspect-[4/3] overflow-hidden ring-2",
                    photos.includes(url) ? "ring-brand-primary" : "ring-transparent opacity-80 hover:opacity-100",
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {!photos.includes(url) && (
                    <span className="absolute inset-0 grid place-items-center bg-ink-black/20 text-white">
                      <ImagePlus className="h-4 w-4" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && listing && (
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-secondary">{listing.title}</h3>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <ReviewItem label="Type" value={`${propertyTypeLabel(listing.propertyType)} · ${listing.purpose === "rent" ? "Rent" : "Sale"}`} onEdit={() => setStep(1)} />
              <ReviewItem label={listing.purpose === "rent" ? "Monthly rent" : "Price"} value={formatPaise(listing.pricePaise)} onEdit={() => setStep(1)} />
              {listing.bhk && !NO_BHK_TYPES.has(listing.propertyType) ? <ReviewItem label="BHK" value={`${listing.bhk} BHK`} onEdit={() => setStep(1)} /> : null}
              <ReviewItem label="Area" value={listing.areaSqft ? `${listing.areaSqft.toLocaleString("en-IN")} sq.ft` : "—"} onEdit={() => setStep(3)} />
              <ReviewItem
                label="Location"
                value={[listing.subLocality, listing.locality, listing.city, listing.state].filter(Boolean).join(", ") || "—"}
                onEdit={() => setStep(2)}
              />
              <ReviewItem label="Photos" value={photosAlreadySaved ? "Saved" : "Not added"} onEdit={() => setStep(4)} />
            </dl>
            {listing.description && <p className="mt-4 whitespace-pre-line break-words text-sm text-brand-secondary/75">{listing.description}</p>}
            <p className="mt-5 border border-brand-border bg-brand-tertiary/40 p-3 text-xs text-brand-secondary/70">
              Submitting sends this listing to our review team. It goes live for buyers once approved — usually within a day.
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-xs font-semibold text-red-500">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-brand-border pt-5">
          <button
            type="button"
            onClick={() => (step === 1 ? cancel() : setStep((step - 1) as Step))}
            disabled={busy}
            className="flex items-center gap-1.5 border border-brand-border bg-card px-5 py-2.5 text-sm font-bold text-brand-secondary hover:bg-brand-surface disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" /> {step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              disabled={busy}
              aria-disabled={!stepValid[step]}
              className={cn(
                "btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40",
                !stepValid[step] && "opacity-60",
              )}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {busy ? "Saving…" : "Save & continue"} <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={busy || !listing}
              className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {busy ? "Submitting…" : "Submit for review"}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function ReviewItem({ label, value, onEdit }: { label: string; value: ReactNode; onEdit?: () => void }) {
  return (
    <div>
      <dt className={cn(labelClass, "flex items-center gap-2")}>
        {label}
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-brand-primary-dark hover:text-brand-secondary" aria-label={`Edit ${label}`}>
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </dt>
      <dd className="mt-0.5 break-words font-semibold text-brand-secondary">{value}</dd>
    </div>
  )
}

function WizardOutcome({
  outcome,
  onBack,
}: {
  outcome: "submitted" | "membership_required" | "kyc_required"
  onBack: () => void
}) {
  const router = useRouter()

  if (outcome === "submitted") {
    return (
      <div className="card-sheen bg-card p-8 text-center">
        <Check className="mx-auto h-12 w-12 text-brand-primary-dark" />
        <h2 className="mt-4 font-serif text-2xl font-bold text-brand-secondary">Submitted for review</h2>
        <p className="mt-2 text-sm text-brand-muted-foreground">
          Our team will review your listing shortly. You&apos;ll see it go live in My Listings once it&apos;s approved.
        </p>
        <button
          onClick={() => router.push(ROUTES.dashboardTab("listings"))}
          className="btn-gold relative mt-6 overflow-hidden px-6 py-2.5 text-sm font-bold"
        >
          <span className="relative z-10">Go to My Listings</span>
        </button>
      </div>
    )
  }

  if (outcome === "kyc_required") {
    return (
      <div className="card-sheen bg-card p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-brand-primary-dark" />
        <h2 className="mt-4 font-serif text-2xl font-bold text-brand-secondary">Verify your identity first</h2>
        <p className="mt-2 text-sm text-brand-muted-foreground">
          Your plan requires KYC verification before listings can be submitted. Your draft is saved — come back and submit once you&apos;re verified.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => router.push(ROUTES.dashboardTab("verification"))} className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold">
            <span className="relative z-10">Verify now</span>
          </button>
          <button onClick={onBack} className="border border-brand-border px-5 py-2.5 text-sm font-bold text-brand-secondary hover:bg-brand-surface">
            Back to review
          </button>
        </div>
      </div>
    )
  }

  // MEMBERSHIP_REQUIRED — the draft is complete and kept; this is the conversion moment.
  return (
    <div className="bg-gradient-to-br from-brand-primary/15 via-brand-tertiary to-card p-8 text-center ring-1 ring-brand-primary/30">
      <Crown className="mx-auto h-12 w-12 text-brand-primary-dark" />
      <h2 className="mt-4 font-serif text-2xl font-bold text-brand-secondary">Your listing is ready to go live</h2>
      <p className="mt-2 text-sm text-brand-secondary/70">
        Publishing listings is part of every VXP membership. Your draft is saved — pick a plan, then submit it from My Listings.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => router.push(ROUTES.membership)}
          className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold"
        >
          <span className="relative z-10">See membership plans</span>
        </button>
        <button
          onClick={() => router.push(ROUTES.dashboardTab("listings"))}
          className="border border-brand-border bg-card px-5 py-2.5 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
        >
          Keep as draft
        </button>
      </div>
    </div>
  )
}
