import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalSheet from "./ModalSheet";
import EtaNotice from "./EtaNotice";
import { OfferInboxItem } from "@shared/types";
import { useGetRestaurantEtaQuery } from "@shared/apiSlice";
import { useAppSelector } from "@shared/hooks";
import { navColors } from "@/theme";

interface OfferCheckoutProps {
  isVisible: boolean;
  offer: OfferInboxItem | null;
  onClose: () => void;
  onConfirm: (offerId: string) => void;
  isAccepting: boolean;
}

// POST /offers/:id/accept takes no body — it books with the server's
// DEFAULT_TRANSPORT_MODE, so there is no mode picker here and the preview has
// to use the same mode the hold-window gate will actually apply.
const OFFER_TRANSPORT_MODE = "walking" as const;

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return "any moment";
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes} min` : `${seconds} sec`;
}

// Claiming an offer creates a real, immediate booking, so it gets the same
// confirm step as a normal booking instead of firing on a single tap.
export default function OfferCheckout({
  isVisible,
  offer,
  onClose,
  onConfirm,
  isAccepting,
}: OfferCheckoutProps) {
  const colors = navColors[useAppSelector((state) => state.settings.theme)];
  const location = useAppSelector((state) => state.user.location);

  const { data: etaResult, isFetching: etaFetching } = useGetRestaurantEtaQuery(
    {
      restaurantId: offer?.restaurantId ?? "",
      lat: location?.lat ?? 0,
      lng: location?.lng ?? 0,
      mode: OFFER_TRANSPORT_MODE,
    },
    { skip: !offer || !isVisible || !location }
  );

  if (!offer) return null;

  const canBook = etaResult ? etaResult.canBook : true;
  const confirmEnabled = canBook && !etaFetching && !isAccepting;

  return (
    <ModalSheet isVisible={isVisible} onClose={onClose}>
      <View className="mb-5">
        <Text className="text-lg font-bold text-table-cream">Claim this deal?</Text>
        <Text className="text-sm text-table-gold mt-1">{offer.restaurantName}</Text>
        <Text className="text-xs text-table-cream/60 mt-0.5">
          {offer.discountPercent}% off · offer expires in {formatTimeLeft(offer.secondsRemaining)}
        </Text>
      </View>

      <EtaNotice
        etaResult={etaResult}
        isFetching={etaFetching}
        readyLead="Claiming books a table for right now."
        fallback={
          <Text className="text-[11px] text-table-cream/70 leading-relaxed">
            <Ionicons name="alert-circle-outline" size={12} color={colors.gold} /> Claiming books a
            table for right now. Please arrive promptly.
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
          disabled={!confirmEnabled}
          onPress={() => onConfirm(offer.id)}
          className={`flex-1 rounded-xl py-3.5 items-center justify-center flex-row gap-2 ${
            confirmEnabled ? "bg-table-offer" : "bg-table-border"
          }`}
          activeOpacity={0.8}
        >
          {isAccepting && <ActivityIndicator color={colors.canvas} size="small" />}
          <Text
            className={`text-xs font-bold uppercase tracking-widest ${
              confirmEnabled ? "text-table-canvas" : "text-table-gold"
            }`}
          >
            {isAccepting ? "Claiming…" : !canBook ? "Too Far" : "Claim & Book"}
          </Text>
        </TouchableOpacity>
      </View>
    </ModalSheet>
  );
}
