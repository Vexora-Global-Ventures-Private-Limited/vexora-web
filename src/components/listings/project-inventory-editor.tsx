"use client"

import { useId, useState } from "react"
import { Layers3, Plus } from "lucide-react"
import { formatPaise } from "@/lib/api-mappers"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { useGetPublicConfigQuery } from "@/store/api/searchApi"
import {
  useCreateTowerMutation,
  useCreateUnitMutation,
  useUpdateProjectMutation,
  useUpdateUnitMutation,
  type Project,
  type Tower,
} from "@/store/api/listingsApi"
import { UNIT_STATUSES, UNIT_STATUS_LABEL } from "@/components/listings/project-helpers"
import {
  AREA_MAX,
  AREA_MIN,
  DESCRIPTION_MAX,
  PRICE_MAX_RUPEES,
  PRICE_MIN_RUPEES,
  TOWER_FLOORS_MAX,
  UNIT_NUMBER_MAX,
  digitsOnly,
  isValidArea,
  isValidCity,
  isValidFloors,
  isValidPlaceName,
  isValidPriceRupees,
  isValidUnitNumber,
  rupeesDigitsToPaise,
} from "@/components/listings/listing-validation"

const inputClass = "w-full border border-brand-border bg-card px-3 py-2 text-sm outline-none focus:border-brand-primary"
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground"

/**
 * Venus inventory manager — Projects → Towers → Units. Manual entry only
 * (no CSV, per BRD). Every write is Venus-gated server-side.
 */
export function ProjectInventoryEditor({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      <ProjectBasicsForm project={project} />
      <div className="card-sheen bg-card p-6">
        <div className="flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-brand-primary-dark" />
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Towers &amp; units</h3>
        </div>
        <div className="mt-4 space-y-5">
          {(project.towers ?? []).length === 0 && (
            <p className="text-sm text-brand-muted-foreground">No towers yet — add the first one below.</p>
          )}
          {(project.towers ?? []).map((tower) => (
            <TowerBlock key={tower._id} tower={tower} projectId={project._id} />
          ))}
        </div>
        <AddTowerForm projectId={project._id} />
      </div>
    </div>
  )
}

function ProjectBasicsForm({ project }: { project: Project }) {
  const ids = useId()
  const initial = { name: project.name, city: project.city, locality: project.locality, description: project.description ?? "" }
  const [form, setForm] = useState(initial)
  const [updateProject, { isLoading }] = useUpdateProjectMutation()
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null)
  const errors = {
    name: isValidPlaceName(form.name, 80) ? null : "2–80 characters.",
    city: isValidCity(form.city) ? null : "Enter a city (letters only).",
    locality: isValidPlaceName(form.locality) ? null : "Enter the locality.",
    description: form.description.length <= DESCRIPTION_MAX ? null : `Keep it under ${DESCRIPTION_MAX} characters.`,
  }
  const valid = !Object.values(errors).some(Boolean)
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k].trim() !== initial[k].trim())

  const save = async () => {
    if (!valid || !dirty || isLoading) return
    setMessage(null)
    try {
      await updateProject({
        id: project._id,
        body: {
          name: form.name.trim(),
          city: form.city.trim(),
          locality: form.locality.trim(),
          description: form.description.trim(),
        },
      }).unwrap()
      setMessage({ kind: "ok", text: "Project saved." })
    } catch (err) {
      setMessage({
        kind: "error",
        text: getApiErrorCode(err) === "FORBIDDEN" ? "Only the project's developer can edit it." : getApiErrorMessage(err) ?? "Couldn't save the project.",
      })
    }
  }

  const fields = [
    { key: "name", label: "Project name *", max: 80 },
    { key: "city", label: "City *", max: 50 },
    { key: "locality", label: "Locality *", max: 80 },
  ] as const

  return (
    <div className="card-sheen bg-card p-4 sm:p-6">
      <h3 className="font-serif text-lg font-bold text-brand-secondary">Project details</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {fields.map(({ key, label, max }) => (
          <div key={key}>
            <label htmlFor={`${ids}-${key}`} className={labelClass}>{label}</label>
            <input
              id={`${ids}-${key}`}
              value={form[key]}
              onChange={(e) => {
                setForm({ ...form, [key]: e.target.value })
                setMessage(null)
              }}
              maxLength={max}
              aria-invalid={!!errors[key]}
              className={`mt-1.5 ${inputClass} aria-[invalid=true]:border-red-400`}
            />
            {errors[key] && <p className="mt-1 text-[11px] text-red-500">{errors[key]}</p>}
          </div>
        ))}
        <div className="sm:col-span-3">
          <label htmlFor={`${ids}-description`} className={labelClass}>Description (optional)</label>
          <textarea
            id={`${ids}-description`}
            value={form.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value.slice(0, DESCRIPTION_MAX) })
              setMessage(null)
            }}
            rows={3}
            maxLength={DESCRIPTION_MAX}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>
      </div>
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={"mt-3 text-xs font-semibold " + (message.kind === "ok" ? "text-emerald-600" : "text-red-500")}>
          {message.text}
        </p>
      )}
      <button onClick={save} disabled={!valid || !dirty || isLoading} className="btn-gold relative mt-4 overflow-hidden px-5 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50">
        <span className="relative z-10">{isLoading ? "Saving…" : "Save details"}</span>
      </button>
    </div>
  )
}

