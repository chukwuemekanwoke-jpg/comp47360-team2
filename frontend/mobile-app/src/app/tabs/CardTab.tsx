import RestaurantCard from "@/components/RestaurantCard";
import { RestaurantSummary } from "@shared/types";
import { useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useGetNearbyRestaurantsQuery } from "@shared/apiSlice";
import BookingModal from "@/components/BookingCheckout";

type SortOption = "relevance" | "distance" | "price";

// Hardcoded coordinates for testing
// Example coords (Manhattan)
const LATITUDE = 40.7589;
const LONGITUDE = -73.9851;
const USERCOORDS = {'lat': LATITUDE, 'lng': LONGITUDE};

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Distance",  value: "distance"  },
  { label: "Price",     value: "price"     },
];

export default function CardListView() {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSummary | null>(null);

  const { data, isLoading, error } = useGetNearbyRestaurantsQuery({
    lat: LATITUDE, 
    lng: LONGITUDE,
    radiusM: 150000
  });

  const restaurantsList = data?.restaurants ?? [];

  const sorted = useMemo(() => {
    const list = [...restaurantsList];
    if (sortBy === "distance")  list.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sortBy === "price")     list.sort((a, b) => a.priceLevel - b.priceLevel);
    if (sortBy === "relevance") list.sort((a) => (a.hasFlashDeal ? -1 : 1));
    return list;
  }, [data, sortBy]);

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
        userCoordinates={USERCOORDS}
        onClose={() => setSelectedRestaurant(null)}
      />
    </View>
  );
}
