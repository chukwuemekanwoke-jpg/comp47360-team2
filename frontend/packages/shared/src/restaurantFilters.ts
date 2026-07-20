import { RestaurantSummary } from './types';
import { UserFilters } from './userSlice';

// Busyness tiers shared by every surface (cards, map markers, callouts,
// filter chips). Scores are 0..1 straight from the API.
export const BUSYNESS_QUIET_MAX = 0.4;
export const BUSYNESS_BUSY_MAX = 0.7;

export function busynessLabel(score: number): string {
  if (score < BUSYNESS_QUIET_MAX) return 'Quiet';
  if (score < BUSYNESS_BUSY_MAX) return 'Busy';
  return 'Packed';
}

export function busynessColor(score: number): string {
  if (score < BUSYNESS_QUIET_MAX) return '#10b981';
  if (score < BUSYNESS_BUSY_MAX) return '#f59e0b';
  return '#ef4444';
}

// Single client-side filter pipeline used by the map, list and discover
// views so they always agree on what "filtered" means. Runs over the cached
// nearby-restaurants response — never triggers a new request.
export function applyRestaurantFilters(
  restaurants: RestaurantSummary[],
  filters: Pick<UserFilters, 'cuisines' | 'searchQuery' | 'maxBusyness'>
): RestaurantSummary[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return restaurants.filter((r) => {
    if (filters.cuisines.length > 0 && !filters.cuisines.includes(r.cuisine.toLowerCase())) {
      return false;
    }
    if (filters.maxBusyness !== null && r.busynessScore > filters.maxBusyness) {
      return false;
    }
    if (
      query &&
      !r.name.toLowerCase().includes(query) &&
      !r.cuisine.toLowerCase().includes(query) &&
      !r.neighborhood.toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  });
}

// How many of the user's filters are currently narrowing results — used for
// the badge on collapsed filter toggles so filtering is never invisible.
export function activeFilterCount(
  filters: Pick<UserFilters, 'cuisines' | 'searchQuery' | 'maxBusyness'>
): number {
  return (
    (filters.cuisines.length > 0 ? 1 : 0) +
    (filters.maxBusyness !== null ? 1 : 0) +
    (filters.searchQuery.trim() !== '' ? 1 : 0)
  );
}
