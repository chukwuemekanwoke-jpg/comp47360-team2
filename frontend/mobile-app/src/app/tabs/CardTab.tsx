import RestaurantCard from "@/components/RestaurantCard";
import { RestaurantSummary } from "@shared/types";
import { useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useGetNearbyRestaurantsQuery } from "@shared/apiSlice";
import { useAppSelector } from "@shared/hooks";
import BookingModal from "@/components/BookingCheckout";
import LocationComponent from "@/components/LocationComponent";

type SortOption = "relevance" | "distance" | "price";

// Fallback coords used when device location is unavailable (e.g. simulator / GPS denied)
const FALLBACK_LAT = 40.7589;
const FALLBACK_LNG = -73.9851;

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Quietest",     value: "relevance" },
  { label: "Distance",     value: "distance"  },
  { label: "Availability", value: "price"     },
];

export default function CardListView() {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSummary | null>(null);

  const reduxLocation = useAppSelector((state) => state.user.location);
  const lat = reduxLocation?.lat ?? FALLBACK_LAT;
  const lng = reduxLocation?.lng ?? FALLBACK_LNG;

  const { data, isLoading, error } = useGetNearbyRestaurantsQuery({
    lat,
    lng,
    radiusM: 150000,
  });

  const restaurantsList = data?.restaurants ?? [];
  const selectedCuisines = useAppSelector((state) => state.user.filters.cuisines);

  const sorted = useMemo(() => {
    let list = [...restaurantsList];
    // Client-side cuisine filter — only apply when user has made a selection
    if (selectedCuisines.length > 0) {
      list = list.filter((r) => selectedCuisines.includes(r.cuisine.toLowerCase()));
    }
    if (sortBy === "distance")  list.sort((a, b) => a.distanceMeters - b.distanceMeters);
    if (sortBy === "price")     list.sort((a, b) => b.availableTableCount - a.availableTableCount);
    if (sortBy === "relevance") list.sort((a, b) => a.busynessScore - b.busynessScore);
    return list;
  }, [data, sortBy, selectedCuisines]);

  // Render restaurant cards
  const renderCard = ({ item }: { item: RestaurantSummary }) => (
    <RestaurantCard
      restaurant={item}
      onBook={(restaurant) => setSelectedRestaurant(restaurant)}
    />
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-table-canvas">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-table-canvas">
        <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-2">
          Error loading data.
        </Text>
      </View>
    )
  }
  return (
    <View className="flex-1 bg-table-canvas">
      {/* Sort bar */}
      <View className="px-4 py-3 bg-table-surface border-b border-table-border">
        <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-2">
          Sort by
        </Text>
        <View className="flex-row gap-2">
          {SORT_OPTIONS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setSortBy(value)}
              activeOpacity={0.7}
              className={`px-4 py-2 rounded-xl border ${
                sortBy === value
                  ? "border-table-teal"
                  : "border-table-border bg-table-interactive"
              }`}
              style={sortBy === value ? { backgroundColor: "#00f2fe18" } : undefined}
            >
              <Text
                className={`text-xs font-bold uppercase tracking-widest ${
                  sortBy === value ? "text-table-teal" : "text-table-gold"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Location banner — shown only when falling back to hardcoded coords */}
      {!reduxLocation && (
        <View className="mx-4 mt-2 mb-1 bg-table-surface border border-table-border rounded-xl px-4 py-3">
          <Text className="text-[10px] text-table-gold mb-2">
            Using default location. Enable GPS for local results.
          </Text>
          <LocationComponent />
        </View>
      )}

      <FlatList
        data={sorted}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-3">
            {sorted.length} restaurants found
          </Text>
        }
      />
      {/* The Booking Sheet */}
      <BookingModal
        isVisible={selectedRestaurant !== null}
        restaurant={selectedRestaurant}
        userCoordinates={{ lat, lng }}
        onClose={() => setSelectedRestaurant(null)}
      />
    </View>
  );
}
