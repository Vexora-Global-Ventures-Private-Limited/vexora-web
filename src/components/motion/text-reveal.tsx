"use client"

import { motion, useReducedMotion } from "framer-motion"
import { type ReactNode } from "react"
import { EASE_OUT } from "@/lib/motion-tokens"

/**
 * Editorial masked line reveal — each line rises out of an overflow-hidden
 * wrapper. Pass an array of lines (strings or JSX) for multi-line headlines.
 */
type LinesRevealProps = {
  lines: ReactNode[]
  as?: "h1" | "h2" | "h3" | "p" | "div"
  className?: string
  lineClassName?: string
  delay?: number
  stagger?: number
  duration?: number
  once?: boolean
  /** true = animate on mount (hero); false = animate when scrolled into view */
  immediate?: boolean
}

export function LinesReveal({
  lines,
  as: Tag = "h2",
  className = "",
  lineClassName = "",
  delay = 0,
  stagger = 0.09,
  duration = 0.9,
  once = true,
  immediate = false,
}: LinesRevealProps) {
  const reduce = useReducedMotion()

  const viewportProps = immediate
    ? { initial: "hidden" as const, animate: "visible" as const }
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once, margin: "-64px" },
      }

  return (
    <Tag className={className}>
      <motion.span
        style={{ display: "block" }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: reduce ? 0 : delay } } }}
        {...viewportProps}
      >
        {lines.map((line, i) => (
          <span key={i} className={`block overflow-hidden leading-none ${lineClassName}`}>
            <motion.span
              className="block will-change-transform"
              variants={{
                hidden: { y: "112%", rotate: 1.2 },
                visible: {
                  y: "0%",
                  rotate: 0,
                  transition: { duration: reduce ? 0.01 : duration, ease: EASE_OUT },
                },
              }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  )
}

/** Single-line masked rise — for eyebrows, labels, small headings. */
export function MaskReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.8,
  immediate = false,
  once = true,
}: {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  immediate?: boolean
  once?: boolean
}) {
  const reduce = useReducedMotion()
  const anim = {
    hidden: { y: "112%" },
    visible: {
      y: "0%",
      transition: { duration: reduce ? 0.01 : duration, delay: reduce ? 0 : delay, ease: EASE_OUT },
    },
  }
  const viewportProps = immediate
    ? { initial: "hidden" as const, animate: "visible" as const }
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once, margin: "-48px" },
      }

  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span className="block will-change-transform" variants={anim} {...viewportProps}>
        {children}
      </motion.span>
    </span>
  )
}
