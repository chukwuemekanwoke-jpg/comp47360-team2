import { RestaurantSummary } from "@shared/types";

// Zoom level at which the map switches from the curated overview subset to
// showing every restaurant in view. Both leaflet (web) and the native map's
// derived zoom use the same scale.
export const FULL_DETAIL_ZOOM = 15;

// How many markers to show when zoomed out past FULL_DETAIL_ZOOM.
export const MAX_OVERVIEW_MARKERS = 8;

// How many top picks get the highlighted marker treatment when zoomed in.
export const HIGHLIGHT_COUNT = 5;

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapMarkerEntry {
  restaurant: RestaurantSummary;
  highlighted: boolean;
}

// Heuristic for "most desirable": plenty of free tables and not slammed.
export function desirabilityScore(r: RestaurantSummary): number {
  const availability = Math.min(Math.max(r.availableTableCount, 0), 10) / 10;
  const calm = 1 - Math.min(Math.max(r.busynessScore, 0), 1);
  return availability * 0.6 + calm * 0.4;
}

function inBounds(r: RestaurantSummary, b: MapBounds): boolean {
  return (
    r.latitude >= b.south &&
    r.latitude <= b.north &&
    r.longitude >= b.west &&
    r.longitude <= b.east
  );
}

// Convert a react-native-maps region (center + deltas) to bounds and an
// approximate web-mercator zoom level so both platforms share thresholds.
export function regionToViewport(region: {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}): { bounds: MapBounds; zoom: number } {
  return {
    bounds: {
      north: region.latitude + region.latitudeDelta / 2,
      south: region.latitude - region.latitudeDelta / 2,
      east: region.longitude + region.longitudeDelta / 2,
      west: region.longitude - region.longitudeDelta / 2,
    },
    zoom: Math.log2(360 / Math.max(region.longitudeDelta, 1e-6)),
  };
}

// Decide which markers to render for the current viewport. Zoomed out we only
// surface the most desirable spots to avoid clutter; zoomed in we render
// everything inside the view and highlight the top picks. Works purely on the
// already-fetched list — never triggers another backend request.
export function selectMapMarkers(
  restaurants: RestaurantSummary[],
  bounds: MapBounds | null,
  zoom: number
): MapMarkerEntry[] {
  const inView = bounds ? restaurants.filter((r) => inBounds(r, bounds)) : restaurants;
  const ranked = [...inView].sort((a, b) => desirabilityScore(b) - desirabilityScore(a));

  if (zoom < FULL_DETAIL_ZOOM) {
    return ranked
      .slice(0, MAX_OVERVIEW_MARKERS)
      .map((restaurant) => ({ restaurant, highlighted: false }));
  }

  const highlightIds = new Set(ranked.slice(0, HIGHLIGHT_COUNT).map((r) => r.id));
  return inView.map((restaurant) => ({
    restaurant,
    highlighted: highlightIds.has(restaurant.id),
  }));
}
