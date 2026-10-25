"use client"

import { useId, useState } from "react"
import { Lock, Phone, Building2, Radio, Clock, MessageSquare, PhoneCall, User } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StatusPill } from "@/components/dashboard/status-pill"
import type { Tier } from "@/lib/nav-store"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import {
  useAddLeadActivityMutation,
  useCallLeadMutation,
  useGetLeadQuery,
  type CrmStage,
  type MercuryStatus,
} from "@/store/api/leadsApi"
import {
  CHANNEL_LABEL,
  MERCURY_STATUSES,
  MERCURY_STATUS_LABEL,
  MERCURY_STATUS_TONE,
  listingLabel,
  stageOf,
  stageTone,
  timeAgo,
  type CrmLeadRow,
} from "@/components/crm/crm-lead"

type LeadDetailSheetProps = {
  lead: CrmLeadRow | null
  tier: Tier
  stages: CrmStage[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Mercury status / Jupiter-Venus stage move — owned by the pipeline so the list updates too. */
  onMove: (lead: CrmLeadRow, target: { status?: MercuryStatus; stageId?: string }) => void
}

/**
 * Seller-side lead detail: GET /leads/:id (lead + activity timeline), add a
 * note (POST /crm/leads/:id/activities), and the masked call
 * (POST /leads/:id/call — delivered leads only). Undelivered leads stay
 * read-only and masked until the membership renews (BR-35).
 */
/** Client-side cap — the API's own limit can't be probed without a paid account. */
const NOTE_MAX_LENGTH = 1000

export function LeadDetailSheet({ lead, tier, stages, open, onOpenChange, onMove }: LeadDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden border-brand-border p-0 sm:max-w-[420px]">
        {lead && <LeadDetail key={lead.id} lead={lead} tier={tier} stages={stages} onMove={onMove} />}
      </SheetContent>
    </Sheet>
  )
}

function LeadDetail({
  lead,
  tier,
  stages,
  onMove,
}: {
  lead: CrmLeadRow
  tier: Tier
  stages: CrmStage[]
  onMove: LeadDetailSheetProps["onMove"]
}) {
  const delivered = lead.delivery === "delivered"
  const isKanbanTier = tier === "J" || tier === "V"
  const stage = stageOf(lead, stages)
  const moveSelectId = useId()

  return (
    <>
      <SheetHeader className="shrink-0 space-y-2 border-b border-brand-border/60 px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <SheetTitle className="font-serif text-lg tracking-tight text-brand-secondary">
            {delivered ? lead.buyerName ?? "Buyer" : "Contact masked"}
          </SheetTitle>
          {!delivered ? (
            <StatusPill tone="danger">Undelivered</StatusPill>
          ) : isKanbanTier ? (
            <StatusPill tone={stageTone(stage, stages)}>{stage?.name ?? "New"}</StatusPill>
          ) : (
            <StatusPill tone={MERCURY_STATUS_TONE[lead.status]}>{MERCURY_STATUS_LABEL[lead.status]}</StatusPill>
          )}
        </div>
        <SheetDescription className="text-xs text-brand-muted-foreground">Lead {lead.id}</SheetDescription>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        {!delivered ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              <Lock className="h-4 w-4 shrink-0" />
              <div>
                This enquiry arrived while your membership had lapsed, so the buyer&apos;s identity and contact
                details stay masked. Renew your membership to unlock it and start working it.
              </div>
            </div>
            <DetailRow icon={Building2} label="Property" value={listingLabel(lead)} />
            <DetailRow icon={Radio} label="Channel" value={CHANNEL_LABEL[lead.channel]} />
            <DetailRow icon={Clock} label="Received" value={timeAgo(lead.createdAt)} />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {lead.buyerName && <DetailRow icon={User} label="Buyer" value={lead.buyerName} />}
              {lead.buyerPhone && (
                <DetailRow icon={Phone} label="Phone" value={lead.buyerPhone} href={`tel:${lead.buyerPhone.replace(/\s+/g, "")}`} />
              )}
              <DetailRow icon={Building2} label="Property" value={listingLabel(lead)} />
              <DetailRow icon={Radio} label="Channel" value={CHANNEL_LABEL[lead.channel]} />
              <DetailRow icon={Clock} label="Received" value={timeAgo(lead.createdAt)} />
              {lead.preferredTime && <DetailRow icon={Clock} label="Preferred time" value={lead.preferredTime} />}
              {lead.message && <DetailRow icon={MessageSquare} label="Message" value={lead.message} wrap />}
            </div>

            <MaskedCall leadId={lead.id} />

            <div className="space-y-2">
              <Label htmlFor={moveSelectId} className="text-xs font-medium text-brand-secondary">
                {isKanbanTier ? "Stage" : "Status"}
              </Label>
              {isKanbanTier ? (
                <Select
                  value={stage?._id ?? ""}
                  onValueChange={(stageId) => onMove(lead, { stageId })}
                  disabled={stages.length === 0}
                >
                  <SelectTrigger id={moveSelectId} className="w-full bg-card">
                    <SelectValue placeholder={stages.length === 0 ? "Stages unavailable" : "Stage"} />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={lead.status} onValueChange={(status) => onMove(lead, { status: status as MercuryStatus })}>
                  <SelectTrigger id={moveSelectId} className="w-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MERCURY_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {MERCURY_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <ActivityTimeline leadId={lead.id} />
          </div>
        )}
      </div>
    </>
  )
}

/** Temporary virtual number that forwards to the buyer — demo mode returns a fixed mock number. */
function MaskedCall({ leadId }: { leadId: string }) {
  const [callLead, { data, isLoading }] = useCallLeadMutation()
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    setError(null)
    try {
      await callLead(leadId).unwrap()
    } catch (err) {
      setError(
        getApiErrorCode(err) === "INVALID_STATE_TRANSITION"
          ? "This lead isn't reachable by call right now."
          : getApiErrorMessage(err) ?? "Couldn't start the call. Please try again.",
      )
    }
  }

  const expiry = data ? new Date(data.expiresAt) : null
  const expiryLabel =
    expiry && !Number.isNaN(expiry.getTime())
      ? expiry.toLocaleString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          // Show the date too unless it expires today.
          ...(expiry.toDateString() !== new Date().toDateString() && { day: "numeric", month: "short" }),
        })
      : null

  return (
    <div className="border border-brand-border bg-brand-tertiary/40 p-3">
      {data ? (
        <div className="text-xs text-brand-secondary">
          Call{" "}
          <a href={`tel:${data.virtualNumber.replace(/\s+/g, "")}`} className="font-mono text-sm font-bold underline">
            {data.virtualNumber}
          </a>{" "}
          — it forwards to the buyer without either of you seeing the other&apos;s real number.
          {expiryLabel && (
            <div className="mt-1 text-[11px] text-brand-muted-foreground">Valid until {expiryLabel}</div>
          )}
          <button
            type="button"
            onClick={start}
            disabled={isLoading}
            className="mt-1 text-[11px] font-semibold text-brand-primary-dark hover:text-brand-secondary disabled:opacity-60"
          >
            {isLoading ? "Getting a new number…" : "Get a new number"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={isLoading}
          className="flex items-center gap-2 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary disabled:opacity-60"
        >
          <PhoneCall className="h-4 w-4" /> {isLoading ? "Getting a masked number…" : "Call via masked number"}
        </button>
      )}
      {error && <p className="mt-2 text-[11px] font-semibold text-red-500">{error}</p>}
    </div>
  )
}

