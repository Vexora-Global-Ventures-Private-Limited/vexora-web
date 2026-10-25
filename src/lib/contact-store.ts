"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type ContactChannel = "call" | "whatsapp" | "callback" | "site_visit" | "enquiry_form"

export type SubmittedLead = {
  id: string
  propertyId: string
  channel: ContactChannel
  buyerName: string
  buyerPhone: string
  createdAt: string
  /** Decided once, at creation, from the seller's membership state — never recomputed. */
  delivered: boolean
}

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

// Seeded so a buyer's Enquiries tab isn't empty on first load — same idiom
// as SEED_NOTIFICATIONS and the seller-side `leads` array. Doesn't touch
// `freeContactsUsed`, so a Free demo buyer still has both real contacts free
// to try the flow with.
const SEED_LEADS: SubmittedLead[] = [
  { id: "LD-DEMO-9001", propertyId: "p1", channel: "whatsapp", buyerName: "Priya Desai", buyerPhone: "+91 98765 43210", createdAt: "2026-07-15T10:20:00.000Z", delivered: true },
  { id: "LD-DEMO-9002", propertyId: "p3", channel: "site_visit", buyerName: "Priya Desai", buyerPhone: "+91 98765 43210", createdAt: "2026-07-13T15:05:00.000Z", delivered: true },
  { id: "LD-DEMO-9003", propertyId: "p6", channel: "call", buyerName: "Priya Desai", buyerPhone: "+91 98765 43210", createdAt: "2026-07-10T09:40:00.000Z", delivered: true },
]

export const CHANNEL_LABEL: Record<ContactChannel, string> = {
  call: "Called owner",
  whatsapp: "Messaged on WhatsApp",
  callback: "Requested a callback",
  site_visit: "Booked a site visit",
  enquiry_form: "Sent an enquiry",
}

type ContactState = {
  freeContactsUsed: number
  submittedLeads: SubmittedLead[]
  apiLeads: ApiSentLead[]
  recordApiLead: (lead: ApiSentLead) => void
  clearApiLeads: () => void
  /** `${accountId}:${listingId}` pairs already reported from this device — the backend accepts repeat reports. */
  reportedListings: string[]
  markReported: (accountId: string, listingId: string) => void
  submitContact: (args: {
    propertyId: string
    channel: ContactChannel
    buyerName: string
    buyerPhone: string
    sellerMembershipActive: boolean
    /** Members (Mercury/Jupiter/Venus) have no contact quota — only Free Users do. */
    hasQuota: boolean
  }) => { ok: true } | { ok: false; reason: "quota_exhausted" }
}

/**
 * Mock buyer-side contact/lead store. There's no real backend here — this is
 * a client-persisted demo of the docs' "2 lifetime free contacts" +
 * "delivered vs undelivered" rules, so the effect of contacting a listing is
 * visible across the TierSwitcher demo control (contact as a buyer, switch
 * to Mercury/Jupiter/Venus, see the lead show up correctly tagged).
 */
export const useContactStore = create<ContactState>()(
  persist(
    (set, get) => ({
      freeContactsUsed: 0,
      submittedLeads: SEED_LEADS,
      apiLeads: [],

      recordApiLead: (lead) =>
        set((state) => ({ apiLeads: [lead, ...state.apiLeads.filter((l) => l.leadId !== lead.leadId)] })),

      clearApiLeads: () => set({ apiLeads: [] }),

      reportedListings: [],
      markReported: (accountId, listingId) =>
        set((state) => ({ reportedListings: [...new Set([...state.reportedListings, `${accountId}:${listingId}`])] })),

      submitContact: ({ propertyId, channel, buyerName, buyerPhone, sellerMembershipActive, hasQuota }) => {
        if (hasQuota && get().freeContactsUsed >= FREE_CONTACT_LIMIT) {
          return { ok: false, reason: "quota_exhausted" }
        }

        const lead: SubmittedLead = {
          id: `LD-DEMO-${Date.now()}`,
          propertyId,
          channel,
          buyerName,
          buyerPhone,
          createdAt: new Date().toISOString(),
          delivered: sellerMembershipActive,
        }

        set((state) => ({
          freeContactsUsed: hasQuota ? state.freeContactsUsed + 1 : state.freeContactsUsed,
          submittedLeads: [...state.submittedLeads, lead],
        }))

        return { ok: true }
      },
    }),
    {
      name: "vxp-contact-demo",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
)
