import { apiSlice } from './apiSlice';

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => '/users/me',
      providesTags: ['User'],
    }),

    updateMe: builder.mutation({
      query: (body: Record<string, unknown>) => ({
        url: '/users/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    uploadAvatar: builder.mutation({
      query: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/users/me/avatar',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['User'],
    }),

    changePassword: builder.mutation({
      query: (body: { currentPassword: string; newPassword: string }) => ({
        url: '/users/me/change-password',
        method: 'POST',
        body,
      }),
    }),

    applyToBeSeller: builder.mutation({
      query: (body: { storeName: string; storeDescription: string }) => ({
        url: '/users/me/apply-seller',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useUploadAvatarMutation,
  useChangePasswordMutation,
  useApplyToBeSellerMutation,
} = usersApiSlice;
