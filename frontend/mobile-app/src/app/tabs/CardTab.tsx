import RestaurantCard from "@/components/RestaurantCard";
import { RestaurantSummary } from "@shared/types";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGetNearbyRestaurantsQuery } from "@shared/apiSlice";
import { DISCOVERY_RADIUS_M, SEAT_AVAILABILITY_POLL_MS } from "@shared/constants";
import { applyRestaurantFilters } from "@shared/restaurantFilters";
import { useAppSelector } from "@shared/hooks";
import BookingModal from "@/components/BookingCheckout";
import CollapsibleFilters from "@/components/CollapsibleFilters";
import LocationComponent from "@/components/LocationComponent";
import { navColors } from "@/theme";

type SortOption = "relevance" | "distance" | "price";

// Fallback coords used when device location is unavailable (e.g. simulator / GPS denied)
const FALLBACK_LAT = 40.7589;
const FALLBACK_LNG = -73.9851;

// List offset after which the floating scroll-to-top button appears.
const SCROLL_TOP_THRESHOLD = 400;

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Quietest",     value: "relevance" },
  { label: "Distance",     value: "distance"  },
  { label: "Availability", value: "price"     },
];

export default function CardListView() {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantSummary | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef<FlatList<RestaurantSummary>>(null);

  const reduxLocation = useAppSelector((state) => state.user.location);
  const filters = useAppSelector((state) => state.user.filters);
  const colors = navColors[useAppSelector((state) => state.settings.theme)];
  const lat = reduxLocation?.lat ?? FALLBACK_LAT;
  const lng = reduxLocation?.lng ?? FALLBACK_LNG;

  const { data, isLoading, error, refetch } = useGetNearbyRestaurantsQuery(
    { lat, lng, radiusM: DISCOVERY_RADIUS_M },
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

  const restaurantsList = useMemo(() => data?.restaurants ?? [], [data]);

  const sorted = useMemo(() => {
    // Shared search/cuisine/busyness pipeline over the cached response.
    const list = applyRestaurantFilters(restaurantsList, filters);
    if (sortBy === "distance")  list.sort((a, b) => a.distanceMeters - b.distanceMeters);
    if (sortBy === "price")     list.sort((a, b) => b.availableTableCount - a.availableTableCount);
    if (sortBy === "relevance") list.sort((a, b) => a.busynessScore - b.busynessScore);
    return list;
  }, [restaurantsList, sortBy, filters]);

  // Render restaurant cards — stable identities so memoized rows skip
  // re-rendering when unrelated CardTab state (modal, sort) changes.
  const handleBook = useCallback(
    (restaurant: RestaurantSummary) => setSelectedRestaurant(restaurant),
    []
  );
  const renderCard = useCallback(
    ({ item }: { item: RestaurantSummary }) => (
      <RestaurantCard restaurant={item} onBook={handleBook} />
    ),
    [handleBook]
  );

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pastThreshold = e.nativeEvent.contentOffset.y > SCROLL_TOP_THRESHOLD;
    setShowScrollTop((current) => (current === pastThreshold ? current : pastThreshold));
  }, []);

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
      {/* Search + collapsible filters + sort bar */}
      <View className="px-4 py-3 bg-table-surface border-b border-table-border">
        <CollapsibleFilters />

        <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-2 mt-3">
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
              style={sortBy === value ? { backgroundColor: colors.teal + "18" } : undefined}
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
        ref={listRef}
        data={sorted}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        onScroll={handleScroll}
        scrollEventThrottle={100}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.teal}
            colors={[colors.teal]}
          />
        }
        ListHeaderComponent={
          <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-3">
            {sorted.length} restaurants found
          </Text>
        }
        ListEmptyComponent={
          <Text className="text-table-gold text-xs text-center py-8">
            No restaurants match your search and filters.
          </Text>
        }
      />

      {/* Floating scroll-to-top */}
      {showScrollTop && (
        <TouchableOpacity
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
          activeOpacity={0.8}
          className="absolute bottom-5 right-5 w-11 h-11 rounded-full items-center justify-center border border-table-border"
          style={{
            backgroundColor: colors.surface,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }}
        >
          <Ionicons name="chevron-up" size={22} color={colors.teal} />
        </TouchableOpacity>
      )}

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
