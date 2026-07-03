import { Text, TouchableOpacity, View } from "react-native";
import { RestaurantSummary } from "@shared/types";

interface RestaurantCardProps {
  restaurant: RestaurantSummary;
  onBook?: (restaurant: RestaurantSummary) => void;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

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

export default function RestaurantCard({ restaurant: r, onBook }: RestaurantCardProps) {
  return (
    <View className="bg-table-surface border border-table-border rounded-2xl overflow-hidden mb-3">
      {/* Placeholder header band */}
      <View
        className="h-20 items-center justify-between px-4 flex-row border-b border-table-border"
        style={{ backgroundColor: "#18181b" }}
      >
        <Text className="text-2xl font-bold text-table-cream/20">
          {r.name.charAt(0)}
        </Text>
        <View
          className="px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: busynessColor(r.busynessScore) + "20" }}
        >
          <Text
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: busynessColor(r.busynessScore) }}
          >
            {busynessLabel(r.busynessScore)}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-sm font-bold text-table-cream">{r.name}</Text>
            <Text className="text-xs text-table-gold mt-0.5">{r.cuisine}</Text>
          </View>
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
              {r.isWheelchairAccessible ? "♿ Yes" : "—"}
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
            Book Table
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
