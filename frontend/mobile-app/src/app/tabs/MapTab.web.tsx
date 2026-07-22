import React, { useMemo, useState, lazy, Suspense } from "react"; // Added lazy & Suspense
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import BackendHealthCard from "@/components/BackendHealth";
import CollapsibleFilters from "@/components/CollapsibleFilters";
import { useGetNearbyRestaurantsQuery } from "@shared/apiSlice";
import { DISCOVERY_RADIUS_M, SEAT_AVAILABILITY_POLL_MS } from "@shared/constants";
import { applyRestaurantFilters, busynessColor, busynessLabel } from "@shared/restaurantFilters";
import { RestaurantSummary } from "@shared/types";
import { useAppSelector } from "@shared/hooks";
import LocationComponent from "@/components/LocationComponent";
import { MapMarkerEntry } from "@/lib/mapDisplay";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { navColors } from "@/theme";

// Lazy load map component
const LazyLeafletMap = lazy(() => import("@/components/WebMap"));

// Fallback used until a real GPS fix lands in the user slice.
const DEFAULT_LATITUDE = 40.7589;
const DEFAULT_LONGITUDE = -73.9851;

export default function MapScreen() {
  const router = useRouter();

  const userLocation = useAppSelector((state) => state.user.location);
  const filters = useAppSelector((state) => state.user.filters);
  const theme = useAppSelector((state) => state.settings.theme);
  const colors = navColors[theme];
  const latitude = userLocation?.lat ?? DEFAULT_LATITUDE;
  const longitude = userLocation?.lng ?? DEFAULT_LONGITUDE;

  const { data } = useGetNearbyRestaurantsQuery(
    {
      lat: latitude,
      lng: longitude,
      radiusM: DISCOVERY_RADIUS_M
    },
    { pollingInterval: SEAT_AVAILABILITY_POLL_MS }
  );

  // Shared search/cuisine/busyness pipeline over the cached response.
  const restaurantsList = useMemo(
    () => applyRestaurantFilters(data?.restaurants ?? [], filters),
    [data, filters]
  );

  // What the map is actually rendering (viewport + zoom subset), reported by
  // WebMap — the list below mirrors it exactly. Null until the lazy-loaded
  // map mounts and reports for the first time.
  const [visibleMarkers, setVisibleMarkers] = useState<MapMarkerEntry[] | null>(null);
  const nearbyList =
    visibleMarkers ??
    restaurantsList.map((r: RestaurantSummary) => ({ restaurant: r, highlighted: false }));

  return (
    <View className="flex-1 bg-table-canvas">
      {/* ── Header card ── */}
      <View className="mx-4 mt-4 bg-table-surface border border-table-border rounded-2xl px-4 py-3">
        <Text className="text-sm font-bold text-table-cream">Live Restaurant Map</Text>
        <View className="flex-row items-center gap-1.5 mt-0.5">
          <View className="w-1.5 h-1.5 rounded-full bg-table-teal" />
          <Text className="text-[9px] font-bold uppercase tracking-widest text-table-teal">
            Real-time feed
          </Text>
        </View>
      </View>

      {/* ── Search + collapsible filters ── */}
      <View className="mx-4 mt-3">
        <CollapsibleFilters />
      </View>

      {/* ── Map Box Container ── */}
      <View className="mx-4 mt-3 rounded-2xl overflow-hidden border border-table-border relative" style={{ height: 260 }}>
        
        {/* Wrap the lazy component in Suspense to provide an SSR-safe loading window */}
        <Suspense fallback={
          <View className="flex-1 items-center justify-center bg-table-surface">
            <ActivityIndicator size="small" />
          </View>
        }>
          <LazyLeafletMap
            latitude={latitude}
            longitude={longitude}
            restaurantsList={restaurantsList}
            busynessLabel={busynessLabel}
            theme={theme}
            onViewDetails={(id) => router.push({ pathname: "/tabs/CardTab", params: { focusId: id } })}
            onVisibleRestaurantsChange={setVisibleMarkers}
          />
        </Suspense>

        {/* List toggle overlay */}
        <TouchableOpacity
          className="absolute bottom-3 right-3 bg-table-canvas/80 border border-table-border px-3 py-1.5 rounded-lg z-[1000]"
          onPress={() => router.push("/tabs/CardTab")}
          activeOpacity={0.8}
        >
          <Text className="text-table-cream text-[10px] font-bold uppercase tracking-widest">
            List View
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Nearby Cards List — mirrors exactly what the map is showing ── */}
      <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mx-4 mt-5 mb-2">
        {nearbyList.length > 0 ? `${nearbyList.length} On the map` : "On the map"}
      </Text>

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {nearbyList.length === 0 && (
          <Text className="text-table-gold text-xs text-center py-6">
            No restaurants in this map area. Pan or zoom out to see more.
          </Text>
        )}
        {nearbyList.map(({ restaurant: r, highlighted }: MapMarkerEntry) => (
          <View key={r.id} className="bg-table-surface border border-table-border rounded-2xl p-4 mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-bold text-table-cream">
                  {highlighted ? "★ " : ""}{r.name}
                </Text>
                <Text className="text-xs text-table-gold mt-0.5">
                  {r.cuisine} · {r.distanceMeters < 1000 ? `${Math.round(r.distanceMeters)} m` : `${(r.distanceMeters / 1000).toFixed(1)} km`}
                </Text>
              </View>
              <View className="px-2 py-1 rounded-lg" style={{ backgroundColor: busynessColor(r.busynessScore) + "18" }}>
                <Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: busynessColor(r.busynessScore) }}>
                  {busynessLabel(r.busynessScore)}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4 border-t border-table-border pt-2 mt-1">
              <Text className="text-xs text-table-gold">
                <Ionicons name="time-outline" size={12} color={colors.gold} /> {Math.round(r.busynessScore * 100)}%
              </Text>
              <Text className="text-xs text-table-gold">
                <MaterialCommunityIcons name="seat-outline" size={12} color={colors.gold} />{" "}
                <Text className="text-table-live font-bold">{r.availableTableCount} free</Text>
              </Text>
              {r.isWheelchairAccessible && (
                <Text className="text-xs text-table-offer font-bold">
                  <Ionicons name="accessibility-outline" size={12} color={colors.offer} /> Accessible
                </Text>
              )}
            </View>
          </View>
        ))}
        <LocationComponent/>
        <BackendHealthCard/>
      </ScrollView>
    </View>
  );
}