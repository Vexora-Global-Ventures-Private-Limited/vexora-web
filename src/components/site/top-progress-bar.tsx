"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function TopProgressBar({ active }: { active?: boolean }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!active) {
      setWidth(0)
      return
    }
    setWidth(12)
    const t1 = setTimeout(() => setWidth(55), 120)
    const t2 = setTimeout(() => setWidth(88), 380)
    const t3 = setTimeout(() => setWidth(100), 560)
    const t4 = setTimeout(() => setWidth(0), 900)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [active])

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[120] h-0.5 origin-left bg-gradient-to-r from-brand-primary via-brand-primary-muted to-brand-primary-light transition-opacity duration-300",
        width > 0 ? "opacity-100" : "opacity-0",
      )}
      style={{ width: `${width}%` }}
      aria-hidden
    />
  )
}
