import { Text, TouchableOpacity, View, Image } from "react-native";
import { RestaurantSummary } from "@shared/types";


interface RestaurantCardProps {
  restaurant: RestaurantSummary;
  onBook?: (restaurant: RestaurantSummary) => void;
}

export default function RestaurantCard({
  restaurant: r,
  onBook,
}: RestaurantCardProps) {
  return (
    <View className="bg-table-surface border border-table-border rounded-2xl overflow-hidden mb-3">
      {/* Image Header */}
      <View className="h-36 bg-table-surface items-center justify-center relative border-b border-table-border">
        
        <Image 
            source={{ uri: r.uri }}
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
        />

        <View className="absolute top-3 right-3 bg-table-canvas/80 border border-table-border rounded-lg px-2 py-1 flex-row items-center gap-1">
          <Text style={{ fontSize: 10 }}>Busyness</Text>
          <Text className="text-[11px] font-bold text-table-cream">
            {r.busynessScore}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-sm font-bold text-table-cream">
              {r.name}
            </Text>
            <Text className="text-xs text-table-gold mt-0.5">
              {r.cuisine}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row border-t border-table-border pt-3 mb-4">
          <View className="flex-1 items-center">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">
              Dist
            </Text>
            <Text className="text-xs font-bold text-table-cream">
              {}
            </Text>
          </View>

          <View className="w-px bg-table-border" />

          <View className="flex-1 items-center">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">
              Accessibility
            </Text>
            <Text className="text-xs font-bold text-table-cream">
              {r.isWheelchairAccessible ? "Wheelchair Accessible" : "No Wheelchair Accessibility"}
            </Text>
          </View>

          <View className="w-px bg-table-border" />

          <View className="flex-1 items-center">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">
              Free
            </Text>
            <Text
              className="text-xs font-bold"
              style={{
                color: r.availableTableCount <= 3 ? "#f59e0b" : "#10b981",
              }}
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