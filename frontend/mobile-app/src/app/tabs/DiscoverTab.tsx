import { useMemo } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetNearbyRestaurantsQuery, useGetProfileQuery } from "@shared/apiSlice";
import { DISCOVERY_RADIUS_M, SEAT_AVAILABILITY_POLL_MS } from "@shared/constants";
import { busynessColor, busynessLabel } from "@shared/restaurantFilters";
import { RestaurantSummary } from "@shared/types";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import { setCuisines, setSearchQuery } from "@shared/userSlice";
import { desirabilityScore } from "@/lib/mapDisplay";
import { CUISINE_IMAGE_FILL, cuisineImage, formatCuisine } from "@/lib/cuisineImages";

// Fallback coords used when device location is unavailable.
const FALLBACK_LAT = 40.7589;
const FALLBACK_LNG = -73.9851;

const CAROUSEL_SIZE = 8;

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mx-4 mt-6 mb-3">
      <Text className="text-sm font-bold text-table-cream">{title}</Text>
      <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mt-0.5">
        {subtitle}
      </Text>
    </View>
  );
}

export default function DiscoverScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const location = useAppSelector((state) => state.user.location);
  const userId = useAppSelector((state) => state.auth.userId);
  const lat = location?.lat ?? FALLBACK_LAT;
  const lng = location?.lng ?? FALLBACK_LNG;

  // Preferences now live in user_preferences and come back categorized, so
  // Discover can key off preferredCuisines directly instead of unpicking the
  // old mixed dietaryTags array. Guests skip the query and see the
  // unpersonalised sections.
  const { data: profile } = useGetProfileQuery(userId ?? skipToken);

  // Same cached query the map and list use — browsing here costs no
  // additional backend requests.
  const { data, isLoading } = useGetNearbyRestaurantsQuery(
    { lat, lng, radiusM: DISCOVERY_RADIUS_M },
    { pollingInterval: SEAT_AVAILABILITY_POLL_MS }
  );

  const restaurants = useMemo(() => data?.restaurants ?? [], [data]);

  // Cuisine comparisons are lowercase everywhere (see applyRestaurantFilters).
  const preferredCuisines = useMemo(
    () => (profile?.preferredCuisines ?? []).map((c) => c.toLowerCase()),
    [profile]
  );

  const forYou = useMemo(
    () =>
      preferredCuisines.length === 0
        ? []
        : [...restaurants]
            .filter((r) => preferredCuisines.includes(r.cuisine.toLowerCase()))
            .sort((a, b) => desirabilityScore(b) - desirabilityScore(a))
            .slice(0, CAROUSEL_SIZE),
    [restaurants, preferredCuisines]
  );

  const topPicks = useMemo(
    () =>
      [...restaurants]
        .sort((a, b) => desirabilityScore(b) - desirabilityScore(a))
        .slice(0, CAROUSEL_SIZE),
    [restaurants]
  );

  const quietNow = useMemo(
    () =>
      [...restaurants]
        .sort((a, b) => a.busynessScore - b.busynessScore)
        .slice(0, CAROUSEL_SIZE),
    [restaurants]
  );

  // Preferred cuisines lead the row, everything else stays alphabetical.
  const cuisines = useMemo(() => {
    const all = [...new Set(restaurants.map((r) => r.cuisine))].sort();
    const isPreferred = (c: string) => preferredCuisines.includes(c.toLowerCase());
    return [...all.filter(isPreferred), ...all.filter((c) => !isPreferred(c))];
  }, [restaurants, preferredCuisines]);

  // Deep-link into the Restaurants tab pre-narrowed to this restaurant.
  const openRestaurant = (r: RestaurantSummary) => {
    dispatch(setSearchQuery(r.name));
    router.push("/tabs/CardTab");
  };

  // Replace the cuisine filter and browse the full list for it.
  const openCuisine = (cuisine: string) => {
    dispatch(setCuisines([cuisine.toLowerCase()]));
    dispatch(setSearchQuery(""));
    router.push("/tabs/CardTab");
  };

  const RestaurantTile = ({ item }: { item: RestaurantSummary }) => (
    <TouchableOpacity
      onPress={() => openRestaurant(item)}
      activeOpacity={0.8}
      className="w-44 mr-3 bg-table-surface border border-table-border rounded-2xl overflow-hidden"
    >
      <ImageBackground
        source={cuisineImage(item.cuisine)}
        resizeMode="cover"
        className="h-20"
        imageStyle={CUISINE_IMAGE_FILL}
      >
        <View className="flex-1 justify-end px-2.5 py-1.5" style={{ backgroundColor: "rgba(0,0,0,0.25)" }}>
          <Text
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: busynessColor(item.busynessScore) }}
          >
            {busynessLabel(item.busynessScore)}
          </Text>
        </View>
      </ImageBackground>
      <View className="p-2.5">
        <Text className="text-xs font-bold text-table-cream" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-[10px] text-table-gold mt-0.5" numberOfLines={1}>
          {formatCuisine(item.cuisine)} · {item.availableTableCount} tables free
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-table-canvas items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-table-canvas"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View className="mx-4 mt-4 bg-table-surface border border-table-border rounded-2xl px-4 py-3">
        <Text className="text-sm font-bold text-table-cream">Tables available now</Text>
        <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mt-0.5">
          Free tables within {DISCOVERY_RADIUS_M / 1000} km of you
        </Text>
        <Text className="text-[10px] text-table-cream/60 mt-2 leading-relaxed">
          Every booking here is for right now. We check your travel time at checkout, so you
          only book a table you can still reach before it is released.
        </Text>
      </View>

      {restaurants.length === 0 ? (
        <Text className="text-table-gold text-xs text-center mt-12 mx-8">
          No tables free nearby right now. Try enabling location, or check back in a few minutes.
        </Text>
      ) : (
        <>
          {preferredCuisines.length > 0 && (
            <>
              <SectionTitle title="For you" subtitle="Matched to your saved cuisines" />
              {forYou.length === 0 ? (
                <Text className="text-table-gold text-xs mx-4 mb-1">
                  Nothing in your cuisines has a free table right now — the picks below are
                  everything else nearby.
                </Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                  {forYou.map((r) => (
                    <RestaurantTile key={r.id} item={r} />
                  ))}
                </ScrollView>
              )}
            </>
          )}

          <SectionTitle title="Top picks" subtitle="Tables free now, low wait" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {topPicks.map((r) => (
              <RestaurantTile key={r.id} item={r} />
            ))}
          </ScrollView>

          <SectionTitle title="Quiet right now" subtitle="Beat the crowds" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {quietNow.map((r) => (
              <RestaurantTile key={r.id} item={r} />
            ))}
          </ScrollView>

          <SectionTitle
            title="Browse by cuisine"
            subtitle={
              preferredCuisines.length > 0
                ? "Your cuisines first"
                : "Jump straight to a craving"
            }
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {cuisines.map((cuisine) => (
              <TouchableOpacity
                key={cuisine}
                onPress={() => openCuisine(cuisine)}
                activeOpacity={0.8}
                className="w-32 h-20 mr-3 rounded-2xl overflow-hidden border border-table-border"
              >
                <ImageBackground
                  source={cuisineImage(cuisine)}
                  resizeMode="cover"
                  className="flex-1"
                  imageStyle={CUISINE_IMAGE_FILL}
                >
                  <View
                    className="flex-1 items-center justify-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
                  >
                    <Text
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: "#ffffff", textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 4 }}
                    >
                      {formatCuisine(cuisine)}
                    </Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
    </ScrollView>
  );
}
