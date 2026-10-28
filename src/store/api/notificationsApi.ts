import { baseApi } from "./baseApi"

export type ApiNotification = {
  id: string
  eventKey: string
  title: string
  body: string
  /** Shape varies per eventKey — don't assume one fixed payload. */
  payload: Record<string, unknown> | null
  read: boolean
  readAt: string | null
  createdAt: string
}

export type NotificationPreference = {
  eventKey: string
  domain: string
  /** Only lists channels this event actually supports. */
  channels: { email?: boolean; whatsapp?: boolean }
}

/**
 * Every notification template on dev is still a seed placeholder (admin
 * UNRESOLVED #50), so a brand-new user's first bell item read "Auth Welcome —
 * Default template for auth.welcome on in_app". Until real copy is written
 * in the admin Templates screen, placeholder text is swapped for readable
 * copy here. Real (edited) templates pass through untouched.
 */
const FALLBACK_COPY: Record<string, { title: string; body: string }> = {
  "auth.welcome": { title: "Welcome to VXP", body: "Your account is ready. Complete your profile to start contacting owners." },
  "auth.login_new_device": { title: "New sign-in to your account", body: "Your account was just signed in to from a new device." },
  "leads.new_received": { title: "New enquiry on your listing", body: "A buyer has contacted you about one of your listings." },
  "listing.expiry_reminder": { title: "Your listing expires soon", body: "Renew it to keep it visible to buyers." },
  "membership.expiry_reminder": { title: "Your membership expires soon", body: "Renew to keep your listings and leads active." },
}

const isPlaceholderBody = (body: string | null | undefined) => !body || /^default template for /i.test(body.trim())

// "auth.welcome" → "Auth Welcome" — what the backend sends as a title when no real template exists.
const autoTitle = (eventKey: string) =>
  eventKey.split(/[._]/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

function readableNotification(n: ApiNotification): ApiNotification {
  const fallback = FALLBACK_COPY[n.eventKey]
  const placeholderTitle = !n.title || n.title === autoTitle(n.eventKey)
  return {
    ...n,
    title: placeholderTitle ? fallback?.title ?? autoTitle(n.eventKey) : n.title,
    body: isPlaceholderBody(n.body) ? fallback?.body ?? "" : n.body,
  }
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Flat `read` filter, real cursor pagination.
    getNotifications: builder.query<{ notifications: ApiNotification[]; nextCursor: string | null }, { read?: boolean; cursor?: string; limit?: number }>({
      query: (params) => ({
        url: "/api/v1/notifications",
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)),
      }),
      transformResponse: (res: { data: { notifications: ApiNotification[]; nextCursor: string | null } }) => ({
        ...res.data,
        notifications: res.data.notifications.map(readableNotification),
      }),
      providesTags: ["Notifications"],
    }),
    getUnreadCount: builder.query<number, void>({
      query: () => ({ url: "/api/v1/notifications/unread-count" }),
      transformResponse: (res: { data: { count: number } }) => res.data.count,
      providesTags: ["Notifications"],
    }),
    // Exactly one of ids / all.
    markNotificationsRead: builder.mutation<{ updated: number }, { ids: string[] } | { all: true }>({
      query: (body) => ({ url: "/api/v1/notifications/mark-read", method: "POST", body }),
      transformResponse: (res: { data: { updated: number } }) => res.data,
      invalidatesTags: ["Notifications"],
    }),
    // Only suppressible events are listed — transactional ones can't be turned off.
    getNotificationPreferences: builder.query<NotificationPreference[], void>({
      query: () => ({ url: "/api/v1/notifications/preferences" }),
      transformResponse: (res: { data: { preferences: NotificationPreference[] } }) => res.data.preferences,
      providesTags: ["NotificationPrefs"],
    }),
    // Optimistic: the toggle flips immediately and is rolled back if the
    // PATCH fails, instead of waiting a full refetch round-trip per click.
    updateNotificationPreferences: builder.mutation<unknown, Record<string, { email?: boolean; whatsapp?: boolean }>>({
      query: (body) => ({ url: "/api/v1/notifications/preferences", method: "PATCH", body }),
      async onQueryStarted(body, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationsApi.util.updateQueryData("getNotificationPreferences", undefined, (prefs) => {
            for (const pref of prefs) {
              const change = body[pref.eventKey]
              if (change) pref.channels = { ...pref.channels, ...change }
            }
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: (_r, error) => (error ? ["NotificationPrefs"] : []),
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationsReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationsApi
