import type { ReactNode } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type DataTableColumn<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyLabel?: string
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ columns, rows, rowKey, emptyLabel = "Nothing to show yet.", onRowClick }: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="border border-brand-border bg-card p-8 text-center text-sm text-brand-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="overflow-hidden border border-brand-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-brand-border hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn("text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground", col.className)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              className={cn("border-brand-border/70", onRowClick && "cursor-pointer hover:bg-brand-tertiary/50")}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