function TowerBlock({ tower, projectId }: { tower: Tower; projectId: string }) {
  const [updateUnit] = useUpdateUnitMutation()
  const [error, setError] = useState<string | null>(null)
  // Units with a status change in flight — their select is locked until it
  // settles, so two quick changes can't race and land out of order.
  const [pending, setPending] = useState<string[]>([])
  const units = tower.units ?? []

  const changeStatus = async (unitId: string, status: string) => {
    if (pending.includes(unitId)) return
    setError(null)
    setPending((p) => [...p, unitId])
    try {
      await updateUnit({ id: unitId, projectId, body: { status } }).unwrap()
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "Couldn't update the unit.")
    } finally {
      setPending((p) => p.filter((id) => id !== unitId))
    }
  }

  return (
    <div className="border border-brand-border">
      <div className="flex items-center justify-between bg-brand-tertiary/50 px-4 py-2.5">
        <span className="font-bold text-brand-secondary">{tower.name}</span>
        <span className="text-xs text-brand-muted-foreground">
          {tower.floors ? `${tower.floors} floors · ` : ""}
          {units.length} unit{units.length === 1 ? "" : "s"}
        </span>
      </div>
      {units.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-brand-muted-foreground">
              <tr>
                <th className="px-4 py-2">Unit</th>
                <th className="px-4 py-2">BHK</th>
                <th className="px-4 py-2">Area</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u._id} className="border-t border-brand-border">
                  <td className="px-4 py-2 font-semibold text-brand-secondary">{u.unitNumber}</td>
                  <td className="px-4 py-2">{u.bhk ? `${u.bhk} BHK` : "—"}</td>
                  <td className="px-4 py-2">{u.areaSqft ? `${u.areaSqft.toLocaleString("en-IN")} sq.ft` : "—"}</td>
                  <td className="px-4 py-2">{formatPaise(u.pricePaise)}</td>
                  <td className="px-4 py-2">
                    <select
                      value={u.status}
                      onChange={(e) => changeStatus(u._id, e.target.value)}
                      disabled={pending.includes(u._id)}
                      aria-label={`Status of unit ${u.unitNumber}`}
                      className="border border-brand-border bg-card px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {UNIT_STATUSES.map((s) => (
                        <option key={s} value={s}>{UNIT_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && <p className="px-4 pb-2 text-xs font-semibold text-red-500">{error}</p>}
      <AddUnitForm towerId={tower._id} projectId={projectId} />
    </div>
  )
}

function AddTowerForm({ projectId }: { projectId: string }) {
  const ids = useId()
  const [name, setName] = useState("")
  const [floors, setFloors] = useState("")
  const [createTower, { isLoading }] = useCreateTowerMutation()
  const [error, setError] = useState<string | null>(null)
  const nameValid = isValidPlaceName(name, 40)
  const floorsValid = isValidFloors(floors)

  const add = async () => {
    if (isLoading) return
    if (!nameValid) return setError("Tower name: 2–40 characters.")
    if (!floorsValid) return setError(`Floors: a number from 1 to ${TOWER_FLOORS_MAX}.`)
    setError(null)
    try {
      await createTower({ projectId, name: name.trim(), floors: Number(floors) }).unwrap()
      setName("")
      setFloors("")
    } catch (err) {
      // Tower names are unique per project.
      setError(getApiErrorCode(err) === "CONFLICT" ? "A tower with that name already exists." : getApiErrorMessage(err) ?? "Couldn't add the tower.")
    }
  }

  return (
    <div className="mt-5 border-t border-brand-border pt-5">
      <p className={labelClass}>Add a tower</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <label htmlFor={`${ids}-name`} className="sr-only">Tower name</label>
        <input
          id={`${ids}-name`}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError(null)
          }}
          maxLength={40}
          placeholder="Tower A"
          className={`${inputClass} sm:max-w-[12rem]`}
        />
        <label htmlFor={`${ids}-floors`} className="sr-only">Number of floors</label>
        <input
          id={`${ids}-floors`}
          value={floors}
          onChange={(e) => {
            setFloors(digitsOnly(e.target.value, 3))
            setError(null)
          }}
          placeholder="Floors"
          inputMode="numeric"
          className={`${inputClass} max-w-[7rem]`}
        />
        <button
          onClick={add}
          disabled={!name.trim() || !floors || isLoading}
          className="flex items-center gap-1.5 border border-brand-border px-4 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-surface disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> {isLoading ? "Adding…" : "Add tower"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  )
}

