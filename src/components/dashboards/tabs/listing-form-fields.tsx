"use client"

import { useState } from "react"
import {
  Bath, Bed, Building2, Calendar, Car, Check, CheckCircle2, Compass, Eye,
  FileCheck2, Home, Image as ImageIcon, Layers3, MapPin, Maximize2, Plus,
  ShieldCheck, Sofa, Sparkles, Users, X, Zap, type LucideIcon,
} from "lucide-react"
import { CITIES, AMENITIES_MASTER } from "@/lib/vxp-data"
import type { Listing } from "@/lib/dashboard-data"
import type { ListingInput } from "@/lib/listings-store"

export const LISTING_TYPES: Listing["type"][] = ["Apartment", "Villa", "Penthouse", "Commercial", "Plot"]
export const LISTING_STATUSES: Listing["status"][] = ["Ready to Move", "Under Construction"]
export const LISTING_PURPOSES: ListingInput["purpose"][] = ["Sale", "Rent"]
export const LISTING_FURNISHINGS: ListingInput["furnishing"][] = ["Furnished", "Semi-Furnished", "Unfurnished"]
export const LISTING_TRANSACTION_TYPES: ListingInput["transactionType"][] = ["New", "Resale"]
export const LISTING_OWNERSHIP_TYPES = ["Freehold", "Leasehold", "Co-operative Society", "Power of Attorney"]
export const LISTING_POWER_BACKUP: ListingInput["powerBackup"][] = ["Full", "Partial", "None"]

/** Floor number/total floors don't apply to these types — matches the same
 *  exception the public property page's own transparency block makes. */
const FLOOR_APPLICABLE_TYPES: Listing["type"][] = ["Apartment", "Penthouse"]

export const LISTING_IMAGE_CHOICES = [
  "/images/prop-penthouse-marina.png",
  "/images/prop-villa-palm.png",
  "/images/prop-penthouse-bizbay.png",
  "/images/prop-apt-downtown.png",
  "/images/prop-apt-jbr.png",
  "/images/prop-villa-emirates.png",
]

export const emptyListingForm = (): ListingInput => ({
  title: "",
  city: CITIES[0] ?? "Mumbai",
  location: "",
  type: "Apartment",
  status: "Ready to Move",
  purpose: "Sale",
  priceCr: 1,
  areaSqft: 1000,
  beds: 2,
  baths: 2,
  developer: "",
  furnishing: "Unfurnished",
  facing: "",
  transactionType: "New",
  reraRegistered: false,
  amenities: [],
  image: LISTING_IMAGE_CHOICES[0],
  galleryImages: [],
  carpetAreaSqft: 700,
  balconies: 1,
  hasPoojaRoom: false,
  overlooking: "",
  possession: "",
  ownership: LISTING_OWNERSHIP_TYPES[0],
  flooring: "",
  widthOfFacingRoad: "",
  parking: "",
  powerBackup: "None",
  keyHighlights: [],
})

export function listingToFormInput(listing: Listing): ListingInput {
  const priceCr = Number(listing.price.replace(/[^\d.]/g, "")) || 1
  const areaSqft = Number(listing.area.replace(/[^\d]/g, "")) || 1000
  return {
    title: listing.title,
    city: listing.city,
    location: listing.location,
    type: listing.type,
    status: listing.status,
    purpose: listing.purpose ?? "Sale",
    priceCr,
    areaSqft,
    beds: listing.beds,
    baths: listing.baths,
    developer: listing.developer ?? "",
    furnishing: listing.furnishing ?? "Unfurnished",
    facing: listing.facing ?? "",
    transactionType: listing.transactionType ?? "New",
    reraRegistered: listing.reraRegistered ?? false,
    reraNumber: listing.reraNumber,
    reraUrl: listing.reraUrl,
    amenities: listing.amenities ?? [],
    image: listing.image,
    galleryImages: (listing.galleryImages ?? []).filter((img) => img !== listing.image),
    carpetAreaSqft: listing.carpetAreaSqft ?? Math.round(areaSqft * 0.7),
    balconies: listing.balconies ?? 1,
    hasPoojaRoom: listing.hasPoojaRoom ?? false,
    floorNumber: listing.floorNumber,
    totalFloors: listing.totalFloors,
    overlooking: listing.overlooking ?? "",
    possession: listing.possession ?? "",
    ownership: listing.ownership ?? LISTING_OWNERSHIP_TYPES[0],
    flooring: listing.flooring ?? "",
    widthOfFacingRoad: listing.widthOfFacingRoad ?? "",
    parking: listing.parking ?? "",
    powerBackup: listing.powerBackup ?? "None",
    keyHighlights: listing.keyHighlights ?? [],
  }
}

