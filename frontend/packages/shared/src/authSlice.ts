import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  userId: string | null;
  token: string | null;
  displayName: string | null;
}

const initialState: AuthState = {
  userId: null,
  token: null,
  displayName: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Full JWT session from POST /auth/login or /auth/register.
    setSession(
      state,
      action: PayloadAction<{ userId: string; token: string; displayName?: string | null }>
    ) {
      state.userId = action.payload.userId;
      state.token = action.payload.token;
      state.displayName = action.payload.displayName ?? null;
    },
    clearSession(state) {
      state.userId = null;
      state.token = null;
      state.displayName = null;
    },
    // Legacy X-User-Id flows (no JWT). Prefer setSession.
    setUserId(state, action: PayloadAction<string>) {
      state.userId = action.payload;
    },
    clearUserId(state) {
      state.userId = null;
    },
  },
});

export const { setSession, clearSession, setUserId, clearUserId } = authSlice.actions;
export default authSlice.reducer;
