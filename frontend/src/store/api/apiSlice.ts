import {
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import { setCredentials, logOut } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: (import.meta.env.VITE_API_URL as string) ?? '/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

async function baseQueryWithReauth(
  args: any,
  api: any,
  extraOptions: any,
): Promise<any> {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult?.data) {
        const data = (refreshResult.data as any).data ?? refreshResult.data;
        api.dispatch(
          setCredentials({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }),
        );
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logOut());
      }
    } else {
      api.dispatch(logOut());
    }
  }

  if (result.data) {
    const raw = result.data as any;
    if (raw?.success && raw?.data !== undefined) {
      result.data = raw.data;
    }
  }

  return result;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'User',
    'Products',
    'Product',
    'Categories',
    'Cart',
    'Orders',
    'Wishlist',
    'Reviews',
    'Notifications',
    'Chat',
    'Delivery',
    'Banners',
    'Coupons',
    'Payments',
  ],
  endpoints: () => ({}),
});