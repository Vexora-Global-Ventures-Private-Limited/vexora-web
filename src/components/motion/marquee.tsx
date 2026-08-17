"use client"

import { type ReactNode } from "react"

/**
 * Infinite horizontal marquee.
 * Renders two copies of children so the loop is seamless.
 */
export function Marquee({
  children,
  speedSec = 28,
  reverse = false,
  className = "",
  pauseOnHover = true,
}: {
  children: ReactNode
  /** Seconds per loop. */
  speedSec?: number
  reverse?: boolean
  className?: string
  pauseOnHover?: boolean
}) {
  return (
    <div
      className={
        "group relative flex w-full overflow-hidden " + className
      }
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div
        className="flex shrink-0 items-center gap-0 pr-0 [animation-play-state:running] group-hover:[animation-play-state:paused]"
        style={{
          animation: `marquee ${speedSec}s linear infinite ${reverse ? "reverse" : ""}`,
        }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="flex shrink-0 items-center gap-0 pr-0 [animation-play-state:running] group-hover:[animation-play-state:paused]"
        style={{
          animation: `marquee ${speedSec}s linear infinite ${reverse ? "reverse" : ""}`,
        }}
      >
        {children}
      </div>
      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  )
}
