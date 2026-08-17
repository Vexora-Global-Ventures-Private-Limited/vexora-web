"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type Notification = {
  id: string
  title: string
  body: string
  time: string
  read: boolean
}

const SEED_NOTIFICATIONS: Notification[] = [
  { id: "N-01", title: "New enquiry received", body: "A buyer contacted you about Lodha Bellevue — 4 BHK Sky Residence.", time: "12 min ago", read: false },
  { id: "N-02", title: "Listing approved", body: "Your listing \"Runwal Sanctuary — Lake-Facing Villa\" is now live and verified.", time: "2h ago", read: false },
  { id: "N-03", title: "Referral joined", body: "Priya Reddy joined VXP using your referral link — 30 extension days credited to your membership.", time: "5h ago", read: false },
  { id: "N-04", title: "Ad rejected", body: "Your \"Prestige Lakeside\" project promotion was rejected — brochure needs re-upload. Resubmit free.", time: "1d ago", read: true },
  { id: "N-05", title: "Membership renewal reminder", body: "Your membership renews in 14 days. Renewals are full price — no proration.", time: "2d ago", read: true },
  { id: "N-06", title: "Site visit scheduled", body: "A buyer booked a site visit for Hiranandani Estate — Signature Villa.", time: "3d ago", read: true },
  { id: "N-07", title: "Undelivered lead alert", body: "A lead arrived while your membership had lapsed. Renew to unlock the contact.", time: "6d ago", read: true },
]

type NotificationsState = {
  notifications: Notification[]
  markRead: (id: string) => void
  markAllRead: () => void
}

/**
 * Mock in-app notification center. There's no push/email backend here — this
 * is a client-persisted demo so read/unread state survives a refresh, backing
 * the "Notifications" tab and the topbar bell's unread indicator.
 */
export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: SEED_NOTIFICATIONS,
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: () =>
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
    }),
    {
      name: "vxp-notifications",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
)
