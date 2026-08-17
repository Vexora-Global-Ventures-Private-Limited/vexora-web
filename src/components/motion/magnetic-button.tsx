"use client"

import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion"
import { useRef, type ReactNode, type MouseEvent } from "react"

type Props = {
  children: ReactNode
  className?: string
  /** Strength of the magnetic pull (0–1). Default 0.3 */
  strength?: number
  onClick?: () => void
  as?: "button" | "a"
  href?: string
}

/**
 * Magnetic button — element drifts towards the cursor on hover.
 * Useful for premium CTAs.
 */
export function MagneticButton({
  children,
  className,
  strength = 0.3,
  onClick,
  as = "button",
  href,
}: Props) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 15, mass: 0.3 })
  const sy = useSpring(y, { stiffness: 200, damping: 15, mass: 0.3 })

  const handleMove = (e: MouseEvent<HTMLElement>) => {
    if (reduce || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const mx = e.clientX - (rect.left + rect.width / 2)
    const my = e.clientY - (rect.top + rect.height / 2)
    x.set(mx * strength)
    y.set(my * strength)
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }

  const MotionTag = motion[as] as typeof motion.a
  return (
    <MotionTag
      ref={ref as never}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      href={href}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </MotionTag>
  )
}
