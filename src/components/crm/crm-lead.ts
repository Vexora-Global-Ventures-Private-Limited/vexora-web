import type { CrmStage, Lead, LeadChannel, LeadDelivery, MercuryStatus } from "@/store/api/leadsApi"

/**
 * One CRM row, flattened for display. GET /crm/leads enriches each lead with
 * its listing (title + city, always) and — for DELIVERED leads only — the
 * buyer's real name + phone (BR-35: an undelivered lead's buyer is never
 * even queried server-side). The exact enrichment key names aren't in the
 * docs/spec, so every accessor below tries the plausible shapes and falls
 * back to null rather than inventing a buyer.
 */
export type CrmLeadRow = {
  id: string
  listingId: string
  listingTitle: string | null
  listingCity: string | null
  listingSlug: string | null
  buyerName: string | null
  buyerPhone: string | null
  channel: LeadChannel
  delivery: LeadDelivery
  status: MercuryStatus
  stageId: string | null
  message: string | null
  preferredTime: string | null
  createdAt: string
}

type Loose = Record<string, unknown>

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null)
const obj = (v: unknown): Loose | null => (v && typeof v === "object" ? (v as Loose) : null)

export function toCrmLeadRow(lead: Lead): CrmLeadRow {
  const raw = lead as Loose
  const listing = obj(raw.listing) ?? obj(raw.listingId)
  const buyer = obj(raw.buyer) ?? obj(raw.buyerId)
  const buyerProfile = obj(buyer?.profile)
  return {
    id: String(raw._id ?? raw.id ?? ""),
    listingId: str(raw.listingId) ?? str(listing?._id) ?? str(listing?.id) ?? "",
    listingTitle: str(raw.listingTitle) ?? str(listing?.title),
    listingCity: str(raw.listingCity) ?? str(listing?.city),
    listingSlug: str(raw.listingSlug) ?? str(listing?.slug),
    buyerName:
      str(raw.buyerName) ?? str(buyer?.fullName) ?? str(buyer?.name) ?? str(buyerProfile?.fullName),
    buyerPhone: str(raw.buyerMobile) ?? str(raw.buyerPhone) ?? str(buyer?.mobile) ?? str(buyer?.phone),
    channel: lead.channel,
    delivery: lead.delivery,
    status: lead.mercuryStatus ?? "new",
    stageId: str(raw.stageId),
    message: str(lead.message),
    preferredTime: str(lead.preferredTime),
    createdAt: lead.createdAt,
  }
}

export const CHANNEL_LABEL: Record<LeadChannel, string> = {
  whatsapp: "WhatsApp",
  call: "Call",
  callback: "Callback request",
  site_visit: "Site visit",
  enquiry_form: "Enquiry form",
}

export const CHANNELS = Object.keys(CHANNEL_LABEL) as LeadChannel[]

export const MERCURY_STATUS_LABEL: Record<MercuryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  visit_scheduled: "Visit scheduled",
  negotiating: "Negotiating",
  closed: "Closed",
}

export const MERCURY_STATUSES = Object.keys(MERCURY_STATUS_LABEL) as MercuryStatus[]

export const MERCURY_STATUS_TONE: Record<MercuryStatus, "success" | "warning" | "info" | "neutral"> = {
  new: "info",
  contacted: "info",
  visit_scheduled: "warning",
  negotiating: "warning",
  closed: "success",
}

/** Stage tone by position on the board: last ("Lost") red, second-last ("Won") green. */
export function stageTone(stage: CrmStage | undefined, stages: CrmStage[]): "success" | "warning" | "danger" | "info" | "neutral" {
  if (!stage) return "neutral"
  const name = stage.name.toLowerCase()
  if (name === "lost") return "danger"
  if (name === "won" || name === "closed" || name === "booking") return "success"
  const index = stages.findIndex((s) => s._id === stage._id)
  return index <= 1 ? "info" : "warning"
}

/** A lead with no stage yet sits in the board's first column (New). */
export function stageOf(row: CrmLeadRow, stages: CrmStage[]): CrmStage | undefined {
  return stages.find((s) => s._id === row.stageId) ?? stages[0]
}

export function sortStages(stages: CrmStage[]): CrmStage[] {
  return [...stages].sort((a, b) => (Number(a.order ?? 0) || 0) - (Number(b.order ?? 0) || 0))
}

export function listingLabel(row: CrmLeadRow): string {
  if (row.listingTitle) return row.listingCity ? `${row.listingTitle} · ${row.listingCity}` : row.listingTitle
  return `Listing ${row.listingId.slice(-6)}`
}

/** "just now", "12 min ago", "5h ago", "3d ago", else a date. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const minutes = Math.round((Date.now() - then) / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}
