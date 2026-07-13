import React, { useState } from "react";
import { FlatList, View, Text, ActivityIndicator, Alert } from "react-native";
import { useGetMyBookingsQuery, useCancelBookingMutation } from "@shared/apiSlice"
import { useAppSelector } from "@shared/hooks";
import BookingCard from "./BookingCard";

export default function BookingsProfile() {
  const userId = useAppSelector((state) => state.auth.userId);
  const { data, isLoading, refetch } = useGetMyBookingsQuery(
    { userId: userId ?? "" },
    { skip: !userId }
  );
  const [cancelBooking] = useCancelBookingMutation();
  
  // Local state to isolate loading animations to specific cards
  // Used for conditional check isCancelling
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const bookingsList = data?.bookings ?? [];

  const handleCancelRequest = (bookingId: string, restaurantName: string) => {
    Alert.alert(
      "Cancel Booking",
      `Are you sure you want to cancel your reservation at ${restaurantName}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              if (!userId) return;
              setCancellingId(bookingId); // Turn on loading indicator for this ID
              await cancelBooking({
                    bookingId,
                    userId
                }).unwrap();
            } catch (err) {
              console.error("Failed to cancel booking:", err);
              Alert.alert("Error", "Could not cancel booking. Please try again.");
            } finally {
              setCancellingId(null); // Clear loading indicator state safely
            }
          },
        },
      ]
    );
  };

  if (isLoading && bookingsList.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-table-canvas">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-table-canvas px-4 pt-4">
      <FlatList
        data={bookingsList}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <Text className="text-table-gold text-center mt-8 text-xs">
            No bookings found.
          </Text>
        }
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onCancelPress={handleCancelRequest}
            isCancelling={cancellingId === item.id} // Evaluates to true only for the target card
          />
        )}
      />
    </View>
  );
}