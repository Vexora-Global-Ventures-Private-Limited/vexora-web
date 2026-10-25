"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useSessionGuard } from "@/lib/use-session-guard"
import { ROUTES } from "@/lib/routes"
import { useGetProfileQuery, missingProfileFields } from "@/store/api/usersApi"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PortalGuard>{children}</PortalGuard>
    </Suspense>
  )
}

function PortalGuard({ children }: { children: React.ReactNode }) {
  const { ready, user } = useSessionGuard((u) => !!u, ROUTES.login)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Profile completion is compulsory (product rule — profile-options.ts), so
  // an account that skipped the signup profile step (closed the tab, typed a
  // URL) is sent back to finish it. Settings stays reachable so the user can
  // still sign out or delete the account.
  const isSettings = pathname === ROUTES.dashboard && searchParams.get("tab") === "settings"
  const { data: profile, isError } = useGetProfileQuery(undefined, { skip: !ready || !user?.id })
  const incomplete = !!profile && !!user && missingProfileFields(profile, { phone: user.phone, email: user.email }).length > 0
  const mustComplete = incomplete && !isSettings

  useEffect(() => {
    if (!mustComplete) return
    const query = searchParams.toString()
    const returnTo = query ? `${pathname}?${query}` : pathname
    router.replace(`${ROUTES.signup}?${new URLSearchParams({ step: "profile", returnTo })}`)
  }, [mustComplete, pathname, searchParams, router])

  // Hold the page until the check has run, so it never flashes before a
  // redirect. A failed profile fetch doesn't lock anyone out of the portal.
  const checking = !!user?.id && !profile && !isError
  if (!ready || !user || checking || mustComplete) return null

  return <>{children}</>
}
