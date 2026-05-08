import { apiSlice } from './apiSlice';

export const ordersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    checkout: builder.mutation({
      query: (body: Record<string, unknown>) => ({
        url: '/orders/checkout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cart', 'Orders'],
    }),

    getMyOrders: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: '/orders/my',
        params: params ?? {},
      }),
      providesTags: ['Orders'],
    }),

    getOrderDetail: builder.query({
      query: (id: string) => `/orders/my/${id}`,
    }),

    cancelOrder: builder.mutation({
      query: ({ id, reason }: { id: string; reason: string }) => ({
        url: `/orders/my/${id}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useCheckoutMutation,
  useGetMyOrdersQuery,
  useGetOrderDetailQuery,
  useCancelOrderMutation,
} = ordersApiSlice;