export function isListingFormValid(form: ListingInput) {
  return (
    form.title.trim().length > 2 &&
    form.location.trim().length > 1 &&
    form.priceCr > 0 &&
    form.areaSqft > 0 &&
    form.carpetAreaSqft > 0 &&
    form.carpetAreaSqft <= form.areaSqft
  )
}

type ListingFormFieldsProps = {
  form: ListingInput
  setForm: (form: ListingInput) => void
}

/** Icon prefix matches the exact icon the public property page uses for this
 *  same field (Quick specs / Area & configuration / Property details dls) —
 *  so filling the form visually rehearses what buyers will actually see. */
function FieldLabel({ children, icon: Icon }: { children: React.ReactNode; icon?: LucideIcon }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/50">
      {Icon && <Icon className="h-3 w-3 shrink-0 text-brand-primary-dark" />}
      {children}
    </label>
  )
}

/** Same gold-badge-circle treatment as the "Key highlights" checkmarks on the
 *  public property page — reused here so each section reads as a preview of
 *  the section it will populate on that page. */
function SectionHeading({ children, icon: Icon, first = false }: { children: React.ReactNode; icon: LucideIcon; first?: boolean }) {
  return (
    <h3 className={"flex items-center gap-2.5" + (first ? "" : " border-t border-brand-border pt-5")}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-primary/15">
        <Icon className="h-3.5 w-3.5 text-brand-primary-dark" />
      </span>
      <span className="font-serif text-base font-bold text-brand-secondary">{children}</span>
    </h3>
  )
}

const inputClass = "mt-1.5 w-full border border-brand-border bg-card px-3 py-2 text-sm text-brand-secondary outline-none transition-colors focus:border-brand-primary"

/** Shared field set for both the "Add listing" page and the full-page listing
 *  editor — every field the public property page actually renders (Quick
 *  specs, Area & configuration, Property details, Key highlights, Amenities)
 *  is collectable here, so a self-added listing never shows up on its own
 *  detail page with blanks the seller was never asked to fill in. */
