import { configureStore } from '@reduxjs/toolkit';
// Resolving up from src/ to the shared monorepo directory
import { tableApi } from '../../packages/shared/src/apiSlice.ts';

export const store = configureStore({
  reducer: {
    [tableApi.reducerPath]: tableApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tableApi.middleware),
});