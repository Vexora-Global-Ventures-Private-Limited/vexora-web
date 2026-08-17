"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Lead, LeadStage } from "@/lib/dashboard-data"

type LeadOverride = {
  stage?: LeadStage
  notes?: string
}

type LeadsState = {
  overrides: Record<string, LeadOverride>
  setStage: (id: string, stage: LeadStage) => void
  setNotes: (id: string, notes: string) => void
}

/**
 * Mock lead-edit store. There's no real backend here — this holds
 * client-persisted overrides keyed by lead id, layered onto the
 * seeded/submitted leads from `getMergedLeads()` at read time, so a member
 * changing a lead's stage or notes actually sticks instead of resetting on
 * every render.
 */
export const useLeadsStore = create<LeadsState>()(
  persist(
    (set) => ({
      overrides: {},

      setStage: (id, stage) =>
        set((state) => ({
          overrides: { ...state.overrides, [id]: { ...state.overrides[id], stage } },
        })),

      setNotes: (id, notes) =>
        set((state) => ({
          overrides: { ...state.overrides, [id]: { ...state.overrides[id], notes } },
        })),
    }),
    {
      name: "vxp-lead-overrides",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
)

export function applyLeadOverrides(lead: Lead, overrides: Record<string, LeadOverride>): Lead {
  const o = overrides[lead.id]
  return o ? { ...lead, ...o } : lead
}
