import { apiSlice } from './apiSlice';

export const wishlistApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: '/wishlist',
        params: params ?? {},
      }),
      providesTags: ['Wishlist'],
    }),

    addToWishlist: builder.mutation({
      query: (productId: string) => ({
        url: '/wishlist',
        method: 'POST',
        body: { productId },
      }),
      invalidatesTags: ['Wishlist'],
    }),

    removeFromWishlist: builder.mutation({
      query: (productId: string) => ({
        url: `/wishlist/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),

    checkWishlist: builder.query({
      query: (productId: string) => `/wishlist/check/${productId}`,
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useCheckWishlistQuery,
} = wishlistApiSlice;