function AddUnitForm({ towerId, projectId }: { towerId: string; projectId: string }) {
  const ids = useId()
  const { data: config } = useGetPublicConfigQuery()
  const [form, setForm] = useState({ unitNumber: "", bhk: "", areaSqft: "", priceRupees: "", status: "available" })
  const [createUnit, { isLoading }] = useCreateUnitMutation()
  const [error, setError] = useState<string | null>(null)
  const filled = form.unitNumber.trim() && form.bhk && form.areaSqft && form.priceRupees

  const add = async () => {
    if (isLoading) return
    if (!isValidUnitNumber(form.unitNumber)) return setError(`Unit number: up to ${UNIT_NUMBER_MAX} letters/digits, e.g. A-1203.`)
    if (!form.bhk) return setError("Pick a BHK.")
    if (!isValidArea(form.areaSqft)) return setError(`Area: ${AREA_MIN}–${AREA_MAX.toLocaleString("en-IN")} sq.ft.`)
    if (!isValidPriceRupees(form.priceRupees)) {
      return setError(`Price: ${formatPaise(PRICE_MIN_RUPEES * 100)} – ${formatPaise(PRICE_MAX_RUPEES * 100)}.`)
    }
    setError(null)
    try {
      await createUnit({
        towerId,
        projectId,
        unitNumber: form.unitNumber.trim().toUpperCase(),
        bhk: Number(form.bhk),
        areaSqft: Number(form.areaSqft),
        pricePaise: rupeesDigitsToPaise(form.priceRupees),
        status: form.status,
      }).unwrap()
      // Keep BHK/area/price for quick entry of similar units.
      setForm({ unitNumber: "", bhk: form.bhk, areaSqft: form.areaSqft, priceRupees: form.priceRupees, status: "available" })
    } catch (err) {
      // unitNumber is unique per tower.
      setError(getApiErrorCode(err) === "CONFLICT" ? "That unit number already exists in this tower." : getApiErrorMessage(err) ?? "Couldn't add the unit.")
    }
  }

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setError(null)
  }

  return (
    <div className="border-t border-brand-border px-4 py-3">
      <div className="flex flex-wrap gap-2">
        <label htmlFor={`${ids}-unit`} className="sr-only">Unit number</label>
        <input id={`${ids}-unit`} value={form.unitNumber} onChange={(e) => update("unitNumber", e.target.value)} maxLength={UNIT_NUMBER_MAX} placeholder="Unit no." className={`${inputClass} max-w-[7rem]`} />
        <label htmlFor={`${ids}-bhk`} className="sr-only">BHK</label>
        <select id={`${ids}-bhk`} value={form.bhk} onChange={(e) => update("bhk", e.target.value)} className={`${inputClass} max-w-[7rem]`}>
          <option value="" disabled>BHK</option>
          {(config?.allowedBhkValues ?? []).map((b) => <option key={b} value={b}>{b} BHK</option>)}
        </select>
        <label htmlFor={`${ids}-area`} className="sr-only">Area in sq.ft</label>
        <input id={`${ids}-area`} value={form.areaSqft} onChange={(e) => update("areaSqft", digitsOnly(e.target.value, 8))} placeholder="Area sq.ft" inputMode="numeric" className={`${inputClass} max-w-[8rem]`} />
        <label htmlFor={`${ids}-price`} className="sr-only">Price in rupees</label>
        <input id={`${ids}-price`} value={form.priceRupees} onChange={(e) => update("priceRupees", digitsOnly(e.target.value, 11))} placeholder="Price ₹" inputMode="numeric" className={`${inputClass} max-w-[9rem]`} />
        <label htmlFor={`${ids}-status`} className="sr-only">Status</label>
        <select id={`${ids}-status`} value={form.status} onChange={(e) => update("status", e.target.value)} className={`${inputClass} max-w-[8rem]`}>
          {UNIT_STATUSES.map((s) => <option key={s} value={s}>{UNIT_STATUS_LABEL[s]}</option>)}
        </select>
        <button
          onClick={add}
          disabled={!filled || isLoading}
          className="flex items-center gap-1.5 border border-brand-border px-3 py-2 text-xs font-bold text-brand-secondary hover:bg-brand-surface disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> {isLoading ? "Adding…" : "Add unit"}
        </button>
      </div>
      {Number(form.priceRupees) > 0 && !error && (
        <p className="mt-1 text-[11px] text-brand-muted-foreground">{formatPaise(rupeesDigitsToPaise(form.priceRupees))}</p>
      )}
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  )
}
