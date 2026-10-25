"use client"

import { useEffect, useRef } from "react"

/**
 * Cinematic film-grain + vignette overlay.
 * Fixed full-screen, pointer-events:none, mix-blend overlay/soft-light.
 * Uses a canvas-rendered noise texture animated at ~24fps for film feel.
 */
export function FilmGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Disable on mobile / small screens — createImageData every frame is
    // the single biggest perf killer on low-end mobile GPUs.
    if (window.matchMedia("(max-width: 1023px)").matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    let raf = 0
    let last = 0
    const SIZE = 180 // small noise texture, scaled up via CSS
    canvas.width = SIZE
    canvas.height = SIZE
    // One buffer, refilled each frame — allocating a fresh ImageData 24
    // times a second just fed the garbage collector.
    const img = ctx.createImageData(SIZE, SIZE)
    const data = img.data

    const render = (time: number) => {
      raf = requestAnimationFrame(render)
      // Throttle to ~24fps for film feel
      if (time - last < 42) return
      last = time

      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = 18 // subtle alpha
      }
      ctx.putImageData(img, 0, 0)
    }
    raf = requestAnimationFrame(render)

    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      {/* Film grain */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[95] opacity-[0.12] mix-blend-overlay [image-rendering:pixelated]"
        style={{ width: "100vw", height: "100vh" }}
      />
      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[94]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(10,10,10,0.35) 100%)",
        }}
      />
    </>
  )
}
