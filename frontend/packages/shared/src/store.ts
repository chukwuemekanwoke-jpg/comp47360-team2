import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { tableApi } from './apiSlice';
import userReducer from './userSlice';
import authReducer from './authSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    [tableApi.reducerPath]: tableApi.reducer,
    user: userReducer,
    auth: authReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tableApi.middleware),
});

// Required for refetchOnFocus and refetchOnReconnect capabilities
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;