function ActivityTimeline({ leadId }: { leadId: string }) {
  const { data, isLoading, isError, refetch } = useGetLeadQuery(leadId)
  const [addActivity, { isLoading: isSaving }] = useAddLeadActivityMutation()
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const noteId = useId()
  const activities = [...(data?.activities ?? [])].reverse()

  const save = async () => {
    const note = draft.trim()
    if (!note || note.length > NOTE_MAX_LENGTH || isSaving) return
    setError(null)
    try {
      await addActivity({ id: leadId, note }).unwrap()
      setDraft("")
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "Couldn't save the note. Please try again.")
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={noteId} className="text-xs font-medium text-brand-secondary">Notes</Label>
      <Textarea
        id={noteId}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value.slice(0, NOTE_MAX_LENGTH))
          setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void save()
          }
        }}
        maxLength={NOTE_MAX_LENGTH}
        placeholder="Add a note — budget, preferences, next steps…"
        className="min-h-24 resize-none bg-card text-sm"
      />
      <div className="flex items-center justify-between gap-3">
        {error ? (
          <p className="text-[11px] font-semibold text-red-500">{error}</p>
        ) : (
          <span className="text-[10px] text-brand-muted-foreground">
            {draft.length}/{NOTE_MAX_LENGTH} · Ctrl/⌘+Enter to save
          </span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={isSaving || !draft.trim()}
          className="btn-gold relative overflow-hidden px-4 py-1.5 text-xs font-bold disabled:opacity-50"
        >
          <span className="relative z-10">{isSaving ? "Saving…" : "Add note"}</span>
        </button>
      </div>

      <div className="space-y-2 pt-2">
        {isLoading && <p className="text-[11px] text-brand-muted-foreground">Loading timeline…</p>}
        {isError && (
          <p className="text-[11px] font-semibold text-red-500">
            Couldn&apos;t load the timeline. <button onClick={() => refetch()} className="underline">Retry</button>
          </p>
        )}
        {!isLoading && !isError && activities.length === 0 && (
          <p className="text-[11px] text-brand-muted-foreground">No notes yet.</p>
        )}
        {activities.map((a) => (
          <div key={a._id} className="border border-brand-border bg-card px-3 py-2">
            <div className="whitespace-pre-wrap text-sm text-brand-secondary">
              {a.note ?? a.payload?.note ?? a.type ?? "Activity"}
            </div>
            <div className="mt-1 text-[10px] text-brand-muted-foreground">{timeAgo(a.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
  wrap,
  href,
}: {
  icon: typeof Phone
  label: string
  value: string
  wrap?: boolean
  href?: string
}) {
  return (
    <div className="flex items-start gap-3 border border-brand-border bg-card px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary-dark" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted-foreground">{label}</div>
        <div className={wrap ? "whitespace-pre-wrap break-words text-sm font-medium text-brand-secondary" : "truncate text-sm font-medium text-brand-secondary"}>
          {href ? (
            <a href={href} className="underline decoration-brand-primary/50 hover:text-brand-primary-dark">
              {value}
            </a>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  )
}
