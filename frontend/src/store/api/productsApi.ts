import { apiSlice } from './apiSlice';

export const productsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params?: Record<string, unknown>) => ({
        url: '/products',
        params: params ?? {},
      }),
      providesTags: ['Products'],
    }),

    getProductBySlug: builder.query({
      query: (slug: string) => `/products/slug/${slug}`,
      providesTags: (_res: any, _err: any, slug: string) => [
        { type: 'Product' as const, id: slug },
      ],
    }),

    searchProducts: builder.query({
      query: (params: Record<string, unknown>) => ({
        url: '/search',
        params,
      }),
    }),

    autocomplete: builder.query({
      query: (q: string) => ({
        url: '/search/autocomplete',
        params: { q },
      }),
    }),

    getTrending: builder.query({
      query: () => '/recommendations/trending',
    }),

    getSimilar: builder.query({
      query: (productId: string) =>
        `/recommendations/similar/${productId}`,
    }),

    getRecentlyViewed: builder.query({
      query: () => '/recommendations/recently-viewed',
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useSearchProductsQuery,
  useAutocompleteQuery,
  useGetTrendingQuery,
  useGetSimilarQuery,
  useGetRecentlyViewedQuery,
} = productsApiSlice;