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
  // Free-text search over name/cuisine/neighborhood; empty string = no search.
  searchQuery: string;
  // Upper bound on busynessScore (0..1); null = show any busyness.
  maxBusyness: number | null;
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
    searchQuery: '',
    maxBusyness: null,
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
    // Replace the whole cuisine selection at once (e.g. tapping a cuisine
    // tile on the discover page).
    setCuisines(state, action: PayloadAction<string[]>) {
      state.filters.cuisines = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.filters.searchQuery = action.payload;
    },
    setMaxBusyness(state, action: PayloadAction<number | null>) {
      state.filters.maxBusyness = action.payload;
    },
  },
});

export const {
  setLocation,
  setLocationError,
  clearLocation,
  toggleTravelMethod,
  toggleCuisine,
  setCuisines,
  setSearchQuery,
  setMaxBusyness,
} = userSlice.actions;
export default userSlice.reducer;
