import { memo } from "react";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RestaurantSummary } from "@shared/types";
import { busynessColor, busynessLabel } from "@shared/restaurantFilters";
import { useAppSelector } from "@shared/hooks";
import { CUISINE_IMAGE_FILL, cuisineImage, formatCuisine } from "@/lib/cuisineImages";
import { formatDistance } from "@/lib/format";
import RatingBadge from "@/components/RatingBadge";
import { navColors } from "@/theme";

interface RestaurantCardProps {
  restaurant: RestaurantSummary;
  onBook?: (restaurant: RestaurantSummary) => void;
}

// memo: list rows must not re-render when the parent list re-renders
// (e.g. opening the booking modal) unless their own data changed.
function RestaurantCard({ restaurant: r, onBook }: RestaurantCardProps) {
  const colors = navColors[useAppSelector((state) => state.settings.theme)];
  return (
    <View className="bg-table-surface border border-table-border rounded-2xl overflow-hidden mb-3">
      {/* Cuisine photo header band */}
      <ImageBackground
        source={cuisineImage(r.cuisine)}
        resizeMode="cover"
        className="h-24 border-b border-table-border"
        imageStyle={CUISINE_IMAGE_FILL}
      >
        {/* Dark scrim keeps the badge legible over any photo */}
        <View
          className="flex-1 items-end justify-between px-4 py-3 flex-row"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
        >
          <Text
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#ffffff", textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 4 }}
          >
            {formatCuisine(r.cuisine)}
          </Text>
          <View
            className="px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            <Text
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: busynessColor(r.busynessScore) }}
            >
              {busynessLabel(r.busynessScore)}
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Body */}
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-sm font-bold text-table-cream">{r.name}</Text>
            <Text className="text-xs text-table-gold mt-0.5">{formatCuisine(r.cuisine)}</Text>
          </View>

          <RatingBadge rating={r.rating} reviews={r.reviews} />
        </View>

        {/* Stats */}
        <View className="flex-row border-t border-table-border pt-3 mb-4">
          <View className="flex-1 items-center">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">
              Dist
            </Text>
            <Text className="text-xs font-bold text-table-cream">
              {formatDistance(r.distanceMeters)}
            </Text>
          </View>

          <View className="w-px bg-table-border" />

          <View className="flex-1 items-center">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">
              Access
            </Text>
            <Text className="text-xs font-bold text-table-cream">
              {r.isWheelchairAccessible ? (
                <>
                  <Ionicons name="accessibility-outline" size={12} color={colors.cream} /> Yes
                </>
              ) : (
                "—"
              )}
            </Text>
          </View>

          <View className="w-px bg-table-border" />

          <View className="flex-1 items-center">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">
              Free
            </Text>
            <Text
              className="text-xs font-bold"
              style={{ color: r.availableTableCount <= 3 ? "#f59e0b" : "#10b981" }}
            >
              {r.availableTableCount}
              {r.availableTableCount <= 3 ? " !" : ""}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="bg-table-teal rounded-xl py-3 items-center"
          activeOpacity={0.8}
          onPress={() => onBook?.(r)}
        >
          <Text className="text-table-canvas text-xs font-bold uppercase tracking-widest">
            Book Table Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default memo(RestaurantCard);
