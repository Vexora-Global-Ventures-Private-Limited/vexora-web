"use client"

import { useRouter } from "next/navigation"
import { Send, ArrowUpRight, MapPin } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { properties } from "@/lib/vxp-data"
import { useContactStore, CHANNEL_LABEL, type SubmittedLead } from "@/lib/contact-store"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { StatusPill } from "@/components/dashboard/status-pill"

export function EnquiriesTab() {
  const router = useRouter()
  const submittedLeads = useContactStore((s) => s.submittedLeads)
  const enquiries = [...submittedLeads].reverse()

  // Never surface delivered/undelivered here — the docs require the buyer to
  // see identical treatment regardless of the seller's membership state.
  const columns: DataTableColumn<SubmittedLead>[] = [
    {
      key: "property",
      header: "Property",
      render: (l) => {
        const property = properties.find((p) => p.id === l.propertyId)
        return <span className="font-semibold text-brand-secondary">{property?.title ?? l.propertyId}</span>
      },
    },
    {
      key: "channel",
      header: "How you reached out",
      render: (l) => <span className="text-brand-secondary/70">{CHANNEL_LABEL[l.channel]}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: () => <StatusPill tone="info">Sent</StatusPill>,
    },
    {
      key: "createdAt",
      header: "Sent",
      render: () => <span className="text-brand-secondary/55">Recently</span>,
    },
    {
      key: "view",
      header: "",
      render: (l) => (
        <button
          onClick={() => router.push(ROUTES.propertyDetail(l.propertyId))}
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
          <p className="text-sm text-brand-muted-foreground">Every contact request you&apos;ve sent</p>
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
            {enquiries.map((l) => {
              const property = properties.find((p) => p.id === l.propertyId)
              return (
                <button
                  key={l.id}
                  onClick={() => router.push(ROUTES.propertyDetail(l.propertyId))}
                  className="block w-full border border-brand-border bg-card p-4 text-left"
                >
                  <div className="flex items-start gap-3">
                    {property && (
                      <img
                        src={property.image}
                        alt={property.title}
                        className="h-14 w-14 shrink-0 rounded-sm object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-brand-secondary">
                        {property?.title ?? l.propertyId}
                      </div>
                      {property && (
                        <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-brand-secondary/55">
                          <MapPin className="h-3 w-3 shrink-0 text-brand-primary-dark" /> {property.location}
                        </div>
                      )}
                      <div className="mt-1.5 text-xs text-brand-secondary/65">{CHANNEL_LABEL[l.channel]}</div>
                    </div>
                    <StatusPill tone="info" className="shrink-0">Sent</StatusPill>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-brand-border/70 pt-3">
                    <span className="text-[11px] text-brand-secondary/50">Recently</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark">
                      View <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Table on sm+ */}
          <div className="hidden sm:block">
            <DataTable columns={columns} rows={enquiries} rowKey={(l) => l.id} />
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
