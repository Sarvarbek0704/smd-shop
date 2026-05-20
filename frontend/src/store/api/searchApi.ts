import { apiSlice } from './apiSlice';

export const searchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchProducts: builder.query({
      query: (params) => ({
        url: '/search',
        params,
      }),
    }),
    getAutocomplete: builder.query<string[], string>({
      query: (q) => ({
        url: '/search/autocomplete',
        params: { q },
      }),
    }),
    getPopularSearches: builder.query<string[], void>({
      query: () => '/search/popular',
    }),
  }),
});

export const {
  useSearchProductsQuery,
  useGetAutocompleteQuery,
  useGetPopularSearchesQuery,
} = searchApi;
