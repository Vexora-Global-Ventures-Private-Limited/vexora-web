"use client"

import { useEffect } from "react"
import { useNav } from "@/lib/nav-store"
import { useContactStore } from "@/lib/contact-store"
import { useNotificationsStore } from "@/lib/notifications-store"
import { useListingsStore } from "@/lib/listings-store"
import { useLeadsStore } from "@/lib/leads-store"
import { useProjectsStore } from "@/lib/projects-store"
import { useShortlistStore } from "@/lib/shortlist-store"

/** Rehydrates the persisted mock session + demo state after mount (persist uses skipHydration to avoid SSR mismatch). */
export function SessionHydrator() {
  useEffect(() => {
    useNav.persist?.rehydrate()
    useContactStore.persist?.rehydrate()
    useNotificationsStore.persist?.rehydrate()
    useListingsStore.persist?.rehydrate()
    useLeadsStore.persist?.rehydrate()
    useProjectsStore.persist?.rehydrate()
    useShortlistStore.persist?.rehydrate()
  }, [])

  return null
}
