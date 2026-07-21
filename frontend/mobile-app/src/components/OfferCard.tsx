import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { OfferInboxItem } from "@shared/types";

interface OfferCardProps {
  offer: OfferInboxItem;
  onAccept: (offerId: string) => void;
  isAccepting: boolean;
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Expired";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function OfferCard({ offer, onAccept, isAccepting }: OfferCardProps) {
  // Tracks which server value secondsLeft was last synced to, so we can
  // detect a fresh offer (new id, or a re-fetched secondsRemaining) during
  // render instead of calling setState synchronously inside an effect.
  const [syncedWith, setSyncedWith] = useState({ id: offer.id, seconds: offer.secondsRemaining });
  const [secondsLeft, setSecondsLeft] = useState(offer.secondsRemaining);

  if (offer.id !== syncedWith.id || offer.secondsRemaining !== syncedWith.seconds) {
    setSyncedWith({ id: offer.id, seconds: offer.secondsRemaining });
    setSecondsLeft(offer.secondsRemaining);
  }

  useEffect(() => {
    if (syncedWith.seconds <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [syncedWith]);

  const isExpired = !offer.canAccept || secondsLeft <= 0;
  const urgency = secondsLeft < 120;

  return (
    <View className="bg-table-surface border border-table-border rounded-2xl overflow-hidden mb-3">
      {/* Discount banner */}
      <View
        className="px-4 py-2 flex-row items-center justify-between"
        style={{ backgroundColor: isExpired ? "#27272a" : "#f59e0b18" }}
      >
        <View className="flex-row items-center gap-2">
          <Ionicons name="flash-outline" size={14} color={isExpired ? "#71717a" : "#f59e0b"} />
          <Text
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: isExpired ? "#71717a" : "#f59e0b" }}
          >
            Flash Deal
          </Text>
        </View>
        <View
          className="px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: isExpired ? "#3f3f46" : "#f59e0b" }}
        >
          <Text
            className="text-xs font-bold"
            style={{ color: isExpired ? "#71717a" : "#09090b" }}
          >
            -{offer.discountPercent}%
          </Text>
        </View>
      </View>

      {/* Body */}
      <View className="p-4">
        <Text className="text-sm font-bold text-table-cream mb-1">
          {offer.restaurantName}
        </Text>

        {/* Countdown */}
        <View className="flex-row items-center gap-2 mb-4">
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: isExpired ? "#71717a" : urgency ? "#ef4444" : "#10b981" }}
          />
          <Text
            className="text-xs font-bold"
            style={{ color: isExpired ? "#71717a" : urgency ? "#ef4444" : "#10b981" }}
          >
            {isExpired ? "Offer expired" : `Expires in ${formatCountdown(secondsLeft)}`}
          </Text>
        </View>

        <TouchableOpacity
          disabled={isExpired || isAccepting}
          onPress={() => onAccept(offer.id)}
          className="rounded-xl py-3 items-center justify-center flex-row gap-2"
          style={{
            backgroundColor: isExpired ? "#27272a" : "#f59e0b",
            opacity: isAccepting ? 0.7 : 1,
          }}
          activeOpacity={0.8}
        >
          {isAccepting && <ActivityIndicator size="small" color="#09090b" />}
          <Text
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: isExpired ? "#71717a" : "#09090b" }}
          >
            {isAccepting ? "Claiming..." : isExpired ? "Unavailable" : "Claim Offer"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
