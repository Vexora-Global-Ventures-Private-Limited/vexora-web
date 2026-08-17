"use client"

import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "framer-motion"
import { type ReactNode, useRef } from "react"

/**
 * Wraps children with a parallax effect tied to scroll position.
 * `offset` is the pixel travel distance — children move opposite to scroll.
 */
export function Parallax({
  children,
  offset = 80,
  className,
}: {
  children: ReactNode
  /** Travel distance in px. Positive = moves up slower than scroll. */
  offset?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  // Map scroll progress 0..1 to vertical travel -offset..+offset
  const y: MotionValue<string> = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0px", "0px"] : [`${offset}px`, `${-offset}px`],
  )

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  )
}
