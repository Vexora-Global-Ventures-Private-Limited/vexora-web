import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-brand-border bg-brand-surface/50 px-6 py-12 text-center",
        className,
      )}
      role="status"
    >
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center bg-brand-tertiary text-brand-primary-dark">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-brand-secondary">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
