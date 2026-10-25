"use client"

import { useId, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useSessionGuard } from "@/lib/use-session-guard"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { useCreateProjectMutation, useGetMyBuilderProfileQuery } from "@/store/api/listingsApi"
import { BuilderProfileForm } from "@/components/listings/builder-profile-form"
import { DESCRIPTION_MAX, isValidCity, isValidPlaceName } from "@/components/listings/listing-validation"

const inputClass =
  "mt-1.5 w-full border border-brand-border bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary aria-[invalid=true]:border-red-400"
const PROJECT_NAME_MAX = 80

type ProjectForm = { name: string; city: string; locality: string; description: string }

function projectErrors(form: ProjectForm): Partial<Record<keyof ProjectForm, string>> {
  return {
    name: isValidPlaceName(form.name, PROJECT_NAME_MAX) ? undefined : `2–${PROJECT_NAME_MAX} characters.`,
    city: isValidCity(form.city) ? undefined : "Enter a city (letters only).",
    locality: isValidPlaceName(form.locality) ? undefined : "Enter the locality, e.g. Worli.",
    description: form.description.length <= DESCRIPTION_MAX ? undefined : `Keep it under ${DESCRIPTION_MAX} characters.`,
  }
}
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground"

/**
 * Venus: POST /projects { name, city, locality } — then straight on to the
 * inventory editor to add towers and units. A project hangs off the
 * builder profile, so that has to exist first.
 */
export function NewProjectPage() {
  const router = useRouter()
  const { ready, user } = useSessionGuard((u) => !!u && u.tier === "V", ROUTES.dashboard)
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileFailed,
    refetch: refetchProfile,
  } = useGetMyBuilderProfileQuery(undefined, { skip: !ready || !user?.id })
  const [createProject, { isLoading }] = useCreateProjectMutation()
  const [form, setForm] = useState<ProjectForm>({ name: "", city: "", locality: "", description: "" })
  const [touched, setTouched] = useState<Partial<Record<keyof ProjectForm, boolean>>>({})
  const [error, setError] = useState<string | null>(null)
  const ids = useId()
  // Synchronous double-click guard — isLoading only flips after a re-render.
  const inFlight = useRef(false)

  if (!ready || !user) return null

  const errors = projectErrors(form)
  const valid = !Object.values(errors).some(Boolean)

  const update = (key: keyof ProjectForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setTouched((t) => ({ ...t, [key]: true }))
    setError(null)
  }
  const field = (key: keyof ProjectForm) => ({
    id: `${ids}-${key}`,
    "aria-invalid": !!(touched[key] && errors[key]),
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
  })
  const errorText = (key: keyof ProjectForm) =>
    touched[key] && errors[key] ? <p className="mt-1 text-[11px] text-red-500">{errors[key]}</p> : null

  const handleSubmit = async () => {
    if (!valid) {
      setTouched({ name: true, city: true, locality: true, description: true })
      return
    }
    if (isLoading || inFlight.current) return
    inFlight.current = true
    setError(null)
    try {
      const created = await createProject({
        name: form.name.trim().replace(/\s+/g, " "),
        city: form.city.trim().replace(/\s+/g, " "),
        locality: form.locality.trim().replace(/\s+/g, " "),
        ...(form.description.trim() && { description: form.description.trim() }),
      }).unwrap()
      router.push(ROUTES.editProject(created._id))
    } catch (err) {
      const code = getApiErrorCode(err)
      setError(
        code === "FORBIDDEN"
          ? "Projects are available on the Venus plan only."
          : getApiErrorMessage(err) ?? "Couldn't create the project. Please try again.",
      )
      inFlight.current = false
    }
  }

  return (
    <div className="min-h-screen bg-card">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <button
            onClick={() => router.push(ROUTES.dashboardTab("projects"))}
            className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to my projects
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand-primary-dark" />
          <h1 className="font-serif text-2xl font-bold text-brand-secondary">List a new project</h1>
        </div>
        <p className="mt-1 text-sm text-brand-muted-foreground">
          Start with the basics — you&apos;ll add towers and unit inventory on the next screen.
        </p>

        <div className="mt-6">
          {!user.id ? (
            <p className="card-sheen bg-card p-6 text-sm text-brand-secondary/70">Sign in with a real Venus account to list projects.</p>
          ) : profileLoading ? (
            <div className="card-sheen h-48 animate-pulse bg-card" aria-busy="true" aria-label="Loading" />
          ) : profileFailed ? (
            <p className="card-sheen bg-card p-6 text-sm text-brand-secondary/70">
              Couldn&apos;t load your builder profile.{" "}
              <button onClick={() => refetchProfile()} className="font-bold text-brand-primary-dark underline">Retry</button>
            </p>
          ) : !profile ? (
            <BuilderProfileForm profile={null} />
          ) : (
            <div className="card-sheen bg-card p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor={`${ids}-name`} className={labelClass}>Project name *</label>
                  <input {...field("name")} value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={PROJECT_NAME_MAX} className={inputClass} />
                  {errorText("name")}
                </div>
                <div>
                  <label htmlFor={`${ids}-city`} className={labelClass}>City *</label>
                  <input {...field("city")} value={form.city} onChange={(e) => update("city", e.target.value)} maxLength={50} className={inputClass} />
                  {errorText("city")}
                </div>
                <div>
                  <label htmlFor={`${ids}-locality`} className={labelClass}>Locality *</label>
                  <input {...field("locality")} value={form.locality} onChange={(e) => update("locality", e.target.value)} maxLength={80} className={inputClass} />
                  {errorText("locality")}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`${ids}-description`} className={labelClass}>Description (optional)</label>
                  <textarea
                    {...field("description")}
                    value={form.description}
                    onChange={(e) => update("description", e.target.value.slice(0, DESCRIPTION_MAX))}
                    rows={4}
                    maxLength={DESCRIPTION_MAX}
                    className={inputClass}
                  />
                  {errorText("description")}
                </div>
              </div>
              {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-500">{error}</p>}
              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-brand-border pt-5">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="relative z-10">{isLoading ? "Creating…" : "Create project"}</span>
                </button>
                <button
                  onClick={() => router.push(ROUTES.dashboardTab("projects"))}
                  className="border border-brand-border bg-card px-5 py-2.5 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
