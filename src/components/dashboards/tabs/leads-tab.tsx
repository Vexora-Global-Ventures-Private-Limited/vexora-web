"use client"

import { useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Lock, Bell, GripVertical, Table2, Kanban, Search, X, RefreshCw } from "lucide-react"
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
import { useNav, type Tier } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { getApiErrorMessage } from "@/lib/api-error"
import {
  useGetCrmStagesQuery,
  useGetCrmSummaryQuery,
  useGetLeadQuery,
  useLazyGetCrmLeadsQuery,
  useUpdateLeadStageMutation,
  useUpdateLeadStatusMutation,
  type CrmLeadsParams,
  type CrmStage,
  type Lead,
  type LeadChannel,
  type LeadDelivery,
  type MercuryStatus,
} from "@/store/api/leadsApi"
import {
  CHANNELS,
  CHANNEL_LABEL,
  MERCURY_STATUSES,
  MERCURY_STATUS_LABEL,
  MERCURY_STATUS_TONE,
  listingLabel,
  sortStages,
  stageOf,
  stageTone,
  timeAgo,
  toCrmLeadRow,
  type CrmLeadRow,
} from "@/components/crm/crm-lead"
import { useCursorList } from "@/components/crm/use-cursor-list"
import { DataTable, type DataTableColumn } from "@/components/dashboard/data-table"
import { StatusPill } from "@/components/dashboard/status-pill"
import { LeadDetailSheet } from "@/components/dashboards/lead-detail-sheet"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ViewMode = "table" | "kanban"
type Column = { id: string; label: string }

const PAGE_SIZE = 25

/**
 * Seller lead pipeline, backed by GET /crm/leads (flat filters + real cursor
 * pagination) and GET /crm/summary. The board is decided by tier on the
 * server: Mercury moves a simple status (PATCH /crm/leads/:id/status),
 * Jupiter/Venus move between their own 7 Kanban stages (GET /crm/stages +
 * PATCH /crm/leads/:id/stage). Undelivered leads (arrived while the
 * membership was lapsed) are read-only and masked.
 */
