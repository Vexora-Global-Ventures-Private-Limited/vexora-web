"use client"

import { type ReactNode } from "react"
import { Reveal } from "@/components/motion/reveal"

type Props = {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  align?: "left" | "center"
  dark?: boolean
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
  className = "",
}: Props) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left"
  const eyebrowAlign = align === "center" ? "justify-center" : "justify-start"

  return (
    <div className={`max-w-3xl ${alignClass} ${className}`}>
      <Reveal direction="up">
        <div className={`mb-4 flex items-center gap-3 ${eyebrowAlign}`}>
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-brand-primary-muted" />
          <span className="text-eyebrow text-brand-primary-dark">
            {eyebrow}
          </span>
          {align === "center" && (
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-brand-primary-muted" />
          )}
        </div>
      </Reveal>
      <Reveal direction="up" delay={0.08}>
        <h2
          className={
            "text-display-section text-balance " +
            (dark ? "text-brand-tertiary" : "text-brand-secondary")
          }
        >
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal direction="up" delay={0.16}>
          <p
            className={
              "mt-5 text-body-premium sm:text-lg " +
              (dark ? "text-brand-tertiary/70" : "text-brand-secondary/65")
            }
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  )
}

/** Decorative gold-on-dark divider used between dark sections. */
export function GoldRule({ className = "" }: { className?: string }) {
  return (
    <div className={`gold-divider h-px ${className}`} />
  )
}
