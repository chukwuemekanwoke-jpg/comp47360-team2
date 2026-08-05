import { Platform } from "react-native";
import { TransportMode } from "@shared/types";

export interface DirectionsTarget {
  latitude: number;
  longitude: number;
  // Only used as the pin caption — routing always goes to the coordinates.
  label?: string;
}

// Google Maps `travelmode` values.
const GOOGLE_TRAVEL_MODE: Record<TransportMode, string> = {
  walking: "walking",
  driving: "driving",
  transit: "transit",
  cycling: "bicycling",
};

// Apple Maps `dirflg` values. Apple Maps has no cycling directions, so
// cycling degrades to walking rather than opening with no route at all.
const APPLE_DIR_FLAG: Record<TransportMode, string> = {
  walking: "w",
  driving: "d",
  transit: "r",
  cycling: "w",
};

// Universal https links rather than the maps:// and geo: schemes: both are
// claimed by the platform's map app when it's installed and fall back to the
// browser when it isn't, so there's no canOpenURL dance and the link still
// works under react-native-web.
//
// The origin is deliberately omitted — every map app defaults to the device's
// current position, which is fresher than the last fix we hold in redux.
export function buildDirectionsUrl(
  { latitude, longitude, label }: DirectionsTarget,
  mode: TransportMode
): string {
  // Coordinates are numeric, so they're left unencoded — Apple Maps is
  // fussier about a percent-encoded comma in daddr than about a raw one.
  const coords = `${latitude},${longitude}`;

  if (Platform.OS === "ios") {
    const caption = label ? `&q=${encodeURIComponent(label)}` : "";
    return `https://maps.apple.com/?daddr=${coords}&dirflg=${APPLE_DIR_FLAG[mode]}${caption}`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=${GOOGLE_TRAVEL_MODE[mode]}`;
}
