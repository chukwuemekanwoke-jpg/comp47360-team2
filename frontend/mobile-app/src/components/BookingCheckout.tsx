import { useState } from "react";
import { Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import ModalSheet from "./ModalSheet";
import EtaNotice from "./EtaNotice";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RestaurantSummary, TransportMode } from "@shared/types";
import { useCreateBookingMutation, useGetRestaurantEtaQuery } from "@shared/apiSlice";
import { useAppSelector } from "@shared/hooks";
import { navColors } from "@/theme";
import { formatCuisine } from "@/lib/cuisineImages";
import { TRAVEL_METHODS } from "@shared/constants";

interface BookingModalProps {
  isVisible: boolean;
  restaurant: RestaurantSummary | null;
  onClose: () => void;
  userCoordinates: { lat: number; lng: number };
}

type IconName = keyof typeof Ionicons.glyphMap;

const TRANSPORT_OPTIONS: { label: string; value: TransportMode; icon: IconName }[] =
  TRAVEL_METHODS.map(({ label, mode, icon }) => ({
    label,
    value: mode,
    icon: icon as IconName,
  }));

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
  const bookEnabled = (canBook || !userId) && !etaFetching;

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
    <ModalSheet isVisible={isVisible} onClose={onClose}>
      <View className="mb-5">
        <Text className="text-lg font-bold text-table-cream">Confirm Booking</Text>
        <Text className="text-sm text-table-gold mt-1">{restaurant.name}</Text>
        <Text className="text-xs text-table-cream/60 mt-0.5">
          {formatCuisine(restaurant.cuisine)} Cuisine
        </Text>
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
      <EtaNotice
        etaResult={etaResult}
        isFetching={etaFetching}
        readyLead="This books a table for right now."
        tooFarHint="Try another way of getting there."
        fallback={
          <Text className="text-[11px] text-table-cream/70 leading-relaxed">
            <Ionicons name="alert-circle-outline" size={12} color={colors.gold} /> This books a table
            for right now — you hold one of{" "}
            <Text className="font-bold text-table-teal">{restaurant.availableTableCount} tables</Text>
            . Please arrive promptly.
          </Text>
        }
      />

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
          className={`flex-1 rounded-xl py-3.5 items-center justify-center flex-row gap-2 ${
            bookEnabled ? "bg-table-teal" : "bg-table-border"
          }`}
          activeOpacity={0.8}
        >
          {isLoading && <ActivityIndicator color={colors.canvas} size="small" />}
          <Text
            className={`text-xs font-bold uppercase tracking-widest ${
              bookEnabled ? "text-table-canvas" : "text-table-gold"
            }`}
          >
            {isLoading
              ? "Securing…"
              : !userId
              ? "Sign In to Book"
              : !canBook
              ? "Too Far"
              : "Book Table Now"}
          </Text>
        </TouchableOpacity>
      </View>
    </ModalSheet>
  );
}
