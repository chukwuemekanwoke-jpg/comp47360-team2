import { useState } from "react";
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import ModalSheet from "./ModalSheet";
import { useUpdatePreferencesMutation } from "@shared/apiSlice";
import { useAppSelector } from "@shared/hooks";
import PreferenceEditor, {
  AccessNeeds,
  DiningStyle,
  priceLevelToBudgetTier,
} from "./PreferenceEditor";
import { AccessNeedField } from "@shared/constants";

interface EditPreferencesModalProps {
  isVisible: boolean;
  onClose: () => void;
  // Current values from the fetched profile, used to prefill the pickers.
  initialCuisines: string[];
  initialPriceLevel: number;
  initialDiningStyle: DiningStyle;
  initialAccessNeeds: AccessNeeds;
}

// "Edit preferences" sheet on the profile page. Saves via the same
// updatePreferences endpoint onboarding uses; the mutation invalidates the
// User tag so the profile refetches on success.
export default function EditPreferencesModal({
  isVisible,
  onClose,
  initialCuisines,
  initialPriceLevel,
  initialDiningStyle,
  initialAccessNeeds,
}: EditPreferencesModalProps) {
  const userId = useAppSelector((state) => state.auth.userId);
  const [triggerUpdatePreferences, { isLoading: saving }] = useUpdatePreferencesMutation();

  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(initialCuisines);
  const [maxPriceLevel, setMaxPriceLevel] = useState(initialPriceLevel);
  const [diningStyle, setDiningStyle] = useState<DiningStyle>(initialDiningStyle);
  const [accessNeeds, setAccessNeeds] = useState<AccessNeeds>(initialAccessNeeds);

  const toggleCuisine = (cuisine: string) => {
    setFavoriteCuisines((current) =>
      current.includes(cuisine)
        ? current.filter((c) => c !== cuisine)
        : [...current, cuisine]
    );
  };

  const toggleAccessNeed = (field: AccessNeedField) => {
    setAccessNeeds((current) => ({ ...current, [field]: !current[field] }));
  };

  const save = async () => {
    if (!userId) return;
    try {
      await triggerUpdatePreferences({
        userId,
        budgetTier: priceLevelToBudgetTier(maxPriceLevel),
        preferredCuisines: favoriteCuisines,
        diningStyles: [diningStyle],
        ...accessNeeds,
      }).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to update preferences:", error);
      const message = "Could not save your preferences. Please try again.";
      if (Platform.OS === "web") {
        window.alert(message);
      } else {
        Alert.alert("Error", message);
      }
    }
  };

  return (
    <ModalSheet isVisible={isVisible} onClose={onClose} sheetClassName="pb-10 max-h-[85%]">
      <Text className="text-lg font-bold text-table-cream mb-1">Edit Preferences</Text>
      <Text className="text-xs text-table-gold mb-5">
        Changes apply to your profile and future recommendations.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <PreferenceEditor
          favoriteCuisines={favoriteCuisines}
          maxPriceLevel={maxPriceLevel}
          diningStyle={diningStyle}
          accessNeeds={accessNeeds}
          onToggleCuisine={toggleCuisine}
          onSetPriceLevel={setMaxPriceLevel}
          onSetDiningStyle={setDiningStyle}
          onToggleAccessNeed={toggleAccessNeed}
        />
      </ScrollView>

      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          onPress={onClose}
          className="flex-1 border border-table-border rounded-xl py-3.5 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-table-cream text-xs font-bold uppercase tracking-widest">
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={save}
          disabled={saving}
          className="flex-1 bg-table-teal rounded-xl py-3.5 items-center"
          activeOpacity={0.8}
          style={{ opacity: saving ? 0.7 : 1 }}
        >
          <Text className="text-table-canvas text-xs font-bold uppercase tracking-widest">
            {saving ? "Saving…" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </ModalSheet>
  );
}
