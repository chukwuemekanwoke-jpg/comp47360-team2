import { useState } from "react";
import { Modal, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RestaurantSummary, TransportMode } from "@shared/types";
import { useCreateBookingMutation, useGetRestaurantEtaQuery } from "@shared/apiSlice";
import { useAppSelector } from "@shared/hooks";
import { navColors } from "@/theme";

interface BookingModalProps {
  isVisible: boolean;
  restaurant: RestaurantSummary | null;
  onClose: () => void;
  userCoordinates: { lat: number; lng: number };
}

const TRANSPORT_OPTIONS: {
  label: string;
  value: TransportMode;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: "Walking",   value: "walking",  icon: "walk-outline" },
  { label: "Driving",   value: "driving",  icon: "car-outline" },
  { label: "Transit",   value: "transit",  icon: "subway-outline" },
  { label: "Bicycling", value: "cycling",  icon: "bicycle-outline" },
];

export default function BookingModal({
  isVisible,
  restaurant,
  onClose,
  userCoordinates,
}: BookingModalProps) {
  const [transportMode, setTransportMode] = useState<TransportMode>("walking");
  const [createBooking, { isLoading }] = useCreateBookingMutation();
  const userId = useAppSelector((state) => state.auth.userId);
  const colors = navColors[useAppSelector((state) => state.settings.theme)];

  const { data: etaResult, isFetching: etaFetching } = useGetRestaurantEtaQuery(
    {
      restaurantId: restaurant?.id ?? "",
      lat: userCoordinates.lat,
      lng: userCoordinates.lng,
      mode: transportMode,
    },
    { skip: !restaurant || !isVisible }
  );

  if (!restaurant) return null;

  const canBook = etaResult ? etaResult.canBook : true;

  const handleConfirmBooking = async () => {
    // Guest browsing — booking requires an account.
    if (!userId) {
      onClose();
      router.replace("/");
      return;
    }
    try {
      await createBooking({
        restaurantId: restaurant.id,
        transportMode,
        userLat: userCoordinates.lat,
        userLng: userCoordinates.lng,
        offerId: null,
        userId,
      }).unwrap();

      alert(`Successfully booked a table at ${restaurant.name}!`);
      onClose();
    } catch (err) {
      console.error("Booking failed:", err);
      alert("Failed to secure booking. Please try again.");
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/60">
        <TouchableOpacity className="flex-1" onPress={onClose} activeOpacity={1} />

        <View className="bg-table-canvas border-t border-table-border rounded-t-3xl p-6 pb-8">
          <View className="w-12 h-1 bg-table-border rounded-full mx-auto mb-4" />

          <View className="mb-5">
            <Text className="text-lg font-bold text-table-cream">Confirm Booking</Text>
            <Text className="text-sm text-table-gold mt-1">{restaurant.name}</Text>
            <Text className="text-xs text-table-cream/60 mt-0.5">{restaurant.cuisine} Cuisine</Text>
          </View>

          <Text className="text-xs font-bold uppercase tracking-widest text-table-gold mb-3">
            How are you getting there?
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-4">
            {TRANSPORT_OPTIONS.map((option) => {
              const isSelected = transportMode === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setTransportMode(option.value)}
                  className={`flex-1 min-w-[45%] flex-row items-center gap-3 p-3 rounded-xl border ${
                    isSelected
                      ? "bg-table-teal/10 border-table-teal"
                      : "bg-table-surface border-table-border"
                  }`}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={isSelected ? colors.teal : colors.cream}
                  />
                  <Text className={`text-xs font-semibold ${isSelected ? "text-table-teal" : "text-table-cream"}`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ETA result */}
          <View
            className="rounded-xl p-3 mb-4 border"
            style={{
              backgroundColor: etaFetching
                ? "#27272a"
                : canBook
                ? "#10b98118"
                : "#ef444418",
              borderColor: etaFetching
                ? "#27272a"
                : canBook
                ? "#10b98130"
                : "#ef444430",
            }}
          >
            {etaFetching ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#a1a1aa" />
                <Text className="text-[11px] text-table-gold">Calculating travel time…</Text>
              </View>
            ) : etaResult ? (
              <Text
                className="text-[11px] leading-relaxed"
                style={{ color: canBook ? "#10b981" : "#ef4444" }}
              >
                {canBook ? "✓ " : "⚠ "}{etaResult.message}
              </Text>
            ) : (
              <Text className="text-[11px] text-table-cream/70 leading-relaxed">
                <Ionicons name="alert-circle-outline" size={12} color={colors.gold} /> You hold one of{" "}
                <Text className="font-bold text-table-teal">{restaurant.availableTableCount} tables</Text>
                . Please arrive promptly.
              </Text>
            )}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 border border-table-border rounded-xl py-3.5 items-center"
            >
              <Text className="text-table-cream text-xs font-bold uppercase tracking-widest">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isLoading || etaFetching || (!canBook && !!userId)}
              onPress={handleConfirmBooking}
              className="flex-1 rounded-xl py-3.5 items-center justify-center flex-row gap-2"
              style={{
                backgroundColor:
                  (canBook || !userId) && !etaFetching ? "#00f2fe" : "#27272a",
              }}
              activeOpacity={0.8}
            >
              {isLoading && <ActivityIndicator color="#0f172a" size="small" />}
              <Text
                className="text-xs font-bold uppercase tracking-widest"
                style={{
                  color: (canBook || !userId) && !etaFetching ? "#09090b" : "#71717a",
                }}
              >
                {isLoading
                  ? "Securing…"
                  : !userId
                  ? "Sign In to Book"
                  : !canBook
                  ? "Too Far"
                  : "Confirm Table"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
