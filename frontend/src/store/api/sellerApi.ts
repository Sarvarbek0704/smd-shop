import { apiSlice } from "./apiSlice";

export const sellerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSellerProducts: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: "/products/seller/my",
        params: params ?? {},
      }),
      providesTags: ["Products"],
    }),

    createProduct: builder.mutation({
      query: (body: Record<string, unknown>) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Products"],
    }),

    updateProduct: builder.mutation({
      query: ({ id, ...body }: { id: string } & Record<string, unknown>) => ({
        url: `/products/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Products"],
    }),

    deleteProduct: builder.mutation({
      query: (id: string) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products"],
    }),

    getSellerOrders: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: "/orders/seller/incoming",
        params: params ?? {},
      }),
      providesTags: ["Orders"],
    }),

    updateOrderStatus: builder.mutation({
      query: ({
        id,
        status,
        note,
      }: {
        id: string;
        status: string;
        note?: string;
      }) => ({
        url: `/orders/seller/${id}/status`,
        method: "PATCH",
        body: { status, note },
      }),
      invalidatesTags: ["Orders"],
    }),

    getSellerAnalytics: builder.query({
      query: () => "/analytics/seller",
    }),

    uploadImage: builder.mutation({
      query: ({ folder, file }: { folder: string; file: File }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/uploads/${folder}`,
          method: "POST",
          body: formData,
        };
      },
    }),

    uploadMultipleImages: builder.mutation({
      query: ({ folder, files }: { folder: string; files: File[] }) => {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        return {
          url: `/uploads/${folder}/multiple`,
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetSellerProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetSellerOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetSellerAnalyticsQuery,
  useUploadImageMutation,
  useUploadMultipleImagesMutation,
} = sellerApiSlice;
