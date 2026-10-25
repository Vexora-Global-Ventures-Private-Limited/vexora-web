"use client"

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import { EASE_OUT } from "@/lib/motion-tokens"

const SEEN_KEY = "vxp-preloader-seen"

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1"
  } catch {
    return false
  }
}

/**
 * Cinematic entry — full ink curtain, masked wordmark reveal,
 * hairline progress. Exits by lifting like a stage curtain.
 *
 * Plays once per browser session (it lives in the root layout, so without
 * this every hard navigation — a shared link, a refresh on the dashboard —
 * would sit behind a 1.6s curtain), and never for reduced-motion users.
 */
export function Preloader() {
  const reduce = useReducedMotion()
  const [done, setDone] = useState(() => reduce === true)
  const [pct, setPct] = useState(0)

  const finish = useCallback(() => {
    setDone(true)
    try {
      sessionStorage.setItem(SEEN_KEY, "1")
    } catch {
      // Storage blocked — it'll just play again next load.
    }
  }, [])

  useEffect(() => {
    if (done) return
    let frame = 0
    let exitTimer: ReturnType<typeof setTimeout> | undefined
    // useReducedMotion() is null on the first render and only resolves
    // after mount, so this has to react to it here — returning early on
    // `reduce` without finishing left reduced-motion users stuck behind the
    // curtain until they clicked it.
    if (reduce || alreadySeen()) {
      frame = requestAnimationFrame(finish)
      return () => cancelAnimationFrame(frame)
    }
    const start = performance.now()
    const duration = 1400
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // ease the counter so it lingers briefly near the end
      setPct(Math.round((1 - Math.pow(1 - t, 2.2)) * 100))
      if (t < 1) frame = requestAnimationFrame(tick)
      else exitTimer = setTimeout(finish, 240)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(exitTimer)
    }
  }, [reduce, done, finish])

  useEffect(() => {
    if (done) return
    const skip = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") finish()
    }
    window.addEventListener("keydown", skip)
    return () => window.removeEventListener("keydown", skip)
  }, [done, finish])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          role="status"
          aria-label="Loading VXP"
          onClick={finish}
          className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-ink-cinema"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        >
          <div className="overflow-hidden">
            <motion.p
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.0, delay: 0.1, ease: EASE_OUT }}
              className="font-serif text-5xl font-semibold tracking-[0.08em] text-paper-ivory sm:text-7xl"
            >
              VXP
            </motion.p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-4 text-[10px] font-semibold uppercase tracking-[0.42em] text-brand-primary-light"
          >
            Elite Real Estate
          </motion.p>

          <div className="mt-12 w-[min(280px,70vw)]">
            <div className="h-px w-full bg-white/12">
              <motion.div
                className="h-full bg-brand-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.2em] text-white/38">
              <span>Mumbai · Pune · Bengaluru</span>
              <span className="tabular-nums text-white/60">{pct}%</span>
            </div>
          </div>

          <span className="sr-only">Press Escape to skip</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
