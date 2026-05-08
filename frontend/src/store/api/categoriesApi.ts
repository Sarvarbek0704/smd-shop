import { apiSlice } from './apiSlice';

export const categoriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategoryTree: builder.query({
      query: () => '/categories/tree',
      providesTags: ['Categories'],
    }),

    getCategoryBySlug: builder.query({
      query: (slug: string) => `/categories/slug/${slug}`,
    }),
  }),
});

export const {
  useGetCategoryTreeQuery,
  useGetCategoryBySlugQuery,
} = categoriesApiSlice;