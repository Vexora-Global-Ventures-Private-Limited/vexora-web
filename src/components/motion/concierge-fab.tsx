"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Headset, LayoutDashboard } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { EASE_OUT, MOTION } from "@/lib/motion-tokens"

export function ConciergeFab() {
  const router = useRouter()
  const reduce = useReducedMotion()
  const user = useNav((s) => s.user)

  return (
    <motion.button
      type="button"
      aria-label={user ? "Dashboard" : "Private advisor"}
      onClick={() => router.push(user ? ROUTES.dashboard : ROUTES.login)}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: MOTION.slow, ease: EASE_OUT }}
      className="concierge-fab group fixed bottom-6 right-6 z-[55] grid h-14 w-14 place-items-center rounded-full sm:bottom-8 sm:right-8 sm:h-[3.75rem] sm:w-[3.75rem]"
    >
      <span className="concierge-fab-ring" aria-hidden />
      {user ? (
        <LayoutDashboard className="relative z-10 h-5 w-5 text-brand-secondary" strokeWidth={2.25} />
      ) : (
        <Headset className="relative z-10 h-5 w-5 text-brand-secondary" strokeWidth={2.25} />
      )}
    </motion.button>
  )
}
