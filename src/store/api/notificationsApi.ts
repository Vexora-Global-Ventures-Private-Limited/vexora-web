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

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Flat `read` filter, real cursor pagination.
    getNotifications: builder.query<{ notifications: ApiNotification[]; nextCursor: string | null }, { read?: boolean; cursor?: string; limit?: number }>({
      query: (params) => ({
        url: "/api/v1/notifications",
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)),
      }),
      transformResponse: (res: { data: { notifications: ApiNotification[]; nextCursor: string | null } }) => res.data,
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
