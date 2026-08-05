import React, { ReactElement, useState } from "react";
import { FlatList, View, Text, ActivityIndicator, Alert } from "react-native";
import { useGetMyBookingsQuery, useCancelBookingMutation } from "@shared/apiSlice"
import { useAppSelector } from "@shared/hooks";
import BookingCard from "./BookingCard";

interface BookingsProfileProps {
  // ProfileTab passes its header cards / sign-out button here so this
  // FlatList is the single page scroller (no nested VirtualizedLists) and
  // the bookings list gets the full remaining height.
  ListHeaderComponent?: ReactElement;
  ListFooterComponent?: ReactElement;
}

export default function BookingsProfile({
  ListHeaderComponent,
  ListFooterComponent,
}: BookingsProfileProps) {
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

  return (
    <View className="flex-1 bg-table-canvas px-4 pt-4">
      <FlatList
        data={bookingsList}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            {ListHeaderComponent}
            <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-3">
              Your Bookings
            </Text>
          </View>
        }
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <Text className="text-table-gold text-center py-6 text-xs">
              No bookings found.
            </Text>
          )
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
