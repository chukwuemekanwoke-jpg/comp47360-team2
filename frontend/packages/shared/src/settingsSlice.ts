import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeName = 'dark' | 'light';

// Session-only app settings — kept in redux (memory) on purpose, so they
// reset to defaults on every app launch. Nothing here is persisted.
interface SettingsState {
  locationEnabled: boolean;
  theme: ThemeName;
}

const initialState: SettingsState = {
  locationEnabled: true,
  theme: 'dark',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLocationEnabled(state, action: PayloadAction<boolean>) {
      state.locationEnabled = action.payload;
    },
    setTheme(state, action: PayloadAction<ThemeName>) {
      state.theme = action.payload;
    },
  },
});

export const { setLocationEnabled, setTheme } = settingsSlice.actions;
export default settingsSlice.reducer;
