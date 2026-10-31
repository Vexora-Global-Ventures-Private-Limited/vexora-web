"use client"

import { useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  images: string[]
  /** Open at this photo; null = closed. */
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
  title?: string
}

/**
 * Full-screen photo carousel: arrows, ← → / Esc, swipe on touch screens,
 * and a thumbnail strip. Same look as the property page's gallery. Plain
 * <img> so photos from any https host (Cloudinary, pasted links) work.
 */
export function PhotoLightbox({ images, index, onIndexChange, onClose, title }: Props) {
  const open = index !== null && images.length > 0
  const current = open ? Math.min(index, images.length - 1) : 0
  const count = images.length
  const touchStartX = useRef<number | null>(null)
  const thumbStrip = useRef<HTMLDivElement>(null)

  const go = (delta: number) => onIndexChange((current + delta + count) % count)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onIndexChange((current - 1 + count) % count)
      else if (e.key === "ArrowRight") onIndexChange((current + 1) % count)
      else if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
    }
  }, [open, current, count, onIndexChange, onClose])

  // Keep the active thumbnail in view.
  useEffect(() => {
    if (!open) return
    thumbStrip.current?.querySelector<HTMLElement>(`[data-index="${current}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" })
  }, [open, current])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-ink-black/97 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={title ? `${title} photos` : "Photos"}
          onClick={onClose}
        >
          <div className="flex items-center justify-between px-6 py-4 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold">
              {title} <span className="font-normal text-white/50">{title ? "— " : ""}{current + 1} / {count}</span>
            </div>
            <button onClick={onClose} className="grid h-10 w-10 place-items-center border border-white/20 text-white hover:bg-white/10" aria-label="Close photos">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="relative min-h-0 flex-1 px-4 sm:px-16"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current
              touchStartX.current = null
              if (start === null || count < 2) return
              const dx = e.changedTouches[0].clientX - start
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
            }}
          >
            {count > 1 && (
              <button
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/20 bg-ink-black/60 text-white hover:bg-white/10 sm:left-4"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <AnimatePresence mode="wait">
              <motion.img
                key={current}
                src={images[current]}
                alt={`${title ? `${title} — ` : ""}photo ${current + 1}`}
                referrerPolicy="no-referrer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full select-none object-contain"
                draggable={false}
              />
            </AnimatePresence>
            {count > 1 && (
              <button
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center border border-white/20 bg-ink-black/60 text-white hover:bg-white/10 sm:right-4"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {count > 1 && (
            <div ref={thumbStrip} className="flex justify-center gap-2 overflow-x-auto px-6 pt-4" onClick={(e) => e.stopPropagation()}>
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  data-index={i}
                  onClick={() => onIndexChange(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === current}
                  className={cn(
                    "h-14 w-20 shrink-0 overflow-hidden ring-2 transition",
                    i === current ? "ring-brand-primary" : "opacity-50 ring-transparent hover:opacity-100",
                  )}
                >
                  <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <p className="px-6 py-3 text-center text-[11px] text-white/45" onClick={(e) => e.stopPropagation()}>
            Use ← → or swipe to browse · Esc to close
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
