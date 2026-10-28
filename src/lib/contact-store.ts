"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type ContactChannel = "call" | "whatsapp" | "callback" | "site_visit" | "enquiry_form"

/**
 * A lead this buyer created via the real POST /leads. The backend has no
 * "my sent enquiries" list (GET /users/me/enquiries is a hardcoded [] stub),
 * so the buyer side keeps its own record of lead ids and re-reads each one
 * via GET /leads/:id (which either side of a lead may call). Like the
 * shortlist, it's per-device until that route is wired up server-side.
 */
export type ApiSentLead = {
  /** The account that sent it — this device's list is shared by every account signed in on it. */
  accountId: string
  leadId: string
  listingId: string
  slug: string
  title: string
  location: string
  channel: ContactChannel
  createdAt: string
}

/**
 * This account's sent leads, newest first. Entries are tagged with the
 * sender's account id and filtered here, because the list outlives a
 * session that ends WITHOUT a normal logout (e.g. the refresh token dying
 * mid-session only clears the nav user) — the next account to sign in on
 * the same device must never see the previous one's enquiries.
 */
export function leadsForAccount(leads: ApiSentLead[], accountId: string | undefined): ApiSentLead[] {
  if (!accountId) return []
  return leads.filter((l) => l.accountId === accountId)
}

/** Message cap for POST /leads — the backend accepts any length (5000+ chars verified live), so it's enforced here. */
export const LEAD_MESSAGE_MAX = 1000

export const FREE_CONTACT_LIMIT = 2

export const CHANNEL_LABEL: Record<ContactChannel, string> = {
  call: "Called owner",
  whatsapp: "Messaged on WhatsApp",
  callback: "Requested a callback",
  site_visit: "Booked a site visit",
  enquiry_form: "Sent an enquiry",
}

type ContactState = {
  apiLeads: ApiSentLead[]
  recordApiLead: (lead: ApiSentLead) => void
  clearApiLeads: () => void
  /** `${accountId}:${listingId}` pairs already reported from this device — the backend accepts repeat reports. */
  reportedListings: string[]
  markReported: (accountId: string, listingId: string) => void
}

/**
 * Buyer-side, per-device record of real enquiries (POST /leads results) and
 * listings already reported from this device. The real contact quota and
 * lead delivery live on the server — nothing here is mock data.
 */
export const useContactStore = create<ContactState>()(
  persist(
    (set) => ({
      apiLeads: [],

      recordApiLead: (lead) =>
        set((state) => ({ apiLeads: [lead, ...state.apiLeads.filter((l) => l.leadId !== lead.leadId)] })),

      clearApiLeads: () => set({ apiLeads: [] }),

      reportedListings: [],
      markReported: (accountId, listingId) =>
        set((state) => ({ reportedListings: [...new Set([...state.reportedListings, `${accountId}:${listingId}`])] })),
    }),
    {
      name: "vxp-contact-demo",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
)
