"use client"

import { useSessionGuard } from "@/lib/use-session-guard"
import { ROUTES } from "@/lib/routes"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { ready, user } = useSessionGuard((u) => !!u, ROUTES.login)

  if (!ready || !user) return null

  return <>{children}</>
}
