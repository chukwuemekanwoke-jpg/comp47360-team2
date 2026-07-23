// Product constants — keep in sync with docs/api-contract-v0.md
import { TransportMode } from "./types";

// Discovery radius (Story 2.1): restaurants strictly within 1.5 km.
export const DISCOVERY_RADIUS_M = 1500;

// How often the nearby-restaurants list re-polls for fresh seat counts.
// Bookings/cancellations made from another client (e.g. the restaurant
// dashboard) don't invalidate this app's RTK Query cache, so without polling
// availableTableCount only updates on this client's own booking actions.
export const SEAT_AVAILABILITY_POLL_MS = 15000; 

// Available Cuisine types, used to load preference filters
// lifted from PreferenceFilters.tsx
export const CUISINES = [
  "Italian",
  "Indian",
  "Vietnamese",
  "Japanese",
  "Mexican",
  "Thai",
  "American"
];

// Available travel modes - lifted from mobile app
export const TRAVEL_METHODS: { label: string; icon: string; mode: TransportMode }[] = [
  { label: "Walking", icon: "walk-outline", mode: "walking" },
  { label: "Driving", icon: "car-outline", mode: "driving" },
  { label: "Transit", icon: "subway-outline", mode: "transit" },
  { label: "Bicycling", icon: "bicycle-outline", mode: "cycling" },
];