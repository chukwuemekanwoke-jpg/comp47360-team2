import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { tableApi } from './apiSlice';

export const store = configureStore({
  reducer: {
    [tableApi.reducerPath]: tableApi.reducer,
    // TODO add other slices, including auth
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tableApi.middleware),
});

// Required for refetchOnFocus and refetchOnReconnect capabilities
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;