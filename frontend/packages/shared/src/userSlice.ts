import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransportMode } from './types';

export interface UserLocation {
  lat: number;
  lng: number;
  // Human-readable source of the fix, e.g. a manually chosen neighbourhood
  // when GPS is denied (Story 2.2). Absent for real GPS fixes.
  label?: string;
}

export interface UserFilters {
  travelMethods: TransportMode[];
  cuisines: string[];
}

export interface UserState {
  location: UserLocation | null;
  locationError: string | null;
  filters: UserFilters;
}

const initialState: UserState = {
  location: null,
  locationError: null,
  filters: {
    travelMethods: ['walking'],
    cuisines: [],
  },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLocation(state, action: PayloadAction<UserLocation>) {
      state.location = action.payload;
      state.locationError = null;
    },
    setLocationError(state, action: PayloadAction<string>) {
      state.locationError = action.payload;
    },
    // Used when the user disables location in settings.
    clearLocation(state) {
      state.location = null;
      state.locationError = null;
    },
    toggleTravelMethod(state, action: PayloadAction<TransportMode>) {
      const i = state.filters.travelMethods.indexOf(action.payload);
      if (i >= 0) {
        state.filters.travelMethods.splice(i, 1);
      } else {
        state.filters.travelMethods.push(action.payload);
      }
    },
    toggleCuisine(state, action: PayloadAction<string>) {
      const i = state.filters.cuisines.indexOf(action.payload);
      if (i >= 0) {
        state.filters.cuisines.splice(i, 1);
      } else {
        state.filters.cuisines.push(action.payload);
      }
    },
  },
});

export const { setLocation, setLocationError, clearLocation, toggleTravelMethod, toggleCuisine } = userSlice.actions;
export default userSlice.reducer;
