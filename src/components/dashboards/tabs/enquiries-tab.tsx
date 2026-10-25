"use client"

import { useRouter } from "next/navigation"
import { Send, ArrowUpRight, MapPin } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ROUTES } from "@/lib/routes"
import { useContactStore, leadsForAccount, CHANNEL_LABEL, type ApiSentLead } from "@/lib/contact-store"
import { useNav } from "@/lib/nav-store"
import { useGetLeadQuery, type MercuryStatus } from "@/store/api/leadsApi"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { StatusPill } from "@/components/dashboard/status-pill"

/**
 * Buyer-facing label for where the seller has taken this lead. Deliberately
 * never reflects delivered/undelivered (BR-25): an undelivered lead simply
 * stays "new" and reads "Sent", exactly like a delivered one the seller
 * hasn't touched yet.
 */
const STATUS_LABEL: Record<MercuryStatus, { label: string; tone: "info" | "success" | "warning" | "neutral" }> = {
  new: { label: "Sent", tone: "info" },
  contacted: { label: "Owner responded", tone: "success" },
  visit_scheduled: { label: "Visit scheduled", tone: "success" },
  negotiating: { label: "In discussion", tone: "warning" },
  closed: { label: "Closed", tone: "neutral" },
}

/**
 * Re-reads one lead (GET /leads/:id — either side of a lead may call it) for
 * its current status. Only Mercury sellers move `mercuryStatus`; Jupiter/
 * Venus sellers move a CRM stage the buyer can't read meaningfully, so their
 * leads stay "Sent" here — the API has no buyer-facing status for those.
 */
function LeadStatus({ leadId, className }: { leadId: string; className?: string }) {
  const { data, isError } = useGetLeadQuery(leadId)
  if (isError) {
    return (
      <StatusPill tone="neutral" className={className}>
        Unavailable
      </StatusPill>
    )
  }
  const status = STATUS_LABEL[data?.lead.mercuryStatus ?? "new"] ?? STATUS_LABEL.new
  return (
    <StatusPill tone={status.tone} className={className}>
      {status.label}
    </StatusPill>
  )
}

const sentAgo = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true })

/**
 * Every lead this buyer created via POST /leads on this device. The backend
 * has no "my sent enquiries" list yet (GET /users/me/enquiries is a stub
 * that always returns []), so the list itself is kept client-side.
 */
export function EnquiriesTab() {
  const router = useRouter()
  const accountId = useNav((s) => s.user?.id)
  const allLeads = useContactStore((s) => s.apiLeads)
  const enquiries = leadsForAccount(allLeads, accountId)

  const columns: DataTableColumn<ApiSentLead>[] = [
    {
      key: "property",
      header: "Property",
      render: (l) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-brand-secondary">{l.title}</div>
          <div className="truncate text-[11px] text-brand-secondary/55">{l.location}</div>
        </div>
      ),
    },
    {
      key: "channel",
      header: "How you reached out",
      render: (l) => <span className="text-brand-secondary/70">{CHANNEL_LABEL[l.channel]}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (l) => <LeadStatus leadId={l.leadId} />,
    },
    {
      key: "createdAt",
      header: "Sent",
      render: (l) => <span className="text-brand-secondary/55">{sentAgo(l.createdAt)}</span>,
    },
    {
      key: "view",
      header: "",
      render: (l) => (
        <button
          onClick={() => router.push(ROUTES.propertyDetail(l.slug))}
          className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
        >
          View <ArrowUpRight className="h-3 w-3" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-secondary">Enquiries</h2>
          <p className="text-sm text-brand-muted-foreground">Every contact request you&apos;ve sent from this device</p>
        </div>
        <button
          onClick={() => router.push(ROUTES.properties)}
          className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
        >
          Browse listings <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {enquiries.length === 0 ? (
        <div className="border border-brand-border bg-card p-8 text-center text-sm text-brand-muted-foreground">
          No enquiries yet — contact an owner from any property page to get started.
        </div>
      ) : (
        <>
          {/* Cards on small screens — a wide table forces horizontal scrolling that's
              awkward to drive with a thumb, so mobile gets a stacked layout instead. */}
          <div className="space-y-3 sm:hidden">
            {enquiries.map((l) => (
              <button
                key={l.leadId}
                onClick={() => router.push(ROUTES.propertyDetail(l.slug))}
                className="block w-full border border-brand-border bg-card p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-brand-secondary">{l.title}</div>
                    <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-brand-secondary/55">
                      <MapPin className="h-3 w-3 shrink-0 text-brand-primary-dark" /> {l.location}
                    </div>
                    <div className="mt-1.5 text-xs text-brand-secondary/65">{CHANNEL_LABEL[l.channel]}</div>
                  </div>
                  <LeadStatus leadId={l.leadId} className="shrink-0" />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-brand-border/70 pt-3">
                  <span className="text-[11px] text-brand-secondary/50">{sentAgo(l.createdAt)}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark">
                    View <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Table on sm+ */}
          <div className="hidden sm:block">
            <DataTable columns={columns} rows={enquiries} rowKey={(l) => l.leadId} />
          </div>
        </>
      )}

      <div className="flex items-center gap-3 border border-brand-primary/30 bg-brand-tertiary p-4 text-xs text-brand-secondary/70">
        <Send className="h-4 w-4 text-brand-primary-dark" />
        <div>
          Owners reply directly by phone or WhatsApp — VXP never shares your contact details without your action.
        </div>
      </div>
    </div>
  )
}
