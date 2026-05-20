import { apiSlice } from './apiSlice';

export const reviewsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProductReviews: builder.query({
      query: ({ productId, ...params }: { productId: string } & Record<string, unknown>) => ({
        url: `/reviews/product/${productId}`,
        params,
      }),
      providesTags: ['Reviews'],
    }),

    createReview: builder.mutation({
      query: (body: {
        productId: string;
        orderId: string;
        rating: number;
        title?: string;
        body?: string;
      }) => ({
        url: '/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Reviews', 'Product'],
    }),

    updateReview: builder.mutation({
      query: ({ id, ...body }: { id: string } & Record<string, unknown>) => ({
        url: `/reviews/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Reviews'],
    }),

    deleteReview: builder.mutation({
      query: (id: string) => ({
        url: `/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reviews', 'Product'],
    }),

    sellerReply: builder.mutation({
      query: ({ id, reply }: { id: string; reply: string }) => ({
        url: `/reviews/${id}/seller-reply`,
        method: 'POST',
        body: { reply },
      }),
      invalidatesTags: ['Reviews'],
    }),

    getSellerReviews: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: '/reviews/seller',
        params: params ?? {},
      }),
      providesTags: ['Reviews'],
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useSellerReplyMutation,
  useGetSellerReviewsQuery,
} = reviewsApiSlice;
