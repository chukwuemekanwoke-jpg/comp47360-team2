import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "@shared/hooks";
import { navColors } from "@/theme";
import { ACCESS_NEEDS, AccessNeedField, CUISINES } from "@shared/constants";

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

export type Section = "cuisines" | "price" | "style" | "access";

export type AccessNeeds = Record<AccessNeedField, boolean>;

interface PreferenceEditorProps {
  favoriteCuisines: string[];
  maxPriceLevel: number;
  diningStyle: DiningStyle;
  accessNeeds: AccessNeeds;
  onToggleCuisine: (cuisine: string) => void;
  onSetPriceLevel: (level: number) => void;
  onSetDiningStyle: (style: DiningStyle) => void;
  onToggleAccessNeed: (field: AccessNeedField) => void;
  // Which pickers to render — onboarding shows one per step, the profile
  // edit sheet shows all of them at once.
  sections?: Section[];
}

// Controlled preference pickers shared by onboarding and the profile edit
// sheet, so both surfaces stay in sync on options and styling.
export default function PreferenceEditor({
  favoriteCuisines,
  maxPriceLevel,
  diningStyle,
  accessNeeds,
  onToggleCuisine,
  onSetPriceLevel,
  onSetDiningStyle,
  onToggleAccessNeed,
  sections = ["cuisines", "price", "style", "access"],
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

      {sections.includes("access") && (
        <View className="mb-6">
          <Text className="text-lg font-bold text-table-cream mb-1">
            Access needs
          </Text>
          <Text className="text-xs text-table-gold mb-4">
            Optional — we use these to filter which tables we offer you.
          </Text>
          {ACCESS_NEEDS.map(({ field, label, icon, hint }) => {
            const selected = accessNeeds[field];
            return (
              <TouchableOpacity
                key={field}
                onPress={() => onToggleAccessNeed(field)}
                accessibilityRole="switch"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={label}
                accessibilityHint={hint}
                className={`flex-row items-center p-4 rounded-xl border mb-3 ${
                  selected ? "border-table-teal" : "border-table-border"
                }`}
                style={selected ? { backgroundColor: colors.teal + "18" } : undefined}
              >
                <Ionicons
                  name={icon as keyof typeof Ionicons.glyphMap}
                  size={20}
                  color={selected ? colors.teal : colors.cream}
                />
                <View className="flex-1 ml-3">
                  <Text className={selected ? "text-table-teal font-bold" : "text-table-cream"}>
                    {label}
                  </Text>
                  <Text className="text-xs text-table-gold mt-0.5">{hint}</Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.teal} />
                )}
              </TouchableOpacity>
            );
          })}
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
