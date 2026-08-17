"use client"

import { useMemo, useState } from "react"
import { Lock, Bell, GripVertical, Table2, Kanban, Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import type { Tier } from "@/lib/nav-store"
import { getMergedLeads, leadPipelineJupiter, leadPipelineVenus, STAGE_TONE, type Lead, type LeadStage } from "@/lib/dashboard-data"
import { useLeadsStore, applyLeadOverrides } from "@/lib/leads-store"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { StatusPill } from "@/components/dashboard/status-pill"
import { LeadDetailSheet } from "@/components/dashboards/lead-detail-sheet"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ViewMode = "table" | "kanban"
type SortKey = "newest" | "oldest" | "name-asc" | "name-desc"

const SOURCES: Lead["source"][] = [
  "Property Click",
  "Contact Request",
  "Callback Request",
  "Site Visit",
  "Listing Enquiry",
  "Sponsored Property Click",
  "Advertisement Click",
]

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function stageOptionsFor(tier: Tier): LeadStage[] {
  const stages = (tier === "V" ? leadPipelineVenus : leadPipelineJupiter).map((s) => s.stage as LeadStage)
  return [...stages, "Lost"]
}

export function LeadsTab({ tier }: { tier: Tier }) {
  const overrides = useLeadsStore((s) => s.overrides)
  const allLeads = useMemo(() => getMergedLeads().map((l) => applyLeadOverrides(l, overrides)), [overrides])
  const undeliveredCount = allLeads.filter((l) => !l.delivered).length
  const stageOptions = stageOptionsFor(tier)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedLead = allLeads.find((l) => l.id === selectedId) ?? null

  // Venus keeps the full kanban board only; Mercury and Jupiter can switch.
  const canSwitchView = tier === "M" || tier === "J"
  const [viewMode, setViewMode] = useState<ViewMode>(tier === "M" ? "table" : "kanban")
  const effectiveView: ViewMode = canSwitchView ? viewMode : "kanban"

  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all")
  const [sourceFilter, setSourceFilter] = useState<Lead["source"] | "all">("all")
  const [sortKey, setSortKey] = useState<SortKey>("newest")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = allLeads.filter((l) => {
      if (stageFilter !== "all" && l.stage !== stageFilter) return false
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false
      if (q) {
        const haystack = `${l.name} ${l.property} ${l.id}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    const sorted = [...filtered]
    if (sortKey === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortKey === "name-desc") sorted.sort((a, b) => b.name.localeCompare(a.name))
    else if (sortKey === "oldest") sorted.reverse() // allLeads is already newest-first
    return sorted
  }, [allLeads, search, stageFilter, sourceFilter, sortKey])

  const hasActiveFilters = search !== "" || stageFilter !== "all" || sourceFilter !== "all"
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const resetFilters = () => {
    setSearch("")
    setStageFilter("all")
    setSourceFilter("all")
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-secondary">Lead Pipeline</h2>
          <p className="text-sm text-brand-muted-foreground">
            {effectiveView === "table"
              ? "Every enquiry, in one list — click a lead to view details, change its stage or add notes."
              : "Every enquiry, grouped by stage — drag a card to move it, or click to view details and add notes."}
          </p>
        </div>
        {canSwitchView && (
          <div className="inline-flex shrink-0 border border-brand-border bg-brand-tertiary/40 p-1">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors",
                viewMode === "table"
                  ? "bg-card text-brand-secondary shadow-sm"
                  : "text-brand-secondary/55 hover:text-brand-secondary",
              )}
            >
              <Table2 className="h-3.5 w-3.5" /> Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              aria-pressed={viewMode === "kanban"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors",
                viewMode === "kanban"
                  ? "bg-card text-brand-secondary shadow-sm"
                  : "text-brand-secondary/55 hover:text-brand-secondary",
              )}
            >
              <Kanban className="h-3.5 w-3.5" /> Kanban
            </button>
          </div>
        )}
      </div>

      {undeliveredCount > 0 && (
        <div className="flex items-center gap-3 border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          <Lock className="h-4 w-4 shrink-0" />
          <div>
            <b>{undeliveredCount} lead{undeliveredCount === 1 ? "" : "s"} undelivered.</b> These arrived while a
            listing&apos;s seller membership had lapsed — buyer identity stays masked until the membership renews.
            No lead is ever lost.
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border border-brand-border bg-card p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-secondary/40" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name, property or ID…"
            className="h-9 bg-card pl-8 text-sm"
          />
        </div>

        <Select
          value={stageFilter}
          onValueChange={(v) => {
            setStageFilter(v as LeadStage | "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="h-9 w-[150px] bg-card text-xs" size="sm">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {stageOptions.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sourceFilter}
          onValueChange={(v) => {
            setSourceFilter(v as Lead["source"] | "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="h-9 w-[170px] bg-card text-xs" size="sm">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="h-9 w-[150px] bg-card text-xs" size="sm">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="name-asc">Name A–Z</SelectItem>
            <SelectItem value="name-desc">Name Z–A</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-brand-secondary/55 hover:text-brand-secondary"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}

        <span className="ml-auto shrink-0 text-xs text-brand-muted-foreground">
          {filteredLeads.length} lead{filteredLeads.length === 1 ? "" : "s"}
        </span>
      </div>

      {effectiveView === "table" ? (
        <>
          <LeadsTable
            leads={paginatedLeads}
            onSelect={setSelectedId}
            emptyLabel={hasActiveFilters ? "No leads match your filters." : "No enquiries yet."}
          />
          {filteredLeads.length > 0 && (
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredLeads.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
              }}
            />
          )}
        </>
      ) : (
        <StageBoard leads={filteredLeads} stageOptions={stageOptions} onSelect={setSelectedId} />
      )}

      <LeadDetailSheet
        lead={selectedLead}
        stageOptions={stageOptions}
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  )
}

function LeadsTable({
  leads,
  onSelect,
  emptyLabel,
}: {
  leads: Lead[]
  onSelect: (id: string) => void
  emptyLabel?: string
}) {
  const columns: DataTableColumn<Lead>[] = [
    {
      key: "name",
      header: "Buyer",
      render: (l) =>
        l.delivered ? (
          <span className="font-semibold text-brand-secondary">{l.name}</span>
        ) : (
          <MaskedLabel />
        ),
    },
    {
      key: "property",
      header: "Property",
      render: (l) => <span className="text-brand-secondary/70">{l.property}</span>,
    },
    {
      key: "source",
      header: "Source",
      render: (l) => <span className="text-brand-secondary/60">{l.source}</span>,
    },
    {
      key: "stage",
      header: "Status",
      render: (l) => <StatusPill tone={STAGE_TONE[l.stage]}>{l.delivered ? l.stage : "Undelivered"}</StatusPill>,
    },
    {
      key: "createdAt",
      header: "Received",
      render: (l) => <span className="text-brand-secondary/55">{l.createdAt}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={leads}
      rowKey={(l) => l.id}
      emptyLabel={emptyLabel ?? "No enquiries yet."}
      onRowClick={(l) => onSelect(l.id)}
    />
  )
}

function PaginationBar({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-brand-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="h-8 w-[68px] bg-card text-xs" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span>
          {start}–{end} of {totalItems}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="grid h-7 w-7 place-items-center border border-brand-border hover:bg-brand-tertiary/50 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="px-1 font-semibold text-brand-secondary">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="grid h-7 w-7 place-items-center border border-brand-border hover:bg-brand-tertiary/50 disabled:opacity-30 disabled:hover:bg-transparent"
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function StageBoard({
  leads,
  stageOptions,
  onSelect,
}: {
  leads: Lead[]
  stageOptions: LeadStage[]
  onSelect: (id: string) => void
}) {
  const setStage = useLeadsStore((s) => s.setStage)
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLead(leads.find((l) => l.id === event.active.id) ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null)
    const { active, over } = event
    if (!over) return
    const newStage = over.id as LeadStage
    const lead = leads.find((l) => l.id === active.id)
    if (lead && lead.delivered && lead.stage !== newStage) {
      setStage(lead.id, newStage)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveLead(null)}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:gap-3 lg:overflow-x-auto lg:pb-2">
        {stageOptions.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            leads={leads.filter((l) => l.stage === stage)}
            onSelect={onSelect}
          />
        ))}
      </div>
      <DragOverlay>{activeLead && <LeadCard lead={activeLead} dragging />}</DragOverlay>
    </DndContext>
  )
}

function StageColumn({
  stage,
  leads,
  onSelect,
}: {
  stage: LeadStage
  leads: Lead[]
  onSelect: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border p-3 transition-colors lg:w-[220px] lg:shrink-0",
        isOver ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-brand-tertiary/30",
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-brand-secondary/70">{stage}</span>
        <span className="rounded-full bg-ink-black px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">
          {leads.length}
        </span>
      </div>
      <div className="min-h-14 space-y-2">
        {leads.length === 0 && (
          <div
            className={cn(
              "border border-dashed p-3 text-center text-[11px]",
              isOver ? "border-brand-primary text-brand-primary-dark" : "border-brand-border text-brand-secondary/40",
            )}
          >
            {isOver ? "Drop here" : "Empty"}
          </div>
        )}
        {leads.map((l) => (
          <DraggableLeadCard key={l.id} lead={l} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function DraggableLeadCard({ lead, onSelect }: { lead: Lead; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    disabled: !lead.delivered,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(lead.id)}
      className={cn("touch-none", isDragging && "opacity-30")}
    >
      <LeadCard lead={lead} />
    </div>
  )
}

function LeadCard({ lead, dragging }: { lead: Lead; dragging?: boolean }) {
  return (
    <div
      className={cn(
        "border p-3 text-left transition-colors",
        lead.delivered
          ? "cursor-grab border-brand-border bg-card hover:border-brand-primary/40 active:cursor-grabbing"
          : "cursor-default border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/30",
        dragging && "cursor-grabbing shadow-xl ring-2 ring-brand-primary/50",
      )}
    >
      {lead.delivered ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-secondary">
              {lead.name}
            </div>
            <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-secondary/25" />
          </div>
          <div className="mt-0.5 truncate text-[11px] text-brand-secondary/55">{lead.property}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-brand-secondary/45">
            <Bell className="h-2.5 w-2.5" /> {lead.createdAt} · {lead.source}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
            <Lock className="h-3 w-3" /> Contact masked
          </div>
          <div className="mt-0.5 truncate text-[11px] text-red-700/70 dark:text-red-400/70">{lead.property}</div>
          <div className="mt-1 text-[10px] text-red-700/60 dark:text-red-400/60">Renew membership to unlock</div>
        </>
      )}
    </div>
  )
}

function MaskedLabel() {
  return (
    <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400">
      <Lock className="h-3 w-3" /> Masked
    </span>
  )
}
