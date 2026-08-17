"use client"

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion"
import { useRef, type ReactNode, type MouseEvent } from "react"

/**
 * 3D tilt card — element rotates slightly based on cursor position.
 * Premium interactive effect for hero banners and feature cards.
 */
export function TiltCard({
  children,
  className,
  max = 8,
  scale = 1.02,
}: {
  children: ReactNode
  className?: string
  max?: number
  scale?: number
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const s = useMotionValue(1)

  const rotateX = useSpring(rx, { stiffness: 200, damping: 18 })
  const rotateY = useSpring(ry, { stiffness: 200, damping: 18 })
  const scaleS = useSpring(s, { stiffness: 200, damping: 18 })

  // Invert for natural feel
  const transform = useTransform(
    [rotateX, rotateY, scaleS],
    ([x, y, sc]) =>
      `perspective(900px) rotateX(${x}deg) rotateY(${y}deg) scale(${sc})`,
  )

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rx.set(-py * max * 2)
    ry.set(px * max * 2)
  }

  const handleEnter = () => {
    if (reduce) return
    s.set(scale)
  }
  const handleLeave = () => {
    if (reduce) return
    rx.set(0)
    ry.set(0)
    s.set(1)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ transform }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
