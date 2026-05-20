import { apiSlice } from './apiSlice';

export const deliveryApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyDeliveries: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: '/delivery/my',
        params: params ?? {},
      }),
      providesTags: ['Delivery'],
    }),

    getDeliveryDetail: builder.query({
      query: (id: string) => `/delivery/${id}`,
      providesTags: (_res: any, _err: any, id: string) => [
        { type: 'Delivery' as const, id },
      ],
    }),

    updateDeliveryStatus: builder.mutation({
      query: ({
        id,
        status,
        notes,
      }: {
        id: string;
        status: string;
        notes?: string;
      }) => ({
        url: `/delivery/${id}/status`,
        method: 'PATCH',
        body: { status, notes },
      }),
      invalidatesTags: ['Delivery', 'Orders'],
    }),

    getDeliveryHistory: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: '/delivery/my',
        params: { ...(params ?? {}), status: 'delivered' },
      }),
      providesTags: ['Delivery'],
    }),
  }),
});

export const {
  useGetMyDeliveriesQuery,
  useGetDeliveryDetailQuery,
  useUpdateDeliveryStatusMutation,
  useGetDeliveryHistoryQuery,
} = deliveryApiSlice;