export function ListingFormFields({ form, setForm }: ListingFormFieldsProps) {
  const [highlightDraft, setHighlightDraft] = useState("")
  const floorApplicable = FLOOR_APPLICABLE_TYPES.includes(form.type)

  const addHighlight = () => {
    const value = highlightDraft.trim()
    if (!value || form.keyHighlights.includes(value)) return
    setForm({ ...form, keyHighlights: [...form.keyHighlights, value] })
    setHighlightDraft("")
  }

  return (
    <div className="space-y-4">
      <SectionHeading icon={Home} first>Basics</SectionHeading>

      <div>
        <FieldLabel>Title</FieldLabel>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Lodha Bellevue — 4 BHK Sky Residence"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={MapPin}>City</FieldLabel>
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={inputClass}
          >
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Locality</FieldLabel>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Worli"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={Building2}>Type</FieldLabel>
          <select
            value={form.type}
            onChange={(e) => {
              const type = e.target.value as Listing["type"]
              const stillApplicable = FLOOR_APPLICABLE_TYPES.includes(type)
              setForm({
                ...form,
                type,
                floorNumber: stillApplicable ? form.floorNumber : undefined,
                totalFloors: stillApplicable ? form.totalFloors : undefined,
              })
            }}
            className={inputClass}
          >
            {LISTING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Status</FieldLabel>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Listing["status"] })}
            className={inputClass}
          >
            {LISTING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Purpose</FieldLabel>
          <select
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value as ListingInput["purpose"] })}
            className={inputClass}
          >
            {LISTING_PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel icon={FileCheck2}>Transaction type</FieldLabel>
          <select
            value={form.transactionType}
            onChange={(e) => setForm({ ...form, transactionType: e.target.value as ListingInput["transactionType"] })}
            className={inputClass}
          >
            {LISTING_TRANSACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Price (₹ Cr)</FieldLabel>
          <input
            type="number"
            min={0.1}
            step={0.05}
            value={form.priceCr}
            onChange={(e) => setForm({ ...form, priceCr: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel>Developer / builder (optional)</FieldLabel>
          <input
            value={form.developer}
            onChange={(e) => setForm({ ...form, developer: e.target.value })}
            placeholder="Leave blank for an individual/resale listing"
            className={inputClass}
          />
        </div>
      </div>

      <SectionHeading icon={Users}>Configuration</SectionHeading>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={Bed}>Bedrooms</FieldLabel>
          <input
            type="number"
            min={1}
            max={8}
            value={form.beds}
            onChange={(e) => setForm({ ...form, beds: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel icon={Bath}>Bathrooms</FieldLabel>
          <input
            type="number"
            min={1}
            max={8}
            value={form.baths}
            onChange={(e) => setForm({ ...form, baths: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={Users}>Balconies</FieldLabel>
          <input
            type="number"
            min={0}
            max={8}
            value={form.balconies}
            onChange={(e) => setForm({ ...form, balconies: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel>Pooja room</FieldLabel>
          <label className="mt-1.5 flex h-[38px] cursor-pointer items-center gap-2 border border-brand-border bg-card px-3 text-sm text-brand-secondary transition-colors hover:border-brand-primary/50">
            <input
              type="checkbox"
              checked={form.hasPoojaRoom}
              onChange={(e) => setForm({ ...form, hasPoojaRoom: e.target.checked })}
              className="h-4 w-4 accent-brand-primary-dark"
            />
            Has a pooja room
          </label>
        </div>
      </div>

      {floorApplicable && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel icon={Layers3}>Floor number (optional)</FieldLabel>
            <input
              type="number"
              min={0}
              value={form.floorNumber ?? ""}
              onChange={(e) => setForm({ ...form, floorNumber: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g. 12"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel icon={Layers3}>Total floors (optional)</FieldLabel>
            <input
              type="number"
              min={0}
              value={form.totalFloors ?? ""}
              onChange={(e) => setForm({ ...form, totalFloors: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="e.g. 24"
              className={inputClass}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={Sofa}>Furnishing</FieldLabel>
          <select
            value={form.furnishing}
            onChange={(e) => setForm({ ...form, furnishing: e.target.value as ListingInput["furnishing"] })}
            className={inputClass}
          >
            {LISTING_FURNISHINGS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel icon={Compass}>Facing (optional)</FieldLabel>
          <input
            value={form.facing}
            onChange={(e) => setForm({ ...form, facing: e.target.value })}
            placeholder="e.g. North East"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={Eye}>Overlooking (optional)</FieldLabel>
          <input
            value={form.overlooking}
            onChange={(e) => setForm({ ...form, overlooking: e.target.value })}
            placeholder="e.g. Garden, Sea, Park"
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel icon={Calendar}>Possession (optional)</FieldLabel>
          <input
            value={form.possession}
            onChange={(e) => setForm({ ...form, possession: e.target.value })}
            placeholder="e.g. Ready to move, or Dec 2027"
            className={inputClass}
          />
        </div>
      </div>

      <SectionHeading icon={Maximize2}>Area</SectionHeading>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={Maximize2}>Super built-up area (sq.ft)</FieldLabel>
          <input
            type="number"
            min={100}
            step={10}
            value={form.areaSqft}
            onChange={(e) => setForm({ ...form, areaSqft: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel icon={Home}>Carpet area (sq.ft)</FieldLabel>
          <input
            type="number"
            min={50}
            step={10}
            value={form.carpetAreaSqft}
            onChange={(e) => setForm({ ...form, carpetAreaSqft: Number(e.target.value) })}
            className={inputClass}
          />
          {form.carpetAreaSqft > form.areaSqft && (
            <p className="mt-1 text-[11px] text-red-600">Carpet area can&apos;t exceed super built-up area.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={Compass}>Width of facing road (optional)</FieldLabel>
          <input
            value={form.widthOfFacingRoad}
            onChange={(e) => setForm({ ...form, widthOfFacingRoad: e.target.value })}
            placeholder="e.g. 40 Feet"
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel icon={Car}>Parking (optional)</FieldLabel>
          <input
            value={form.parking}
            onChange={(e) => setForm({ ...form, parking: e.target.value })}
            placeholder="e.g. 2 Covered"
            className={inputClass}
          />
        </div>
      </div>

      <SectionHeading icon={ShieldCheck}>Legal &amp; ownership</SectionHeading>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={ShieldCheck}>Ownership</FieldLabel>
          <select
            value={form.ownership}
            onChange={(e) => setForm({ ...form, ownership: e.target.value })}
            className={inputClass}
          >
            {LISTING_OWNERSHIP_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel icon={Layers3}>Flooring (optional)</FieldLabel>
          <input
            value={form.flooring}
            onChange={(e) => setForm({ ...form, flooring: e.target.value })}
            placeholder="e.g. Marble, Vitrified Tiles"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel icon={Zap}>Power backup</FieldLabel>
          <select
            value={form.powerBackup}
            onChange={(e) => setForm({ ...form, powerBackup: e.target.value as ListingInput["powerBackup"] })}
            className={inputClass}
          >
            {LISTING_POWER_BACKUP.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel icon={FileCheck2}>RERA</FieldLabel>
          <label className="mt-1.5 flex h-[38px] cursor-pointer items-center gap-2 border border-brand-border bg-card px-3 text-sm text-brand-secondary transition-colors hover:border-brand-primary/50">
            <input
              type="checkbox"
              checked={form.reraRegistered}
              onChange={(e) =>
                setForm({
                  ...form,
                  reraRegistered: e.target.checked,
                  reraNumber: e.target.checked ? form.reraNumber : undefined,
                  reraUrl: e.target.checked ? form.reraUrl : undefined,
                })
              }
              className="h-4 w-4 accent-brand-primary-dark"
            />
            RERA registered
          </label>
        </div>
      </div>

      {form.reraRegistered && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>RERA number</FieldLabel>
            <input
              value={form.reraNumber ?? ""}
              onChange={(e) => setForm({ ...form, reraNumber: e.target.value })}
              placeholder="This listing's RERA registration number"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>RERA verification link (optional)</FieldLabel>
            <input
              value={form.reraUrl ?? ""}
              onChange={(e) => setForm({ ...form, reraUrl: e.target.value })}
              placeholder="Link to the state RERA record"
              className={inputClass}
            />
          </div>
        </div>
      )}

      <SectionHeading icon={Sparkles}>Key highlights</SectionHeading>
      <div>
        <p className="text-xs text-brand-secondary/55">Short callouts shown in their own section on the property page — e.g. &quot;Sea-facing residence&quot;.</p>
        <div className="mt-1.5 flex gap-2">
          <input
            value={highlightDraft}
            onChange={(e) => setHighlightDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addHighlight()
              }
            }}
            placeholder="Type a highlight and press Enter"
            className={inputClass + " mt-0"}
          />
          <button
            type="button"
            onClick={addHighlight}
            className="mt-0 flex shrink-0 items-center gap-1 border border-brand-primary/40 bg-card px-3 py-2 text-xs font-bold text-brand-primary-dark transition-colors hover:bg-brand-primary/10"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {form.keyHighlights.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {form.keyHighlights.map((h) => (
              <span
                key={h}
                className="flex items-center gap-1.5 bg-ink-black px-2.5 py-1.5 text-[11px] font-bold text-brand-primary"
              >
                {h}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, keyHighlights: form.keyHighlights.filter((x) => x !== h) })}
                  aria-label={`Remove ${h}`}
                  className="text-brand-primary/70 hover:text-brand-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <SectionHeading icon={CheckCircle2}>Amenities</SectionHeading>
      <div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {AMENITIES_MASTER.map((a) => {
            const active = form.amenities.includes(a)
            return (
              <button
                key={a}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    amenities: active ? form.amenities.filter((x) => x !== a) : [...form.amenities, a],
                  })
                }
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
      </div>

      <SectionHeading icon={ImageIcon}>Photos</SectionHeading>

      <div>
        <FieldLabel icon={ImageIcon}>Cover photo</FieldLabel>
        <div className="mt-1.5 grid grid-cols-6 gap-2">
          {LISTING_IMAGE_CHOICES.map((img) => (
            <button
              key={img}
              type="button"
              onClick={() => setForm({ ...form, image: img })}
              className={
                "relative aspect-square overflow-hidden ring-2 transition-all " +
                (form.image === img ? "ring-brand-primary" : "ring-transparent hover:ring-brand-border")
              }
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
              {form.image === img && (
                <span className="absolute inset-0 flex items-center justify-center bg-brand-secondary/40">
                  <Check className="h-4 w-4 text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Additional photos (optional)</FieldLabel>
        <p className="mt-1 text-xs text-brand-secondary/55">Pick any others buyers should see, beyond the cover photo.</p>
        <div className="mt-1.5 grid grid-cols-6 gap-2">
          {LISTING_IMAGE_CHOICES.filter((img) => img !== form.image).map((img) => {
            const active = form.galleryImages.includes(img)
            return (
              <button
                key={img}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    galleryImages: active ? form.galleryImages.filter((x) => x !== img) : [...form.galleryImages, img],
                  })
                }
                className={
                  "relative aspect-square overflow-hidden ring-2 transition-all " +
                  (active ? "ring-brand-primary" : "ring-transparent hover:ring-brand-border")
                }
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
                {active && (
                  <span className="absolute inset-0 flex items-center justify-center bg-brand-secondary/40">
                    <Check className="h-4 w-4 text-white" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
