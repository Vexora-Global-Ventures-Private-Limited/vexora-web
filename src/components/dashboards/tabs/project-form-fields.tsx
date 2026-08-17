"use client"

import { Check, Plus, Trash2 } from "lucide-react"
import { CITIES, AMENITIES_MASTER } from "@/lib/vxp-data"
import { PROJECT_STATUSES, type Project, type ProjectGalleryCategory } from "@/lib/projects-data"
import type { ProjectInput } from "@/lib/projects-store"

const GALLERY_CATEGORIES: ProjectGalleryCategory[] = ["Aerial / Master Plan", "Elevation", "Amenities"]

export const PROJECT_IMAGE_CHOICES = [
  "/images/prop-penthouse-marina.png",
  "/images/prop-villa-palm.png",
  "/images/prop-penthouse-bizbay.png",
  "/images/prop-apt-downtown.png",
  "/images/prop-apt-jbr.png",
  "/images/prop-villa-emirates.png",
]

export const emptyProjectForm = (): ProjectInput => ({
  name: "",
  developer: "",
  location: "",
  city: CITIES[0] ?? "Mumbai",
  status: "New Launch",
  possessionDate: "",
  zeroBrokerage: false,
  configurations: [],
  reraRegistrations: [],
  highlights: [],
  amenities: [],
  coverImage: PROJECT_IMAGE_CHOICES[0],
  gallery: [],
  contacts: [],
  description: "",
})

export function projectToFormInput(project: Project): ProjectInput {
  return {
    name: project.name,
    developer: project.developer,
    location: project.location,
    city: project.city,
    status: project.status,
    possessionDate: project.possessionDate,
    zeroBrokerage: !!project.zeroBrokerage,
    configurations: project.configurations,
    reraRegistrations: project.reraRegistrations,
    highlights: project.highlights,
    amenities: project.amenities,
    coverImage: project.coverImage,
    gallery: project.gallery,
    contacts: project.contacts,
    description: project.description,
    brochureUrl: project.brochureUrl,
  }
}

export function isProjectFormValid(form: ProjectInput) {
  return (
    form.name.trim().length > 2 &&
    form.developer.trim().length > 1 &&
    form.location.trim().length > 1 &&
    form.possessionDate.trim().length > 0 &&
    form.configurations.length > 0 &&
    form.configurations.every((c) => c.type.trim().length > 0 && c.areaSqft > 0 && c.priceCr > 0) &&
    form.contacts.length > 0 &&
    form.contacts.every((c) => c.name.trim().length > 0 && c.phone.trim().length > 0)
  )
}

let rowIdCounter = 0
function nextRowId(prefix: string) {
  rowIdCounter += 1
  return `${prefix}-${Date.now()}-${rowIdCounter}`
}

/** Derived, never typed directly — same "computed, not invented" idiom as projectPriceRangeCr. */
function configPricePerSqft(priceCr: number, areaSqft: number): string | undefined {
  if (areaSqft <= 0) return undefined
  const perSqft = Math.round((priceCr * 1e7) / areaSqft)
  return `₹ ${perSqft.toLocaleString("en-IN")}/sq.ft`
}

type ProjectFormFieldsProps = {
  form: ProjectInput
  setForm: (form: ProjectInput) => void
}

const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50"
const inputClass = "mt-1.5 w-full border border-brand-border bg-card px-3 py-2 text-sm outline-none focus:border-brand-primary"