export function LeadsTab({ tier }: { tier: Tier }) {
  const user = useNav((s) => s.user)
  const isKanbanTier = tier === "J" || tier === "V"
  const { data: summary } = useGetCrmSummaryQuery(undefined, { skip: !user?.id })
  const { data: rawStages, isError: stagesError } = useGetCrmStagesQuery(undefined, { skip: !user?.id || !isKanbanTier })
  const stages = useMemo(() => sortStages(rawStages ?? []), [rawStages])

  // Venus keeps the Kanban board only; Mercury and Jupiter can switch.
  const canSwitchView = tier === "M" || tier === "J"
  const [viewMode, setViewMode] = useState<ViewMode>(tier === "M" ? "table" : "kanban")
  const canKanban = !isKanbanTier || stages.length > 0
  const effectiveView: ViewMode = !canKanban ? "table" : canSwitchView ? viewMode : "kanban"

  const [delivery, setDelivery] = useState<LeadDelivery | "all">("all")
  const [channel, setChannel] = useState<LeadChannel | "all">("all")
  const [column, setColumn] = useState<string>("all")

  if (!user?.id) {
    return (
      <div className="space-y-5">
        <Header />
        <div className="border border-brand-border bg-card p-8 text-center text-sm text-brand-muted-foreground">
          Sign in with your VXP account to see the enquiries on your listings.
        </div>
      </div>
    )
  }

  const filters: CrmLeadsParams = {
    delivery: delivery === "all" ? undefined : delivery,
    channel: channel === "all" ? undefined : channel,
    ...(column === "all" ? {} : isKanbanTier ? { stageId: column } : { status: column as MercuryStatus }),
  }
  const columns: Column[] = isKanbanTier
    ? stages.map((s) => ({ id: s._id, label: s.name }))
    : MERCURY_STATUSES.map((s) => ({ id: s, label: MERCURY_STATUS_LABEL[s] }))
  const hasActiveFilters = delivery !== "all" || channel !== "all" || column !== "all"

  const resetFilters = () => {
    setDelivery("all")
    setChannel("all")
    setColumn("all")
  }

  return (
    <div className="space-y-5">
      <Header>
        {canSwitchView && canKanban && (
          <div className="inline-flex shrink-0 border border-brand-border bg-brand-tertiary/40 p-1">
            <ViewButton active={viewMode === "table"} onClick={() => setViewMode("table")} icon={Table2} label="Table" />
            <ViewButton active={viewMode === "kanban"} onClick={() => setViewMode("kanban")} icon={Kanban} label="Kanban" />
          </div>
        )}
      </Header>
      {(summary?.undeliveredCount ?? 0) > 0 && <UndeliveredBanner count={summary!.undeliveredCount} />}
      {isKanbanTier && stagesError && (
        <p className="text-xs font-semibold text-red-500">
          Couldn&apos;t load your pipeline stages — showing leads without the Kanban board.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border border-brand-border bg-card p-3">
        <Select value={delivery} onValueChange={(v) => setDelivery(v as LeadDelivery | "all")}>
          <SelectTrigger className="h-9 w-[150px] bg-card text-xs" size="sm" aria-label="Filter by delivery">
            <SelectValue placeholder="Delivery" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All leads</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="undelivered">Undelivered</SelectItem>
          </SelectContent>
        </Select>

        <Select value={column} onValueChange={setColumn}>
          <SelectTrigger
            className="h-9 w-[160px] bg-card text-xs"
            size="sm"
            aria-label={isKanbanTier ? "Filter by stage" : "Filter by status"}
          >
            <SelectValue placeholder={isKanbanTier ? "Stage" : "Status"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isKanbanTier ? "All stages" : "All statuses"}</SelectItem>
            {columns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={channel} onValueChange={(v) => setChannel(v as LeadChannel | "all")}>
          <SelectTrigger className="h-9 w-[160px] bg-card text-xs" size="sm" aria-label="Filter by channel">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            {CHANNELS.map((c) => (
              <SelectItem key={c} value={c}>
                {CHANNEL_LABEL[c]}
              </SelectItem>
            ))}
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
      </div>

      {/* Remounts on every filter change so the cursor list starts fresh. */}
      <LeadPipeline
        key={JSON.stringify(filters)}
        tier={tier}
        view={effectiveView}
        filters={filters}
        stages={stages}
        columns={columns}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  )
}

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Lead Pipeline</h2>
        <p className="text-sm text-brand-muted-foreground">
          Every enquiry on your listings — click a lead to see details, move it along or add notes.
        </p>
      </div>
      {children}
    </div>
  )
}

/** BR-25/35: no push for undelivered leads — this banner is how a lapsed seller finds out. */
export function UndeliveredBanner({ count }: { count: number }) {
  const router = useRouter()
  return (
    <div className="flex flex-wrap items-center gap-3 border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
      <Lock className="h-4 w-4 shrink-0" />
      <div className="flex-1">
        <b className="text-sm">
          {count} enquir{count === 1 ? "y" : "ies"} waiting — renew to unlock.
        </b>{" "}
        These arrived while your membership had lapsed. Buyer details stay masked until you renew; no lead is lost.
      </div>
      <button
        type="button"
        onClick={() => router.push(ROUTES.membership)}
        className="shrink-0 bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800"
      >
        Renew membership
      </button>
    </div>
  )
}

function LeadPipeline({
  tier,
  view,
  filters,
  stages,
  columns,
  hasActiveFilters,
}: {
  tier: Tier
  view: ViewMode
  filters: CrmLeadsParams
  stages: CrmStage[]
  columns: Column[]
  hasActiveFilters: boolean
}) {
  const isKanbanTier = tier === "J" || tier === "V"
  const [triggerLeads] = useLazyGetCrmLeadsQuery()
  const { items, setItems, nextCursor, status, loadMoreFailed, loadMore, reload } = useCursorList<Lead>(async (cursor) => {
    const page = await triggerLeads({ ...filters, cursor, limit: PAGE_SIZE }).unwrap()
    return { items: page.leads, nextCursor: page.nextCursor }
  })
  const [updateStatus] = useUpdateLeadStatusMutation()
  const [updateStage] = useUpdateLeadStageMutation()
  const [moveError, setMoveError] = useState<string | null>(null)

  const rows = useMemo(() => items.map(toCrmLeadRow), [items])
  const [search, setSearch] = useState("")
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      `${r.buyerName ?? ""} ${r.listingTitle ?? ""} ${r.listingCity ?? ""} ${r.id} ${r.message ?? ""}`.toLowerCase().includes(q),
    )
  }, [rows, search])

  // `?lead=<id>` opens that lead straight away (overview "Recent leads"
  // links here). A lead that isn't on the first loaded page is fetched on
  // its own so the sheet still opens.
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedId, setSelectedIdState] = useState<string | null>(() => searchParams.get("lead"))
  const listedLead = rows.find((r) => r.id === selectedId) ?? null
  const { data: fetchedLead, isError: leadNotFound } = useGetLeadQuery(selectedId ?? "", {
    skip: !selectedId || !!listedLead,
  })
  const selectedLead = listedLead ?? (fetchedLead ? toCrmLeadRow(fetchedLead.lead) : null)
  const setSelectedId = (id: string | null) => {
    setSelectedIdState(id)
    // Keep the URL in step so a refresh doesn't reopen a closed lead.
    if (!id && searchParams.get("lead")) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("lead")
      router.replace(`${pathname}?${params}`)
    }
  }

  const columnOf = (row: CrmLeadRow) => (isKanbanTier ? stageOf(row, stages)?._id ?? "" : row.status)

  // Optimistic move. On failure only the field that was changed is put
  // back, so a second move made meanwhile isn't clobbered by the revert.
  const move = async (lead: CrmLeadRow, target: { status?: MercuryStatus; stageId?: string }) => {
    if (lead.delivery !== "delivered") return
    setMoveError(null)
    const patch = (value: Partial<Lead>) =>
      setItems((prev) => prev.map((l) => (l._id === lead.id ? { ...l, ...value } : l)))
    const isStageMove = !!target.stageId && target.stageId !== lead.stageId
    const isStatusMove = !isStageMove && !!target.status && target.status !== lead.status
    if (!isStageMove && !isStatusMove) return
    try {
      if (isStageMove) {
        patch({ stageId: target.stageId })
        await updateStage({ id: lead.id, stageId: target.stageId! }).unwrap()
      } else {
        patch({ mercuryStatus: target.status })
        await updateStatus({ id: lead.id, status: target.status! }).unwrap()
      }
      // Filtered to one stage/status? The lead no longer belongs in this view.
      const leftFilter =
        (isStageMove && filters.stageId && filters.stageId !== target.stageId) ||
        (isStatusMove && filters.status && filters.status !== target.status)
      if (leftFilter) {
        setItems((prev) => prev.filter((l) => l._id !== lead.id))
        if (selectedId === lead.id) setSelectedId(null)
      }
    } catch (err) {
      patch(isStageMove ? { stageId: lead.stageId } : { mercuryStatus: lead.status })
      setMoveError(getApiErrorMessage(err) ?? "Couldn't move that lead. Please try again.")
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-secondary/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search loaded leads by buyer, property or message…"
            className="h-9 bg-card pl-8 text-sm"
          />
        </div>
        <span className="shrink-0 text-xs text-brand-muted-foreground">
          {visibleRows.length} lead{visibleRows.length === 1 ? "" : "s"}
          {nextCursor ? " loaded" : ""}
        </span>
        <button
          type="button"
          onClick={reload}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-brand-secondary/55 hover:text-brand-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {moveError && <p className="text-xs font-semibold text-red-500">{moveError}</p>}
      {selectedId && !listedLead && leadNotFound && (
        <p className="text-xs font-semibold text-red-500">
          That lead couldn&apos;t be opened — it may have been removed.{" "}
          <button type="button" onClick={() => setSelectedId(null)} className="underline">Dismiss</button>
        </p>
      )}

      {status === "loading" ? (
        <div className="border border-brand-border bg-card p-8 text-center text-sm text-brand-muted-foreground">Loading leads…</div>
      ) : status === "error" && rows.length === 0 ? (
        <div className="border border-brand-border bg-card p-8 text-center text-sm text-red-500">
          Couldn&apos;t load your leads.{" "}
          <button onClick={reload} className="underline">Retry</button>
        </div>
      ) : view === "table" ? (
        <LeadsTable
          rows={visibleRows}
          tier={tier}
          stages={stages}
          onSelect={setSelectedId}
          emptyLabel={
            hasActiveFilters || search
              ? "No leads match your filters."
              : "No enquiries yet — they'll appear here as soon as a buyer contacts one of your listings."
          }
        />
      ) : (
        <StageBoard
          rows={visibleRows}
          tier={tier}
          stages={stages}
          columns={columns}
          columnOf={columnOf}
          onSelect={setSelectedId}
          onMove={(row, columnId) => move(row, isKanbanTier ? { stageId: columnId } : { status: columnId as MercuryStatus })}
        />
      )}

      {loadMoreFailed && (
        <p className="text-center text-xs font-semibold text-red-500">
          Couldn&apos;t load more leads.{" "}
          <button type="button" onClick={loadMore} className="underline">Try again</button>
        </p>
      )}
      {nextCursor && status !== "loading" && !loadMoreFailed && (
        <div className="text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={status === "loadingMore"}
            className="border border-brand-border bg-card px-5 py-2 text-xs font-bold text-brand-secondary hover:border-brand-primary/50 disabled:opacity-60"
          >
            {status === "loadingMore" ? "Loading…" : "Load more leads"}
          </button>
        </div>
      )}

      <LeadDetailSheet
        lead={selectedLead}
        tier={tier}
        stages={stages}
        // Only open once there's a lead to show — never an empty sheet.
        open={selectedId !== null && selectedLead !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        onMove={move}
      />
    </div>
  )
}

function ViewButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Table2
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors",
        active ? "bg-card text-brand-secondary shadow-sm" : "text-brand-secondary/55 hover:text-brand-secondary",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  )
}

