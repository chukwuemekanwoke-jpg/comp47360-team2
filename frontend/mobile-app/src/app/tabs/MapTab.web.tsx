import React, { useMemo, useState, lazy, Suspense } from "react"; // Added lazy & Suspense
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import BackendHealthCard from "@/components/BackendHealth";
import FilterBar, { FilterSheet } from "@/components/FilterBar";
import DraggableSheet from "@/components/DraggableSheet";
import BookingModal from "@/components/BookingCheckout";
import { useGetNearbyRestaurantsQuery } from "@shared/apiSlice";
import { DISCOVERY_RADIUS_M, SEAT_AVAILABILITY_POLL_MS } from "@shared/constants";
import { applyRestaurantFilters, busynessColor, busynessLabel } from "@shared/restaurantFilters";
import { RestaurantSummary } from "@shared/types";
import { useAppSelector } from "@shared/hooks";
import LocationComponent from "@/components/LocationComponent";
import { MapMarkerEntry } from "@/lib/mapDisplay";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { navColors } from "@/theme";

// Lazy load map component
const LazyLeafletMap = lazy(() => import("@/components/WebMap"));

// busynessColor() returns a fixed semantic hex outside the table-* palette,
// so it can't be expressed as a Tailwind class — tint it explicitly instead.
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Fallback used until a real GPS fix lands in the user slice.
const DEFAULT_LATITUDE = 40.7589;
const DEFAULT_LONGITUDE = -73.9851;

export default function MapScreen() {
  const router = useRouter();
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSummary | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersTop, setFiltersTop] = useState(0);

  const userLocation = useAppSelector((state) => state.user.location);
  const filters = useAppSelector((state) => state.user.filters);
  const theme = useAppSelector((state) => state.settings.theme);
  const colors = navColors[theme];
  const latitude = userLocation?.lat ?? DEFAULT_LATITUDE;
  const longitude = userLocation?.lng ?? DEFAULT_LONGITUDE;

  const { data, isLoading } = useGetNearbyRestaurantsQuery(
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
      {/* ── Search + filter toggle — the panel itself overlays the screen ── */}
      <View
        className="mx-4 mt-4"
        onLayout={(e) =>
          setFiltersTop(e.nativeEvent.layout.y + e.nativeEvent.layout.height + 12)
        }
      >
        <FilterBar active={filtersOpen} onToggle={() => setFiltersOpen((v) => !v)} />
      </View>

      {/* No location prompt */}
      {!userLocation && !isLoading && (
        <View className="mx-4 mt-3 bg-table-surface border border-table-border rounded-2xl p-4">
          <Text className="text-xs text-table-gold mb-3">
            Enable location to discover nearby restaurants.
          </Text>
          <LocationComponent />
        </View>
      )}

      {/* Map fills the rest, with the nearby list draggable over it */}
      <View className="flex-1 mt-3">
        <View className="flex-1 mx-4 rounded-2xl overflow-hidden border border-table-border relative">

          {/* Wrap the lazy component in Suspense to provide an SSR-safe loading window */}
          <Suspense fallback={
            <View className="flex-1 items-center justify-center bg-table-surface">
              <ActivityIndicator size="small" color={colors.teal} />
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

          {/* List toggle overlay — top-right, clear of the draggable sheet */}
          <TouchableOpacity
            className="absolute top-2 right-2 bg-table-canvas/80 border border-table-border px-3 py-1.5 rounded-lg z-[1000]"
            onPress={() => router.push("/tabs/CardTab")}
            activeOpacity={0.8}
          >
            <Text className="text-table-cream text-[10px] font-bold uppercase tracking-widest">
              List View
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Nearby Cards List — mirrors exactly what the map is showing ── */}
        <DraggableSheet
          handle={
            <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold">
              {nearbyList.length > 0 ? `${nearbyList.length} On the map` : "On the map"}
            </Text>
          }
        >
          <ScrollView className="px-4 pt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
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
                  <View className="px-2 py-1 rounded-lg" style={{ backgroundColor: hexToRgba(busynessColor(r.busynessScore), 0.1) }}>
                    <Text className="text-[10px] font-bold uppercase tracking-widest" style={{ color: busynessColor(r.busynessScore) }}>
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
            <BackendHealthCard/>
          </ScrollView>
        </DraggableSheet>
      </View>

      <FilterSheet
        isVisible={filtersOpen}
        top={filtersTop}
        onClose={() => setFiltersOpen(false)}
      >
        <LocationComponent />
      </FilterSheet>

      {/* Booking modal */}
      <BookingModal
        isVisible={selectedRestaurant !== null}
        restaurant={selectedRestaurant}
        userCoordinates={userLocation ?? { lat: 0, lng: 0 }}
        onClose={() => setSelectedRestaurant(null)}
      />
    </View>
  );
}