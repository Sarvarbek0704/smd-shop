import { apiSlice } from "./apiSlice";

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboard: builder.query({
      query: () => "/analytics/dashboard",
    }),

    getAdminUsers: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: "/users",
        params: params ?? {},
      }),
      providesTags: ["User"],
    }),

    assignRole: builder.mutation({
      query: ({ userId, role }: { userId: string; role: string }) => ({
        url: `/users/${userId}/roles`,
        method: "POST",
        body: { role },
      }),
      invalidatesTags: ["User"],
    }),

    removeRole: builder.mutation({
      query: ({ userId, role }: { userId: string; role: string }) => ({
        url: `/users/${userId}/roles/${role}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    activateUser: builder.mutation({
      query: (userId: string) => ({
        url: `/users/${userId}/activate`,
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),

    deactivateUser: builder.mutation({
      query: (userId: string) => ({
        url: `/users/${userId}/deactivate`,
        method: "PATCH",
      }),
      invalidatesTags: ["User"],
    }),

    getAdminProducts: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: "/products/admin/all",
        params: params ?? {},
      }),
      providesTags: ["Products"],
    }),

    setProductStatus: builder.mutation({
      query: ({ id, status }: { id: string; status: string }) => ({
        url: `/products/${id}/status/${status}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Products"],
    }),

    getAdminOrders: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: "/orders/admin/all",
        params: params ?? {},
      }),
      providesTags: ["Orders"],
    }),

    adminUpdateOrderStatus: builder.mutation({
      query: ({
        id,
        status,
        note,
      }: {
        id: string;
        status: string;
        note?: string;
      }) => ({
        url: `/orders/admin/${id}/status`,
        method: "PATCH",
        body: { status, note },
      }),
      invalidatesTags: ["Orders"],
    }),

    getAdminCoupons: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: "/coupons",
        params: params ?? {},
      }),
    }),

    createCoupon: builder.mutation({
      query: (body: Record<string, unknown>) => ({
        url: "/coupons",
        method: "POST",
        body,
      }),
    }),

    updateCoupon: builder.mutation({
      query: ({ id, ...body }: { id: string } & Record<string, unknown>) => ({
        url: `/coupons/${id}`,
        method: "PATCH",
        body,
      }),
    }),

    deleteCoupon: builder.mutation({
      query: (id: string) => ({
        url: `/coupons/${id}`,
        method: "DELETE",
      }),
    }),

    sendPromo: builder.mutation({
      query: (body: Record<string, unknown>) => ({
        url: "/notifications/promo",
        method: "POST",
        body,
      }),
    }),

    getDeliveryStats: builder.query({
      query: () => "/analytics/delivery",
    }),

    getAllDeliveries: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: "/delivery",
        params: params ?? {},
      }),
    }),

    assignCourier: builder.mutation({
      query: ({
        deliveryId,
        courierId,
        notes,
      }: {
        deliveryId: string;
        courierId: string;
        notes?: string;
      }) => ({
        url: `/delivery/${deliveryId}/assign`,
        method: "POST",
        body: { courierId, notes },
      }),
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminUsersQuery,
  useAssignRoleMutation,
  useRemoveRoleMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useGetAdminProductsQuery,
  useSetProductStatusMutation,
  useGetAdminOrdersQuery,
  useAdminUpdateOrderStatusMutation,
  useGetAdminCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useSendPromoMutation,
  useGetDeliveryStatsQuery,
  useGetAllDeliveriesQuery,
  useAssignCourierMutation,
} = adminApiSlice;
