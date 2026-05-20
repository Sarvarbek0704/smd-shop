import { apiSlice } from './apiSlice';

export const cartApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),

    addToCart: builder.mutation({
      query: (body: {
        productId: string;
        variantId?: string;
        quantity?: number;
      }) => ({
        url: '/cart/items',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cart'],
    }),

    updateCartItem: builder.mutation({
      query: ({ itemId, quantity }: { itemId: string; quantity: number }) => ({
        url: `/cart/items/${itemId}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),

    removeCartItem: builder.mutation({
      query: (itemId: string) => ({
        url: `/cart/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),

    clearCart: builder.mutation({
      query: () => ({ url: "/cart", method: "DELETE" }),
      invalidatesTags: ["Cart"],
    }),

    applyCoupon: builder.mutation({
      query: (code: string) => ({
        url: "/cart/apply-coupon",
        method: "POST",
        body: { code },
      }),
      invalidatesTags: ["Cart"],
    }),

    removeCoupon: builder.mutation({
      query: () => ({
        url: "/cart/remove-coupon",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
} = cartApiSlice;