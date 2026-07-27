import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "@shared/hooks";
import { formatReviewCount } from "@/lib/format";
import { navColors } from "@/theme";

interface RatingBadgeProps {
  rating: number | null;
  reviews: number | null;
}

// Google-style "★ 4.7 (1.8k)" for the themed restaurant surfaces. Both columns
// stay NULL until the enrichment import supplies them (migration 013), so this
// renders nothing at all rather than leaving a hollow placeholder behind.
export default function RatingBadge({ rating, reviews }: RatingBadgeProps) {
  const colors = navColors[useAppSelector((state) => state.settings.theme)];

  if (rating == null) return null;

  return (
    <View className="flex-row items-center">
      <Ionicons name="star" size={12} color={colors.offer} />
      <Text className="text-xs font-bold text-table-cream ml-1">{rating.toFixed(1)}</Text>
      {reviews != null && (
        <Text className="text-[10px] text-table-gold ml-1">({formatReviewCount(reviews)})</Text>
      )}
    </View>
  );
}