function StatusCell({ row, tier, stages }: { row: CrmLeadRow; tier: Tier; stages: CrmStage[] }) {
  if (row.delivery !== "delivered") return <StatusPill tone="danger">Undelivered</StatusPill>
  if (tier === "J" || tier === "V") {
    const stage = stageOf(row, stages)
    return <StatusPill tone={stageTone(stage, stages)}>{stage?.name ?? "New"}</StatusPill>
  }
  return <StatusPill tone={MERCURY_STATUS_TONE[row.status]}>{MERCURY_STATUS_LABEL[row.status]}</StatusPill>
}

function LeadsTable({
  rows,
  tier,
  stages,
  onSelect,
  emptyLabel,
}: {
  rows: CrmLeadRow[]
  tier: Tier
  stages: CrmStage[]
  onSelect: (id: string) => void
  emptyLabel: string
}) {
  const columns: DataTableColumn<CrmLeadRow>[] = [
    {
      key: "buyer",
      header: "Buyer",
      render: (r) =>
        r.delivery === "delivered" ? (
          <span className="font-semibold text-brand-secondary">{r.buyerName ?? "Buyer"}</span>
        ) : (
          <MaskedLabel />
        ),
    },
    {
      key: "property",
      header: "Property",
      render: (r) => <span className="text-brand-secondary/70">{listingLabel(r)}</span>,
    },
    {
      key: "channel",
      header: "Channel",
      render: (r) => <span className="text-brand-secondary/60">{CHANNEL_LABEL[r.channel]}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusCell row={r} tier={tier} stages={stages} />,
    },
    {
      key: "createdAt",
      header: "Received",
      render: (r) => <span className="text-brand-secondary/55">{timeAgo(r.createdAt)}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      emptyLabel={emptyLabel}
      onRowClick={(r) => onSelect(r.id)}
      rowLabel={(r) => `Open lead${r.delivery === "delivered" && r.buyerName ? ` from ${r.buyerName}` : ""} on ${listingLabel(r)}`}
    />
  )
}

function StageBoard({
  rows,
  tier,
  stages,
  columns,
  columnOf,
  onSelect,
  onMove,
}: {
  rows: CrmLeadRow[]
  tier: Tier
  stages: CrmStage[]
  columns: Column[]
  columnOf: (row: CrmLeadRow) => string
  onSelect: (id: string) => void
  onMove: (row: CrmLeadRow, columnId: string) => void
}) {
  const [active, setActive] = useState<CrmLeadRow | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  // The pointer-up that ends a drag also fires a click on the card — without
  // this, every drag would open the lead sheet as well.
  const justDragged = useRef(false)
  const select = (id: string) => {
    if (justDragged.current) return
    onSelect(id)
  }

  const handleDragStart = (event: DragStartEvent) => {
    justDragged.current = true
    setActive(rows.find((r) => r.id === event.active.id) ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setTimeout(() => {
      justDragged.current = false
    }, 0)
    setActive(null)
    const { active: dragged, over } = event
    if (!over) return
    const row = rows.find((r) => r.id === dragged.id)
    if (row && row.delivery === "delivered" && columnOf(row) !== over.id) onMove(row, String(over.id))
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        justDragged.current = false
        setActive(null)
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:gap-3 lg:overflow-x-auto lg:pb-2">
        {columns.map((c) => (
          <StageColumn
            key={c.id}
            column={c}
            rows={rows.filter((r) => columnOf(r) === c.id)}
            tier={tier}
            stages={stages}
            onSelect={select}
          />
        ))}
      </div>
      <DragOverlay>{active && <LeadCard row={active} dragging />}</DragOverlay>
    </DndContext>
  )
}

function StageColumn({
  column,
  rows,
  onSelect,
}: {
  column: Column
  rows: CrmLeadRow[]
  tier: Tier
  stages: CrmStage[]
  onSelect: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border p-3 transition-colors lg:w-[220px] lg:shrink-0",
        isOver ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-brand-tertiary/30",
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-brand-secondary/70">{column.label}</span>
        <span className="rounded-full bg-ink-black px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">{rows.length}</span>
      </div>
      <div className="min-h-14 space-y-2">
        {rows.length === 0 && (
          <div
            className={cn(
              "border border-dashed p-3 text-center text-[11px]",
              isOver ? "border-brand-primary text-brand-primary-dark" : "border-brand-border text-brand-secondary/40",
            )}
          >
            {isOver ? "Drop here" : "Empty"}
          </div>
        )}
        {rows.map((r) => (
          <DraggableLeadCard key={r.id} row={r} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function DraggableLeadCard({ row, onSelect }: { row: CrmLeadRow; onSelect: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: row.id,
    disabled: row.delivery !== "delivered",
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(row.id)}
      // No keyboard drag sensor — Enter/Space opens the lead, where the
      // stage/status can be changed from a select instead.
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(row.id)
        }
      }}
      aria-label={`Open lead${row.delivery === "delivered" && row.buyerName ? ` from ${row.buyerName}` : ""} on ${listingLabel(row)}`}
      className={cn(
        "touch-none outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
        isDragging && "opacity-30",
      )}
    >
      <LeadCard row={row} />
    </div>
  )
}

function LeadCard({ row, dragging }: { row: CrmLeadRow; dragging?: boolean }) {
  const delivered = row.delivery === "delivered"
  return (
    <div
      className={cn(
        "border p-3 text-left transition-colors",
        delivered
          ? "cursor-grab border-brand-border bg-card hover:border-brand-primary/40 active:cursor-grabbing"
          : "cursor-pointer border-red-200 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/30",
        dragging && "cursor-grabbing shadow-xl ring-2 ring-brand-primary/50",
      )}
    >
      {delivered ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs font-bold text-brand-secondary">{row.buyerName ?? "Buyer"}</div>
            <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-secondary/25" />
          </div>
          <div className="mt-0.5 truncate text-[11px] text-brand-secondary/55">{listingLabel(row)}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-brand-secondary/45">
            <Bell className="h-2.5 w-2.5" /> {timeAgo(row.createdAt)} · {CHANNEL_LABEL[row.channel]}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
            <Lock className="h-3 w-3" /> Contact masked
          </div>
          <div className="mt-0.5 truncate text-[11px] text-red-700/70 dark:text-red-400/70">{listingLabel(row)}</div>
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
