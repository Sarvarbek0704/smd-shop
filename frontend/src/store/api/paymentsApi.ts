import { apiSlice } from './apiSlice';

export const paymentsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<
      { paymentUrl: string; token: string; expiresAt: string },
      string
    >({
      query: (orderId) => ({ url: `/payments/initiate/${orderId}`, method: 'POST' }),
      invalidatesTags: ['Payments'],
    }),

    getPaymentStatus: builder.query<any, string>({
      query: (orderId) => `/payments/status/${orderId}`,
      providesTags: ['Payments'],
    }),

    retryPayment: builder.mutation<
      { paymentUrl: string; token: string; expiresAt: string },
      string
    >({
      query: (orderId) => ({ url: `/payments/retry/${orderId}`, method: 'POST' }),
      invalidatesTags: ['Payments'],
    }),

    getSimulatorInfo: builder.query<
      { orderId: string; provider: string; amount: number; expiresAt: string },
      string
    >({
      query: (token) => `/payments/simulate/${token}/info`,
    }),

    processSimulation: builder.mutation<
      { success: boolean; redirectUrl: string },
      { token: string; action: 'pay' | 'cancel' }
    >({
      query: ({ token, action }) => ({
        url: `/payments/simulate/${token}`,
        method: 'POST',
        body: { action },
      }),
      invalidatesTags: ['Payments', 'Orders'],
    }),

    getAllPayments: builder.query<any, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 20 } = {}) =>
        `/payments/admin/all?page=${page}&limit=${limit}`,
      providesTags: ['Payments'],
    }),

    refundPayment: builder.mutation<any, { orderId: string; reason?: string }>({
      query: ({ orderId, reason }) => ({
        url: `/payments/admin/${orderId}/refund`,
        method: 'POST',
        body: { reason: reason ?? 'Admin refund' },
      }),
      invalidatesTags: ['Payments', 'Orders'],
    }),
  }),
});

export const {
  useInitiatePaymentMutation,
  useGetPaymentStatusQuery,
  useRetryPaymentMutation,
  useGetSimulatorInfoQuery,
  useProcessSimulationMutation,
  useGetAllPaymentsQuery,
  useRefundPaymentMutation,
} = paymentsApiSlice;
