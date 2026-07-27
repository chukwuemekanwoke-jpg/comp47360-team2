import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import MapView, { Marker, Callout, Region } from "react-native-maps";
import {
  FULL_DETAIL_ZOOM,
  MapBounds,
  regionToViewport,
  selectMapMarkers,
} from "@/lib/mapDisplay";
import { useRouter } from "expo-router";
import { useAppSelector } from "@shared/hooks";
import { useGetNearbyRestaurantsQuery } from "@shared/apiSlice";
import { DISCOVERY_RADIUS_M, SEAT_AVAILABILITY_POLL_MS } from "@shared/constants";
import { applyRestaurantFilters, busynessColor, busynessLabel } from "@shared/restaurantFilters";
import { RestaurantSummary } from "@shared/types";
import CollapsibleFilters from "@/components/CollapsibleFilters";
import DraggableSheet from "@/components/DraggableSheet";
import LocationComponent from "@/components/LocationComponent";
import BookingModal from "@/components/BookingCheckout";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { navColors } from "@/theme";

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function MapScreen() {
  const router = useRouter();
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSummary | null>(null);
  const mapRef = useRef<MapView>(null);

  const location = useAppSelector((state) => state.user.location);
  const filters = useAppSelector((state) => state.user.filters);
  const theme = useAppSelector((state) => state.settings.theme);
  const colors = navColors[theme];

  const { data, isLoading, refetch } = useGetNearbyRestaurantsQuery(
    location
      ? { lat: location.lat, lng: location.lng, radiusM: DISCOVERY_RADIUS_M }
      : skipToken,
    { pollingInterval: SEAT_AVAILABILITY_POLL_MS }
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Shared search/cuisine/busyness pipeline over the cached response.
  const restaurants = useMemo(
    () => applyRestaurantFilters(data?.restaurants ?? [], filters),
    [data, filters]
  );

  const mapCenter = location
    ? { latitude: location.lat, longitude: location.lng }
    : { latitude: 40.7589, longitude: -73.9851 };

  const initialRegion = { ...mapCenter, latitudeDelta: 0.02, longitudeDelta: 0.02 };

  // Current map extent + approximate zoom, updated as the user pans/zooms.
  const [viewport, setViewport] = useState<{ bounds: MapBounds; zoom: number } | null>(null);
  const effectiveViewport = viewport ?? regionToViewport(initialRegion);

  // Client-side selection over the cached list — zoomed out shows only the
  // top picks, zoomed in shows everything in view with top picks highlighted.
  // Panning/zooming never re-queries the backend.
  const markers = useMemo(
    () => selectMapMarkers(restaurants, effectiveViewport.bounds, effectiveViewport.zoom),
    [restaurants, effectiveViewport.bounds, effectiveViewport.zoom]
  );

  const zoomedOut = effectiveViewport.zoom < FULL_DETAIL_ZOOM;

  // initialRegion only applies once, at mount — when a real GPS fix lands
  // after that (the common case, since location resolves asynchronously),
  // animate the camera to it instead of leaving the map on the fallback.
  useEffect(() => {
    if (!location) return;
    mapRef.current?.animateToRegion(
      { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      500
    );
  }, [location]);

  return (
    <View className="flex-1 bg-table-canvas">

      {/* Search + collapsible filters */}
      <View className="mx-4 mt-4">
        <CollapsibleFilters>
          <LocationComponent />
        </CollapsibleFilters>
      </View>

      {/* No location prompt */}
      {!location && !isLoading && (
        <View className="mx-4 mt-3 bg-table-surface border border-table-border rounded-2xl p-4">
          <Text className="text-xs text-table-gold mb-3">
            Enable location to discover nearby restaurants.
          </Text>
          <LocationComponent />
        </View>
      )}

      {/* Map fills the rest, with the nearby list draggable over it */}
      <View className="flex-1 mt-3">
        <View className="flex-1 mx-4 rounded-2xl overflow-hidden border border-table-border">
          <MapView
            // Keyed by theme so the map fully reloads when light mode is
            // toggled — customMapStyle doesn't reliably re-apply in place.
            key={theme}
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            onRegionChangeComplete={(region: Region) => setViewport(regionToViewport(region))}
            customMapStyle={theme === "dark" ? darkMapStyle : undefined}
          >
            {markers.map(({ restaurant: r, highlighted }) => (
              <Marker
                key={r.id}
                coordinate={{ latitude: r.latitude, longitude: r.longitude }}
                pinColor={highlighted ? "#f5b014" : busynessColor(r.busynessScore)}
                zIndex={highlighted ? 10 : 0}
                onCalloutPress={() => setSelectedRestaurant(r)}
              >
                <Callout tooltip={false}>
                  <View style={{ width: 150, padding: 8 }}>
                    <Text style={{ fontWeight: "700", fontSize: 13 }}>
                      {highlighted ? "★ " : ""}{r.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{r.cuisine}</Text>
                    <Text style={{ fontSize: 11, marginTop: 4 }}>
                      {busynessLabel(r.busynessScore)} · {r.availableTableCount} free
                    </Text>
                    <Text style={{ fontSize: 10, color: "#00f2fe", marginTop: 4, fontWeight: "600" }}>
                      Tap to book →
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {/* Hint that more spots appear as you zoom in */}
          {zoomedOut && restaurants.length > markers.length && (
            <View className="absolute top-2 self-center bg-table-canvas/80 border border-table-border px-3 py-1 rounded-full">
              <Text className="text-table-cream text-[9px] font-bold uppercase tracking-widest">
                Top picks · Zoom in for more
              </Text>
            </View>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <View className="absolute inset-0 items-center justify-center bg-table-canvas/60">
              <ActivityIndicator color={colors.teal} />
            </View>
          )}

          {/* List view toggle — top-right, clear of the draggable sheet */}
          <TouchableOpacity
            className="absolute top-2 right-2 bg-table-canvas/80 border border-table-border px-3 py-1.5 rounded-lg"
            onPress={() => router.push("/tabs/CardTab")}
            activeOpacity={0.8}
          >
            <Text className="text-table-cream text-[10px] font-bold uppercase tracking-widest">
              List View
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nearby list — mirrors exactly what the map is showing */}
        <DraggableSheet
          handle={
            <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold">
              {markers.length > 0 ? `${markers.length} On the map` : "On the map"}
            </Text>
          }
        >
          <ScrollView
            className="px-4 pt-2"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.teal}
                colors={[colors.teal]}
              />
            }
          >
            {isLoading && markers.length === 0 && (
              <View className="items-center py-8">
                <ActivityIndicator color={colors.teal} />
              </View>
            )}

            {!isLoading && markers.length === 0 && location && (
              <Text className="text-table-gold text-xs text-center py-8">
                No restaurants in this map area. Pan or zoom out to see more.
              </Text>
            )}

            {markers.map(({ restaurant: r, highlighted }) => (
              <View
                key={r.id}
                className="bg-table-surface border border-table-border rounded-2xl p-4 mb-3"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-3">
                    <Text className="text-sm font-bold text-table-cream">
                      {highlighted ? "★ " : ""}{r.name}
                    </Text>
                    <Text className="text-xs text-table-gold mt-0.5">
                      {r.cuisine} · {formatDistance(r.distanceMeters)}
                    </Text>
                  </View>
                  <View
                    className="px-2 py-1 rounded-lg"
                    style={{ backgroundColor: busynessColor(r.busynessScore) + "18" }}
                  >
                    <Text
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: busynessColor(r.busynessScore) }}
                    >
                      {busynessLabel(r.busynessScore)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between border-t border-table-border pt-2 mt-1">
                  <View className="flex-row gap-4">
                    <Text className="text-xs text-table-gold">
                      <MaterialCommunityIcons name="seat-outline" size={12} color={colors.gold} />{" "}
                      <Text className="text-table-live font-bold">{r.availableTableCount} free</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedRestaurant(r)}
                    className="bg-table-teal px-3 py-1.5 rounded-lg"
                    activeOpacity={0.8}
                  >
                    <Text className="text-table-canvas text-[10px] font-bold uppercase tracking-widest">
                      Book
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </DraggableSheet>
      </View>

      {/* Booking modal */}
      <BookingModal
        isVisible={selectedRestaurant !== null}
        restaurant={selectedRestaurant}
        userCoordinates={location ?? { lat: 0, lng: 0 }}
        onClose={() => setSelectedRestaurant(null)}
      />
    </View>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a1a1aa" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#27272a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
