"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"
import { type ReactNode } from "react"
import { EASE_OUT, MOTION, REVEAL } from "@/lib/motion-tokens"

type Direction = "up" | "down" | "left" | "right" | "none"

const offset = (dir: Direction, distance: number) => {
  switch (dir) {
    case "up":
      return { y: distance }
    case "down":
      return { y: -distance }
    case "left":
      return { x: distance }
    case "right":
      return { x: -distance }
    default:
      return {}
  }
}

type RevealProps = {
  children: ReactNode
  direction?: Direction
  distance?: number
  delay?: number
  duration?: number
  once?: boolean
  margin?: string
  index?: number
  staggerStep?: number
  className?: string
  as?: "div" | "span" | "li" | "section" | "article" | "h2" | "h3" | "p"
}

export function Reveal({
  children,
  direction = "up",
  distance = REVEAL.distance,
  delay = 0,
  duration = REVEAL.duration,
  once = true,
  margin = REVEAL.viewportMargin,
  index,
  staggerStep = REVEAL.stagger,
  className,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]
  const computedDelay = index != null ? index * staggerStep : delay

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...offset(direction, distance),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reduce ? 0.01 : duration,
        delay: reduce ? 0 : computedDelay,
        ease: EASE_OUT,
      },
    },
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      variants={variants}
    >
      {children}
    </MotionTag>
  )
}

export function StaggerGroup({
  children,
  className,
  stagger = REVEAL.stagger,
  once = true,
  margin = REVEAL.viewportMargin,
}: {
  children: ReactNode
  className?: string
  stagger?: number
  once?: boolean
  margin?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduce ? 0 : stagger,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: REVEAL.distance },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: REVEAL.duration, ease: EASE_OUT },
  },
}
