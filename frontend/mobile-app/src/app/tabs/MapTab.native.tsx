import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { useRouter } from "expo-router";
import { useAppSelector } from "@shared/hooks";
import { useGetNearbyRestaurantsQuery } from "@shared/apiSlice";
import { DISCOVERY_RADIUS_M } from "@shared/constants";
import { RestaurantSummary } from "@shared/types";
import PreferenceFilters from "@/components/PreferenceFilters";
import LocationComponent from "@/components/LocationComponent";
import BookingModal from "@/components/BookingCheckout";

function busynessColor(score: number) {
  if (score < 0.4) return "#10b981";
  if (score < 0.7) return "#f59e0b";
  return "#ef4444";
}

function busynessLabel(score: number) {
  if (score < 0.4) return "Quiet";
  if (score < 0.7) return "Busy";
  return "Packed";
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function MapScreen() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSummary | null>(null);

  const location = useAppSelector((state) => state.user.location);
  const selectedCuisines = useAppSelector((state) => state.user.filters.cuisines);
  const theme = useAppSelector((state) => state.settings.theme);

  const { data, isLoading } = useGetNearbyRestaurantsQuery(
    location
      ? { lat: location.lat, lng: location.lng, radiusM: DISCOVERY_RADIUS_M }
      : skipToken
  );

  const restaurants = useMemo(() => {
    const all = data?.restaurants ?? [];
    if (selectedCuisines.length === 0) return all;
    return all.filter((r) => selectedCuisines.includes(r.cuisine.toLowerCase()));
  }, [data, selectedCuisines]);

  const mapCenter = location
    ? { latitude: location.lat, longitude: location.lng }
    : { latitude: 40.7589, longitude: -73.9851 };

  return (
    <View className="flex-1 bg-table-canvas">

      {/* Header card */}
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
            showFilters
              ? "bg-table-teal/10 border-table-teal/30"
              : "bg-table-interactive border-table-border"
          }`}
          activeOpacity={0.7}
        >
          <Text className={`text-[10px] font-bold uppercase tracking-widest ${
            showFilters ? "text-table-teal" : "text-table-cream"
          }`}>
            Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View className="mx-4 mt-3 bg-table-surface border border-table-border rounded-2xl p-4">
          <PreferenceFilters />
          <View className="mt-3 border-t border-table-border pt-3">
            <LocationComponent />
          </View>
          <TouchableOpacity
            className="mt-3 bg-table-teal rounded-xl py-2.5 items-center"
            onPress={() => setShowFilters(false)}
            activeOpacity={0.8}
          >
            <Text className="text-table-canvas text-xs font-bold uppercase tracking-widest">
              Apply
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map */}
      <View className="mx-4 mt-3 rounded-2xl overflow-hidden border border-table-border" style={{ height: 240 }}>
        <MapView
          style={{ flex: 1 }}
          region={{
            ...mapCenter,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          customMapStyle={theme === "dark" ? darkMapStyle : undefined}
        >
          {restaurants.map((r) => (
            <Marker
              key={r.id}
              coordinate={{ latitude: r.latitude, longitude: r.longitude }}
              pinColor={busynessColor(r.busynessScore)}
              onCalloutPress={() => setSelectedRestaurant(r)}
            >
              <Callout tooltip={false}>
                <View style={{ width: 150, padding: 8 }}>
                  <Text style={{ fontWeight: "700", fontSize: 13 }}>{r.name}</Text>
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

        {/* Loading overlay */}
        {isLoading && (
          <View className="absolute inset-0 items-center justify-center bg-table-canvas/60">
            <ActivityIndicator color="#00f2fe" />
          </View>
        )}

        {/* List view toggle */}
        <TouchableOpacity
          className="absolute bottom-3 right-3 bg-table-canvas/80 border border-table-border px-3 py-1.5 rounded-lg"
          onPress={() => router.push("/tabs/CardTab")}
          activeOpacity={0.8}
        >
          <Text className="text-table-cream text-[10px] font-bold uppercase tracking-widest">
            List View
          </Text>
        </TouchableOpacity>
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

      {/* Nearby list */}
      <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mx-4 mt-5 mb-2">
        {restaurants.length > 0 ? `${restaurants.length} Nearby` : "Nearby"}
      </Text>

      <ScrollView
        className="px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {isLoading && restaurants.length === 0 && (
          <View className="items-center py-8">
            <ActivityIndicator color="#00f2fe" />
          </View>
        )}

        {!isLoading && restaurants.length === 0 && location && (
          <Text className="text-table-gold text-xs text-center py-8">
            No available restaurants within range.
          </Text>
        )}

        {restaurants.map((r) => (
          <View
            key={r.id}
            className="bg-table-surface border border-table-border rounded-2xl p-4 mb-3"
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-bold text-table-cream">{r.name}</Text>
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
                  🪑 <Text className="text-table-live font-bold">{r.availableTableCount} free</Text>
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
