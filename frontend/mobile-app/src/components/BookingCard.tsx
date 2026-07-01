import React from "react";
import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Booking, TransportMode } from "@shared/types";

interface BookingCardProps {
  booking: Booking;
  restaurantName: string;
  restaurantCuisine?: string;
  onCancelPress: (bookingId: string, restaurantName: string) => void;
  isCancelling: boolean;
}

const TRANSPORT_MAP: Record<TransportMode, { label: string; icon: string }> = {
  walking: { label: "Walking", icon: "🚶" },
  driving: { label: "Driving", icon: "🚗" },
  transit: { label: "Transit", icon: "🚇" },
  cycling: { label: "Cycling", icon: "🚴" },
};

export default function BookingCard({
  booking: b,
  restaurantName,
  restaurantCuisine,
  onCancelPress,
  isCancelling,
}: BookingCardProps) {
  
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
  const transport = TRANSPORT_MAP[b.transportMode] || { label: b.transportMode, icon: "📍" };

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
            <Text className="text-xs text-table-gold mt-0.5">{restaurantCuisine}</Text>
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
          <Text className="text-xs font-bold text-table-cream">{transport.icon} {transport.label}</Text>
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