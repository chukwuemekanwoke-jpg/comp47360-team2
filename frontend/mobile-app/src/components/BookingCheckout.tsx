import React, { useState } from "react";
import { Modal, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { RestaurantSummary, TransportMode } from "@shared/types";
import { useCreateBookingMutation } from "@shared/apiSlice"; // Adjust path
import { DUMMYID } from "@/context/UserContext";

interface BookingModalProps {
  isVisible: boolean;
  restaurant: RestaurantSummary | null;
  onClose: () => void;
  // Supplied by your view/parent state (e.g., current device GPS)
  userCoordinates: { lat: number; lng: number }; 
}

const TRANSPORT_OPTIONS: { label: string; value: TransportMode; icon: string }[] = [
  { label: "Walking", value: "walking", icon: "🚶" },
  { label: "Driving", value: "driving", icon: "🚗" },
  { label: "Transit", value: "transit", icon: "🚇" },
  { label: "Bicycling", value: "cycling", icon: "🚴" },
];

export default function BookingModal({
  isVisible,
  restaurant,
  onClose,
  userCoordinates,
}: BookingModalProps) {
  const [transportMode, setTransportMode] = useState<TransportMode>("walking");
  const [createBooking, { isLoading }] = useCreateBookingMutation();

  if (!restaurant) return null;

  const handleConfirmBooking = async () => {
    try {
      await createBooking({
        restaurantId: restaurant.id,
        transportMode,
        userLat: userCoordinates.lat,
        userLng: userCoordinates.lng,
        offerId: null,
        userId: DUMMYID,
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

        {/* Modal content body container */}
        <View className="bg-table-canvas border-t border-table-border rounded-t-3xl p-6 pb-8">
          
          {/* Header indicator bar */}
          <View className="w-12 h-1 bg-table-border rounded-full align-self-center mx-auto mb-4" />

          <View className="mb-5">
            <Text className="text-lg font-bold text-table-cream">Confirm Booking</Text>
            <Text className="text-sm text-table-gold mt-1">{restaurant.name}</Text>
            <Text className="text-xs text-table-cream/60 mt-0.5">{restaurant.cuisine} Cuisine</Text>
          </View>

          <Text className="text-xs font-bold uppercase tracking-widest text-table-gold mb-3">
            How are you getting there?
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-6">
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
                  <Text className="text-lg">{option.icon}</Text>
                  <Text className={`text-xs font-semibold ${isSelected ? "text-table-teal" : "text-table-cream"}`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Notice */}
          <View className="bg-table-surface border border-table-border rounded-xl p-3 mb-6">
            <Text className="text-[11px] text-table-cream/70 leading-relaxed">
              ⚠️ By continuing, you will hold one of the remaining{" "}
              <Text className="font-bold text-table-teal">{restaurant.availableTableCount} tables</Text>. 
              Please arrive promptly relative to your chosen transit mode.
            </Text>
          </View>

          {/* Bottom Call to Actions */}
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
              disabled={isLoading}
              onPress={handleConfirmBooking}
              className="flex-1 bg-table-teal rounded-xl py-3.5 items-center justify-center flex-row gap-2"
              activeOpacity={0.8}
            >
              {isLoading && <ActivityIndicator color="#0f172a" size="small" />}
              <Text className="text-table-canvas text-xs font-bold uppercase tracking-widest">
                {isLoading ? "Securing..." : "Confirm Table"}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}