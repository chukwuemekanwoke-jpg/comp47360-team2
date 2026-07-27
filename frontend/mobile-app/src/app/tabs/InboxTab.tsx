import { useState } from "react";
import { FlatList, View, Text, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGetOffersInboxQuery, useAcceptOfferMutation } from "@shared/apiSlice";
import { useAppSelector } from "@shared/hooks";
import OfferCard from "@/components/OfferCard";
import OfferCheckout from "@/components/OfferCheckout";
import SignInPrompt from "@/components/SignInPrompt";
import { OfferInboxItem } from "@shared/types";
import { navColors } from "@/theme";

export default function InboxTab() {
  const userId = useAppSelector((state) => state.auth.userId);
  const colors = navColors[useAppSelector((state) => state.settings.theme)];

  // Polling stands in for push notifications for now — a push received here
  // would call `refetch()` (or dispatch tableApi's cache invalidation) instead
  // of waiting for the next interval. See mobile-app/push-notifications.md.
  const { data, isLoading, error, refetch } = useGetOffersInboxQuery(
    { status: "pending" },
    { skip: !userId, pollingInterval: 30000 }
  );

  const [acceptOffer] = useAcceptOfferMutation();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  // Offer awaiting confirmation. Accepting books a table immediately, so the
  // card's button opens OfferCheckout rather than calling the mutation.
  const [pendingOffer, setPendingOffer] = useState<OfferInboxItem | null>(null);

  const offers = data?.offers ?? [];

  const handleAccept = async (offerId: string) => {
    try {
      setAcceptingId(offerId);
      const result = await acceptOffer(offerId).unwrap();
      setPendingOffer(null);
      Alert.alert(
        "Table Secured!",
        `Your offer has been accepted and a table is confirmed for now. `
          + `ETA: ${result.booking.etaMinutes} mins.`
      );
    } catch {
      setPendingOffer(null);
      Alert.alert("Offer Unavailable", "This offer has expired or been revoked. Pull down to refresh.");
    } finally {
      setAcceptingId(null);
    }
  };

  // Guest browsing — offers are matched per-user, so this is a
  // user-specific route.
  if (!userId) {
    return (
      <SignInPrompt message="Sign in to receive personalised flash deals from nearby restaurants." />
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
          1-to-1 flash deals matched to you. Claiming one books a table for right now.
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
            <Ionicons name="flash-outline" size={36} color={colors.gold} style={{ marginBottom: 12 }} />
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
            onAccept={() => setPendingOffer(item)}
            isAccepting={acceptingId === item.id}
          />
        )}
      />

      <OfferCheckout
        isVisible={pendingOffer !== null}
        offer={pendingOffer}
        onClose={() => setPendingOffer(null)}
        onConfirm={handleAccept}
        isAccepting={acceptingId !== null}
      />
    </View>
  );
}
