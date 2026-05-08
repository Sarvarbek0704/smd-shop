import { apiSlice } from './apiSlice';

export const notificationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: '/notifications',
        params: params ?? {},
      }),
      providesTags: ['Notifications'],
    }),

    getUnreadCount: builder.query({
      query: () => '/notifications/unread-count',
      providesTags: ['Notifications'],
    }),

    markAsRead: builder.mutation({
      query: (id: string) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),

    markAllRead: builder.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllReadMutation,
} = notificationsApiSlice;