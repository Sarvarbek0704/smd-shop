import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  isVerified: boolean;
  roles: string[];
  sellerStatus?: string | null;
  storeName?: string | null;
  storeDescription?: string | null;
  rejectedReason?: string | null;
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

// localStorage dan boshlang'ich holat
let parsed: AuthState | null = null;
try {
  const stored = localStorage.getItem('auth');
  parsed = stored ? JSON.parse(stored) : null;
} catch {
  localStorage.removeItem('auth');
}

const initialState: AuthState = {
  user: parsed?.user ?? null,
  accessToken: parsed?.accessToken ?? null,
  refreshToken: parsed?.refreshToken ?? null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<Partial<AuthState>>,
    ) => {
      if (action.payload.user !== undefined) state.user = action.payload.user;
      if (action.payload.accessToken !== undefined)
        state.accessToken = action.payload.accessToken;
      if (action.payload.refreshToken !== undefined)
        state.refreshToken = action.payload.refreshToken;

      localStorage.setItem(
        'auth',
        JSON.stringify({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        }),
      );
    },

    logOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('auth');
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  !!state.auth.accessToken;
export const selectHasRole = (role: string) => (state: { auth: AuthState }) =>
  state.auth.user?.roles?.includes(role) ?? false;