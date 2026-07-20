import React, { useState, lazy, Suspense } from "react"; // Added lazy & Suspense
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import PreferenceFilters from "../../components/PreferenceFilters";
import BackendHealthCard from "@/components/BackendHealth";
import { useGetNearbyRestaurantsQuery } from "@shared/apiSlice";
import { DISCOVERY_RADIUS_M } from "@shared/constants";
import { RestaurantSummary } from "@shared/types";
import { useAppSelector } from "@shared/hooks";
import LocationComponent from "@/components/LocationComponent";

// Lazy load map component
const LazyLeafletMap = lazy(() => import("@/components/WebMap"));

// Fallback used until a real GPS fix lands in the user slice.
const DEFAULT_LATITUDE = 40.7589;
const DEFAULT_LONGITUDE = -73.9851;

function busynessColor(score: number) {
  const scaled = score * 100;
  if (scaled < 40) return "#10b981"; 
  if (scaled < 70) return "#f59e0b"; 
  return "#ef4444";
}

function busynessLabel(score: number) {
  const scaled = score * 100;
  if (scaled < 40) return "Quiet";
  if (scaled < 70) return "Busy";
  return "Packed";
}

export default function MapScreen() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  const userLocation = useAppSelector((state) => state.user.location);
  const selectedCuisines = useAppSelector((state) => state.user.filters.cuisines);
  const latitude = userLocation?.lat ?? DEFAULT_LATITUDE;
  const longitude = userLocation?.lng ?? DEFAULT_LONGITUDE;

  const { data } = useGetNearbyRestaurantsQuery({
    lat: latitude,
    lng: longitude,
    radiusM: DISCOVERY_RADIUS_M
  });

  const restaurantsList = (data?.restaurants ?? []).filter(
    (r: RestaurantSummary) => selectedCuisines.length === 0 || selectedCuisines.includes(r.cuisine.toLowerCase())
  );

  return (
    <View className="flex-1 bg-table-canvas">
      {/* ── Header card ── */}
      <View className="mx-4 mt-4 bg-table-surface border border-table-border rounded-2xl px-4 py-3 flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-bold text-table-cream">Live Restaurant Map</Text>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <View className="w-1.5 h-1.5 rounded-full bg-table-teal" />
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-teal">
              Real-time feed
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters((v) => !v)}
          className={`px-3 py-1.5 rounded-lg border ${
            showFilters ? "bg-table-teal/10 border-table-teal/30" : "bg-table-interactive border-table-border"
          }`}
          activeOpacity={0.7}
        >
          <Text className={`text-[10px] font-bold uppercase tracking-widest ${showFilters ? "text-table-teal" : "text-table-cream"}`}>
            Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Filters ── */}
      {showFilters && (
        <View className="mx-4 mt-3 bg-table-surface border border-table-border rounded-2xl p-4">
          <PreferenceFilters />
          <TouchableOpacity
            className="mt-3 bg-table-teal rounded-xl py-2.5 items-center"
            onPress={() => setShowFilters(false)}
            activeOpacity={0.8}
          >
            <Text className="text-table-canvas text-xs font-bold uppercase tracking-widest">Apply</Text>
          </TouchableOpacity>
        </View>
      )}

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
            onViewDetails={(id) => router.push({ pathname: "/tabs/CardTab", params: { focusId: id } })}
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

      {/* ── Nearby Cards List ── */}
      <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mx-4 mt-5 mb-2">
        Nearby
      </Text>

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {restaurantsList.map((r: RestaurantSummary) => (
          <View key={r.id} className="bg-table-surface border border-table-border rounded-2xl p-4 mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-bold text-table-cream">{r.name}</Text>
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
              <Text className="text-xs text-table-gold">⏱ {Math.round(r.busynessScore * 100)}%</Text>
              <Text className="text-xs text-table-gold">🪑 <Text className="text-table-live font-bold">{r.availableTableCount} free</Text></Text>
              {r.isWheelchairAccessible && <Text className="text-xs text-table-offer font-bold">⚡ Accessible</Text>}
            </View>
          </View>
        ))}
        <LocationComponent/>
        <BackendHealthCard/>
      </ScrollView>
    </View>
  );
}