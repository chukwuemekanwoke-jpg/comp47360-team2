import React from "react";
import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Booking, TransportMode } from "@shared/types";
import { useGetRestaurantDetailQuery } from "@shared/apiSlice";
import { useAppSelector } from "@shared/hooks";
import { navColors } from "@/theme";
import { TRAVEL_METHODS } from "@shared/constants";

interface BookingCardProps {
  booking: Booking;
  onCancelPress: (bookingId: string, restaurantName: string) => void;
  isCancelling: boolean;
}

type IconName = keyof typeof Ionicons.glyphMap;

export default function BookingCard({
  booking: b,
  onCancelPress,
  isCancelling,
}: BookingCardProps) {
  // GET /users/me/bookings has no restaurant join — resolve name/cuisine
  // client-side. RTK Query dedupes and caches per restaurant id.
  const colors = navColors[useAppSelector((state) => state.settings.theme)];
  const { data: restaurant } = useGetRestaurantDetailQuery(b.restaurantId);
  const restaurantName = restaurant?.name ?? "Loading restaurant…";
  const restaurantCuisine = restaurant?.cuisine;
  const restaurantNeighborhood = restaurant?.neighborhood;

  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case "CONFIRMED":
        return { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
      case "PENDING":
      case "HELD":
        return { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
      case "CANCELLED":
      default:
        return { text: "text-table-gold/50", bg: "bg-table-surface border-table-border" };
    }
  };

  const statusStyle = getStatusStyles(b.status);
  const travelMethod = TRAVEL_METHODS.find((t) => t.mode === b.transportMode);
  const transport: { label: string; icon: IconName } = travelMethod
    ? { label: travelMethod.label, icon: travelMethod.icon as IconName }
    : { label: b.transportMode, icon: "location-outline" };

  const bookingTime = b.confirmedAt ? new Date(b.confirmedAt) : new Date(b.holdExpiresAt);
  const formattedTime = bookingTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formattedDate = bookingTime.toLocaleDateString([], { month: "short", day: "numeric" });

  const isActive = b.status.toUpperCase() === "CONFIRMED" || b.status.toUpperCase() === "PENDING";

  return (
    <View className="bg-table-surface border border-table-border rounded-2xl p-4 mb-3">
      {/* Header Info */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-bold text-table-cream">{restaurantName}</Text>
          {restaurantCuisine && (
            <Text className="text-xs text-table-gold mt-0.5">
              {restaurantCuisine}
              {restaurantNeighborhood ? ` · ${restaurantNeighborhood}` : ""}
            </Text>
          )}
        </View>

        <View className={`border rounded-lg px-2.5 py-1 ${statusStyle.bg}`}>
          <Text className={`text-[10px] font-bold tracking-wider uppercase ${statusStyle.text}`}>
            {b.status}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex-row border-t border-table-border pt-3 mb-4">
        <View className="flex-1 items-center">
          <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">Time</Text>
          <Text className="text-xs font-bold text-table-cream">{formattedTime}</Text>
          <Text className="text-[10px] text-table-gold/60 mt-0.5">{formattedDate}</Text>
        </View>

        <View className="w-px bg-table-border" />

        <View className="flex-1 items-center">
          <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">Transit</Text>
          <Text className="text-xs font-bold text-table-cream">
            <Ionicons name={transport.icon} size={12} color={colors.cream} /> {transport.label}
          </Text>
        </View>

        <View className="w-px bg-table-border" />

        <View className="flex-1 items-center">
          <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">ETA</Text>
          <Text className="text-xs font-bold text-table-cream">{b.etaMinutes} mins</Text>
        </View>
      </View>

      {isActive && (
        <TouchableOpacity
          className="border border-red-500/30 bg-red-500/5 active:bg-red-500/10 rounded-xl py-2.5 items-center justify-center flex-row gap-2"
          activeOpacity={0.7}
          onPress={() => onCancelPress(b.id, restaurantName)}
          disabled={isCancelling}
        >
          {isCancelling && <ActivityIndicator size="small" color="#ef4444" />}
          <Text className="text-red-400 text-xs font-bold uppercase tracking-widest">
            {isCancelling ? "Cancelling..." : "Cancel Reservation"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}