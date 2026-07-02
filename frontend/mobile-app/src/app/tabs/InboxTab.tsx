import { useState } from "react";
import { FlatList, View, Text, ActivityIndicator, Alert } from "react-native";
import { useGetOffersInboxQuery, useAcceptOfferMutation } from "@shared/apiSlice";
import { useAppSelector } from "@shared/hooks";
import OfferCard from "@/components/OfferCard";

export default function InboxTab() {
  const userId = useAppSelector((state) => state.auth.userId);

  // Polling stands in for push notifications for now — a push received here
  // would call `refetch()` (or dispatch tableApi's cache invalidation) instead
  // of waiting for the next interval. See mobile-app/push-notifications.md.
  const { data, isLoading, error, refetch } = useGetOffersInboxQuery(
    { status: "pending" },
    { skip: !userId, pollingInterval: 30000 }
  );

  const [acceptOffer] = useAcceptOfferMutation();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const offers = data?.offers ?? [];

  const handleAccept = async (offerId: string) => {
    try {
      setAcceptingId(offerId);
      const result = await acceptOffer(offerId).unwrap();
      Alert.alert(
        "Table Secured!",
        `Your offer has been accepted and a table is confirmed. ETA: ${result.booking.etaMinutes} mins.`
      );
    } catch {
      Alert.alert("Offer Unavailable", "This offer has expired or been revoked. Pull down to refresh.");
    } finally {
      setAcceptingId(null);
    }
  };

  if (!userId) {
    return (
      <View className="flex-1 bg-table-canvas items-center justify-center px-6">
        <Text className="text-table-gold text-sm text-center">
          Complete onboarding to receive personalised flash deals.
        </Text>
      </View>
    );
  }

  if (isLoading && offers.length === 0) {
    return (
      <View className="flex-1 bg-table-canvas items-center justify-center">
        <ActivityIndicator size="large" color="#00f2fe" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-table-canvas items-center justify-center px-6">
        <Text className="text-red-400 text-sm text-center">
          Could not load offers. Pull down to retry.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-table-canvas">
      {/* Header */}
      <View className="mx-4 mt-4 mb-2">
        <Text className="text-[9px] font-bold uppercase tracking-[0.25em] text-table-gold mb-1">
          Exclusive Offers
        </Text>
        <Text className="text-xs text-table-cream/60">
          1-to-1 flash deals matched to you. First come, first served.
        </Text>
      </View>

      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshing={isLoading}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center mt-16 px-6">
            <Text style={{ fontSize: 36, marginBottom: 12 }}>⚡</Text>
            <Text className="text-table-cream text-sm font-bold text-center mb-2">
              No offers right now
            </Text>
            <Text className="text-table-gold text-xs text-center leading-5">
              Personalised flash deals appear here when nearby restaurants push promotions matched to your preferences.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <OfferCard
            offer={item}
            onAccept={handleAccept}
            isAccepting={acceptingId === item.id}
          />
        )}
      />
    </View>
  );
}
