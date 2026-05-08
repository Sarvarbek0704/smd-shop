import { apiSlice } from './apiSlice';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    isVerified: boolean;
    roles: string[];
  };
}

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    loginEmail: builder.mutation({
      query: (body: { email: string; password: string }) => ({
        url: '/auth/login/email',
        method: 'POST',
        body,
      }),
    }),

    registerEmail: builder.mutation({
      query: (body: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
      }) => ({
        url: '/auth/register/email',
        method: 'POST',
        body,
      }),
    }),

    verifyEmail: builder.mutation({
      query: (body: { email: string; code: string }) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body,
      }),
    }),

    resendVerification: builder.mutation({
      query: (body: { email: string }) => ({
        url: '/auth/resend-verification-email',
        method: 'POST',
        body,
      }),
    }),

    requestPhoneOtp: builder.mutation({
      query: (body: { phone: string; purpose: string }) => ({
        url: '/auth/phone/request-otp',
        method: 'POST',
        body,
      }),
    }),

    verifyPhoneOtp: builder.mutation({
      query: (body: Record<string, unknown>) => ({
        url: '/auth/phone/verify-otp',
        method: 'POST',
        body,
      }),
    }),

    forgotPassword: builder.mutation({
      query: (body: { email: string }) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation({
      query: (body: { token: string; password: string }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),

    logoutApi: builder.mutation({
      query: (body: { refreshToken: string }) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginEmailMutation,
  useRegisterEmailMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useRequestPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutApiMutation,
} = authApiSlice;