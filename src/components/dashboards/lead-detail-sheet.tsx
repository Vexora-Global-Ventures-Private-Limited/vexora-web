"use client"

import { useEffect, useState } from "react"
import { Lock, Phone, Building2, Radio, Clock } from "lucide-react"
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
import { STAGE_TONE, type Lead, type LeadStage } from "@/lib/dashboard-data"
import { useLeadsStore } from "@/lib/leads-store"

type LeadDetailSheetProps = {
  lead: Lead | null
  stageOptions: LeadStage[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailSheet({ lead, stageOptions, open, onOpenChange }: LeadDetailSheetProps) {
  const setStage = useLeadsStore((s) => s.setStage)
  const setNotes = useLeadsStore((s) => s.setNotes)
  const [notesDraft, setNotesDraft] = useState(lead?.notes ?? "")

  useEffect(() => {
    setNotesDraft(lead?.notes ?? "")
  }, [lead?.id, lead?.notes])

  const commitNotes = () => {
    if (lead && notesDraft !== lead.notes) setNotes(lead.id, notesDraft)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden border-brand-border p-0 sm:max-w-[420px]">
        {lead && (
          <>
            <SheetHeader className="shrink-0 space-y-2 border-b border-brand-border/60 px-5 pb-4 pt-5">
              <div className="flex items-center justify-between gap-3">
                <SheetTitle className="font-serif text-lg tracking-tight text-brand-secondary">
                  {lead.delivered ? lead.name : "Contact masked"}
                </SheetTitle>
                <StatusPill tone={STAGE_TONE[lead.stage]}>{lead.delivered ? lead.stage : "Undelivered"}</StatusPill>
              </div>
              <SheetDescription className="text-xs text-brand-muted-foreground">{lead.id}</SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
              {!lead.delivered ? (
                <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                  <Lock className="h-4 w-4 shrink-0" />
                  <div>
                    This lead arrived while the listing&apos;s seller membership had lapsed, so the buyer&apos;s
                    identity and contact details stay masked. Renew the membership to unlock this lead and start
                    working it.
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <DetailRow icon={Phone} label="Phone" value={lead.phone} />
                    <DetailRow icon={Building2} label="Property" value={lead.property} />
                    <DetailRow icon={Radio} label="Source" value={lead.source} />
                    <DetailRow icon={Clock} label="Received" value={lead.createdAt} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-brand-secondary">Stage</Label>
                    <Select value={lead.stage} onValueChange={(value) => setStage(lead.id, value as LeadStage)}>
                      <SelectTrigger className="w-full bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stageOptions.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-brand-muted-foreground">
                      Moving a lead updates its column on the pipeline board.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-brand-secondary">Notes</Label>
                    <Textarea
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      onBlur={commitNotes}
                      placeholder="Add notes about this buyer — budget, preferences, next steps…"
                      className="min-h-32 resize-none bg-card text-sm"
                    />
                    <p className="text-[11px] text-brand-muted-foreground">Saved automatically when you click away.</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border border-brand-border bg-card px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary-dark" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium text-brand-secondary">{value}</div>
      </div>
    </div>
  )
}