/** Shared field set for both the project creation page and the project editor. */
export function ProjectFormFields({ form, setForm }: ProjectFormFieldsProps) {
  const update = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => setForm({ ...form, [key]: value })

  return (
    <div className="space-y-8">
      {/* Basics */}
      <section className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-brand-secondary">Project basics</h3>
        <div>
          <label className={labelClass}>Project name</label>
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Lodha Elite Towers"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Developer / builder</label>
            <input
              value={form.developer}
              onChange={(e) => update("developer", e.target.value)}
              placeholder="e.g. Lodha Group"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <select value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass}>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="e.g. Thane West, Thane"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Construction status</label>
            <select value={form.status} onChange={(e) => update("status", e.target.value as ProjectInput["status"])} className={inputClass}>
              {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Possession date</label>
            <input
              value={form.possessionDate}
              onChange={(e) => update("possessionDate", e.target.value)}
              placeholder="e.g. Dec 2028 or Immediate"
              className={inputClass}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-brand-secondary">
          <input
            type="checkbox"
            checked={form.zeroBrokerage}
            onChange={(e) => update("zeroBrokerage", e.target.checked)}
            className="h-4 w-4 accent-brand-primary-dark"
          />
          Zero brokerage — direct developer listing
        </label>
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="A short overview buyers will see on the project page."
            className={inputClass + " resize-none"}
          />
        </div>
        <div>
          <label className={labelClass}>Brochure URL (optional)</label>
          <input
            value={form.brochureUrl ?? ""}
            onChange={(e) => update("brochureUrl", e.target.value || undefined)}
            placeholder="Link to a downloadable PDF brochure"
            className={inputClass}
          />
        </div>
      </section>

      {/* Configurations */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Unit configurations</h3>
          <button
            type="button"
            onClick={() =>
              update("configurations", [
                ...form.configurations,
                {
                  id: nextRowId("CFG"), type: "", areaSqft: 1000, area: "1,000 sq.ft", priceCr: 1, price: "₹ 1 Cr",
                  pricePerSqft: configPricePerSqft(1, 1000), available: true,
                },
              ])
            }
            className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> Add configuration
          </button>
        </div>
        <p className="mt-1 text-xs text-brand-secondary/55">
          Every configuration is priced and shown separately — a project must have at least one.
        </p>
        <div className="mt-3 space-y-3">
          {form.configurations.map((cfg, i) => (
            <div key={cfg.id} className="border border-brand-border bg-brand-tertiary/30 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <input
                    value={cfg.type}
                    onChange={(e) => {
                      const next = [...form.configurations]
                      next[i] = { ...cfg, type: e.target.value }
                      update("configurations", next)
                    }}
                    placeholder="e.g. 3 BHK"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Area (sq.ft)</label>
                  <input
                    type="number"
                    min={100}
                    value={cfg.areaSqft}
                    onChange={(e) => {
                      const areaSqft = Number(e.target.value)
                      const next = [...form.configurations]
                      next[i] = {
                        ...cfg,
                        areaSqft,
                        area: `${areaSqft.toLocaleString("en-IN")} sq.ft`,
                        pricePerSqft: configPricePerSqft(cfg.priceCr, areaSqft),
                      }
                      update("configurations", next)
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Price (₹ Cr)</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.05}
                    value={cfg.priceCr}
                    onChange={(e) => {
                      const priceCr = Number(e.target.value)
                      const next = [...form.configurations]
                      next[i] = {
                        ...cfg,
                        priceCr,
                        price: `₹ ${priceCr} Cr`,
                        pricePerSqft: configPricePerSqft(priceCr, cfg.areaSqft),
                      }
                      update("configurations", next)
                    }}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <label className="flex items-center gap-1.5 pb-2.5 text-xs font-semibold text-brand-secondary">
                    <input
                      type="checkbox"
                      checked={cfg.available}
                      onChange={(e) => {
                        const next = [...form.configurations]
                        next[i] = { ...cfg, available: e.target.checked }
                        update("configurations", next)
                      }}
                      className="h-3.5 w-3.5 accent-brand-primary-dark"
                    />
                    Available
                  </label>
                  <button
                    type="button"
                    onClick={() => update("configurations", form.configurations.filter((c) => c.id !== cfg.id))}
                    className="mb-2.5 grid h-7 w-7 shrink-0 place-items-center border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RERA registrations */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">RERA registrations</h3>
          <button
            type="button"
            onClick={() => update("reraRegistrations", [...form.reraRegistrations, { id: nextRowId("RERA"), label: "", number: "", url: "" }])}
            className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> Add registration
          </button>
        </div>
        <p className="mt-1 text-xs text-brand-secondary/55">
          One row per phase or tower. Leave empty if registration is still in progress — this is shown honestly, not hidden.
        </p>
        <div className="mt-3 space-y-3">
          {form.reraRegistrations.map((r, i) => (
            <div key={r.id} className="grid grid-cols-1 gap-2 border border-brand-border bg-brand-tertiary/30 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <input
                value={r.label}
                onChange={(e) => {
                  const next = [...form.reraRegistrations]
                  next[i] = { ...r, label: e.target.value }
                  update("reraRegistrations", next)
                }}
                placeholder="Label — e.g. Tower A"
                className={inputClass + " mt-0"}
              />
              <input
                value={r.number}
                onChange={(e) => {
                  const next = [...form.reraRegistrations]
                  next[i] = { ...r, number: e.target.value }
                  update("reraRegistrations", next)
                }}
                placeholder="RERA number"
                className={inputClass + " mt-0"}
              />
              <input
                value={r.url ?? ""}
                onChange={(e) => {
                  const next = [...form.reraRegistrations]
                  next[i] = { ...r, url: e.target.value }
                  update("reraRegistrations", next)
                }}
                placeholder="State RERA verify URL (optional)"
                className={inputClass + " mt-0"}
              />
              <button
                type="button"
                onClick={() => update("reraRegistrations", form.reraRegistrations.filter((x) => x.id !== r.id))}
                className="grid h-9 w-9 shrink-0 place-items-center border border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Contacts */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Authorized contacts</h3>
          <button
            type="button"
            onClick={() =>
              update("contacts", [
                ...form.contacts,
                { id: nextRowId("CT"), name: "", role: "Authorized Broker", reraRegistered: false, phone: "", isPrimary: form.contacts.length === 0 },
              ])
            }
            className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> Add contact
          </button>
        </div>
        <p className="mt-1 text-xs text-brand-secondary/55">
          The builder and every authorized broker who can be reached about this project — at least one is required.
        </p>
        <div className="mt-3 space-y-3">
          {form.contacts.map((c, i) => (
            <div key={c.id} className="border border-brand-border bg-brand-tertiary/30 p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div>
                  <label className={labelClass}>Name</label>
                  <input
                    value={c.name}
                    onChange={(e) => {
                      const next = [...form.contacts]
                      next[i] = { ...c, name: e.target.value }
                      update("contacts", next)
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Role</label>
                  <select
                    value={c.role}
                    onChange={(e) => {
                      const next = [...form.contacts]
                      next[i] = { ...c, role: e.target.value as ProjectInput["contacts"][number]["role"] }
                      update("contacts", next)
                    }}
                    className={inputClass}
                  >
                    <option value="Builder">Builder</option>
                    <option value="Authorized Broker">Authorized Broker</option>
                    <option value="Channel Partner Advisor">Channel Partner Advisor</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Company (optional)</label>
                  <input
                    value={c.company ?? ""}
                    onChange={(e) => {
                      const next = [...form.contacts]
                      next[i] = { ...c, company: e.target.value || undefined }
                      update("contacts", next)
                    }}
                    placeholder="e.g. Square Yards"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    value={c.phone}
                    onChange={(e) => {
                      const next = [...form.contacts]
                      next[i] = { ...c, phone: e.target.value }
                      update("contacts", next)
                    }}
                    placeholder="+91 98XXX XXXXX"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-secondary">
                    <input
                      type="radio"
                      name="primary-contact"
                      checked={!!c.isPrimary}
                      onChange={() => update("contacts", form.contacts.map((x) => ({ ...x, isPrimary: x.id === c.id })))}
                      className="h-3.5 w-3.5 accent-brand-primary-dark"
                    />
                    Primary contact
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-brand-secondary">
                    <input
                      type="checkbox"
                      checked={c.reraRegistered}
                      onChange={(e) => {
                        const next = [...form.contacts]
                        next[i] = { ...c, reraRegistered: e.target.checked, reraNumber: e.target.checked ? c.reraNumber : undefined }
                        update("contacts", next)
                      }}
                      className="h-3.5 w-3.5 accent-brand-primary-dark"
                    />
                    RERA registered
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => update("contacts", form.contacts.filter((x) => x.id !== c.id))}
                  className="grid h-7 w-7 shrink-0 place-items-center border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {c.reraRegistered && (
                <input
                  value={c.reraNumber ?? ""}
                  onChange={(e) => {
                    const next = [...form.contacts]
                    next[i] = { ...c, reraNumber: e.target.value }
                    update("contacts", next)
                  }}
                  placeholder="This contact's RERA number"
                  className={inputClass}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Key highlights</h3>
          <button
            type="button"
            onClick={() => update("highlights", [...form.highlights, { label: "", detail: "" }])}
            className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> Add highlight
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {form.highlights.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={h.label}
                onChange={(e) => {
                  const next = [...form.highlights]
                  next[i] = { ...h, label: e.target.value }
                  update("highlights", next)
                }}
                placeholder="e.g. 25-acre development"
                className={inputClass + " mt-0"}
              />
              <input
                value={h.detail ?? ""}
                onChange={(e) => {
                  const next = [...form.highlights]
                  next[i] = { ...h, detail: e.target.value }
                  update("highlights", next)
                }}
                placeholder="Detail (optional)"
                className={inputClass + " mt-0"}
              />
              <button
                type="button"
                onClick={() => update("highlights", form.highlights.filter((_, idx) => idx !== i))}
                className="grid h-9 w-9 shrink-0 place-items-center border border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Amenities */}
      <section>
        <h3 className="font-serif text-lg font-bold text-brand-secondary">Amenities</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AMENITIES_MASTER.map((a) => {
            const active = form.amenities.includes(a)
            return (
              <button
                key={a}
                type="button"
                onClick={() => update("amenities", active ? form.amenities.filter((x) => x !== a) : [...form.amenities, a])}
                className={
                  "px-2.5 py-1.5 text-[11px] font-bold transition-colors " +
                  (active ? "bg-ink-black text-brand-primary" : "border border-brand-border-light bg-card text-brand-secondary/65 hover:bg-brand-surface")
                }
              >
                {a}
              </button>
            )
          })}
        </div>
      </section>

      {/* Cover photo */}
      <section>
        <label className={labelClass}>Cover photo</label>
        <div className="mt-1.5 grid grid-cols-6 gap-2">
          {PROJECT_IMAGE_CHOICES.map((img) => (
            <button
              key={img}
              type="button"
              onClick={() => update("coverImage", img)}
              className={
                "relative aspect-square overflow-hidden ring-2 transition-all " +
                (form.coverImage === img ? "ring-brand-primary" : "ring-transparent hover:ring-brand-border")
              }
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
              {form.coverImage === img && (
                <span className="absolute inset-0 flex items-center justify-center bg-brand-secondary/40">
                  <Check className="h-4 w-4 text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Categorized gallery */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Gallery</h3>
          <button
            type="button"
            onClick={() => update("gallery", [...form.gallery, { src: PROJECT_IMAGE_CHOICES[0], category: "Aerial / Master Plan" }])}
            className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            <Plus className="h-3.5 w-3.5" /> Add photo
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {form.gallery.map((g, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 border border-brand-border bg-brand-tertiary/30 p-3">
              <div className="grid grid-cols-6 gap-1.5">
                {PROJECT_IMAGE_CHOICES.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => {
                      const next = [...form.gallery]
                      next[i] = { ...g, src: img }
                      update("gallery", next)
                    }}
                    className={
                      "relative h-10 w-10 overflow-hidden ring-2 transition-all " +
                      (g.src === img ? "ring-brand-primary" : "ring-transparent hover:ring-brand-border")
                    }
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <select
                value={g.category}
                onChange={(e) => {
                  const next = [...form.gallery]
                  next[i] = { ...g, category: e.target.value as ProjectGalleryCategory }
                  update("gallery", next)
                }}
                className="border border-brand-border bg-card px-2 py-1.5 text-xs outline-none focus:border-brand-primary"
              >
                {GALLERY_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input
                value={g.caption ?? ""}
                onChange={(e) => {
                  const next = [...form.gallery]
                  next[i] = { ...g, caption: e.target.value || undefined }
                  update("gallery", next)
                }}
                placeholder="Caption (optional)"
                className="min-w-0 flex-1 border border-brand-border bg-card px-2 py-1.5 text-xs outline-none focus:border-brand-primary"
              />
              <button
                type="button"
                onClick={() => update("gallery", form.gallery.filter((_, idx) => idx !== i))}
                className="grid h-8 w-8 shrink-0 place-items-center border border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
