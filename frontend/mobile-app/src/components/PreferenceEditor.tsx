import { Text, TouchableOpacity, View } from "react-native";
import { useAppSelector } from "@shared/hooks";
import { navColors } from "@/theme";
import { CUISINES } from "@shared/constants";

// Single source of truth for the onboarding/profile preference vocabulary.
// Cuisines and dining styles are persisted in their own categorized fields.
export type DiningStyle = "casual" | "family" | "date-night" | "business";
export type BudgetTier = "TIER_1" | "TIER_2" | "TIER_3";

export const DINING_STYLES: DiningStyle[] = ["casual", "family", "date-night", "business"];

export function priceLevelToBudgetTier(level: number): BudgetTier {
  if (level <= 1) return "TIER_1";
  if (level === 2) return "TIER_2";
  return "TIER_3";
}

export const TIER_PRICE_LEVEL: Record<string, number> = {
  TIER_1: 1,
  TIER_2: 2,
  TIER_3: 3,
};

export function formatDiningStyle(style: string): string {
  return style.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Section = "cuisines" | "price" | "style";

interface PreferenceEditorProps {
  favoriteCuisines: string[];
  maxPriceLevel: number;
  diningStyle: DiningStyle;
  onToggleCuisine: (cuisine: string) => void;
  onSetPriceLevel: (level: number) => void;
  onSetDiningStyle: (style: DiningStyle) => void;
  // Which pickers to render — onboarding shows one per step, the profile
  // edit sheet shows all three at once.
  sections?: Section[];
}

// Controlled preference pickers shared by onboarding and the profile edit
// sheet, so both surfaces stay in sync on options and styling.
export default function PreferenceEditor({
  favoriteCuisines,
  maxPriceLevel,
  diningStyle,
  onToggleCuisine,
  onSetPriceLevel,
  onSetDiningStyle,
  sections = ["cuisines", "price", "style"],
}: PreferenceEditorProps) {
  const colors = navColors[useAppSelector((state) => state.settings.theme)];

  return (
    <View>
      {sections.includes("cuisines") && (
        <View className="mb-6">
          <Text className="text-lg font-bold text-table-cream mb-4">
            Favourite cuisines
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CUISINES.map((cuisine) => {
              const selected = favoriteCuisines.includes(cuisine);
              return (
                <TouchableOpacity
                  key={cuisine}
                  onPress={() => onToggleCuisine(cuisine)}
                  className={`px-4 py-3 rounded-xl border ${
                    selected ? "border-table-teal" : "border-table-border"
                  }`}
                  style={selected ? { backgroundColor: colors.teal + "18" } : undefined}
                >
                  <Text className={selected ? "text-table-teal font-bold" : "text-table-cream"}>
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {sections.includes("price") && (
        <View className="mb-6">
          <Text className="text-lg font-bold text-table-cream mb-4">
            Preferred price range
          </Text>
          <View className="flex-row gap-3">
            {[1, 2, 3].map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => onSetPriceLevel(level)}
                className={`px-5 py-4 rounded-xl border ${
                  maxPriceLevel === level ? "border-table-teal" : "border-table-border"
                }`}
                style={maxPriceLevel === level ? { backgroundColor: colors.teal + "18" } : undefined}
              >
                <Text className={maxPriceLevel === level ? "text-table-teal font-bold" : "text-table-cream"}>
                  {"€".repeat(level)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {sections.includes("style") && (
        <View>
          <Text className="text-lg font-bold text-table-cream mb-4">
            Dining style
          </Text>
          {DINING_STYLES.map((style) => (
            <TouchableOpacity
              key={style}
              onPress={() => onSetDiningStyle(style)}
              className={`p-4 rounded-xl border mb-3 ${
                diningStyle === style ? "border-table-teal" : "border-table-border"
              }`}
              style={diningStyle === style ? { backgroundColor: colors.teal + "18" } : undefined}
            >
              <Text className={diningStyle === style ? "text-table-teal font-bold" : "text-table-cream"}>
                {formatDiningStyle(style)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
