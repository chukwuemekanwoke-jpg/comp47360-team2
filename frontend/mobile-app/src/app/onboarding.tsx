import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { Redirect, Stack, router } from "expo-router";
import { useProfile } from "@/context/ProfileContext";
import { useUpdatePreferencesMutation } from "@shared/apiSlice";
import { useAppSelector } from "@shared/hooks";
import PreferenceEditor, {
  AccessNeeds,
  DiningStyle,
  Section,
  priceLevelToBudgetTier,
} from "@/components/PreferenceEditor";
import { AccessNeedField } from "@shared/constants";

// One picker per step; the progress label and the Next/Continue switch both
// derive from this, so adding a step here is the only change needed.
const STEPS: Section[][] = [["cuisines"], ["price"], ["style"], ["access"]];

const NO_ACCESS_NEEDS: AccessNeeds = {
  requiresWheelchairAccess: false,
  requiresSensoryFriendly: false,
};

export default function OnboardingScreen() {
  const { setProfile } = useProfile();
  const userId = useAppSelector((state) => state.auth.userId);
  const displayName = useAppSelector((state) => state.auth.displayName);
  const location = useAppSelector((state) => state.user.location);

  const [step, setStep] = useState(0);
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>([]);
  const [maxPriceLevel, setMaxPriceLevel] = useState(2);
  const [diningStyle, setDiningStyle] =
    useState<DiningStyle>("casual");
  const [accessNeeds, setAccessNeeds] = useState<AccessNeeds>(NO_ACCESS_NEEDS);

  const [triggerUpdatePreferences, { isLoading: saving }] =
    useUpdatePreferencesMutation();

  // Onboarding only makes sense with an authenticated session.
  if (!userId) {
    return <Redirect href="/" />;
  }

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

  const finishOnboarding = async () => {
    try {
      await triggerUpdatePreferences({
        userId,
        budgetTier: priceLevelToBudgetTier(maxPriceLevel),
        preferredCuisines: favoriteCuisines,
        diningStyles: [diningStyle],
        ...accessNeeds,
        // Only send coordinates when we have a real device fix — no
        // hardcoded fallback, the map handles missing location itself.
        ...(location ? { lastLat: location.lat, lastLng: location.lng } : {}),
      }).unwrap();

      setProfile({
        id: userId,
        name: displayName ?? "Tablé Member",
        favoriteCuisines,
        maxPriceLevel,
        diningStyle,
        ...accessNeeds,
      });

      router.replace("/tabs/MapTab");
    } catch (error) {
      console.error("Onboarding server error:", error);
      Alert.alert("Error", "Could not save your preferences. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-table-canvas">
      <Stack.Screen options={{ title: "Your Preferences" }} />
      <View className="flex-1 px-6 py-8 justify-between">
        <View>
          <Text className="text-table-gold text-xs font-bold uppercase tracking-[0.25em] mb-2">
            Step {step + 1} / {STEPS.length}
          </Text>

          <Text className="text-3xl font-bold text-table-cream mb-8">
            Welcome{displayName ? `, ${displayName}` : ""}
          </Text>

          {/* One picker per step — same editor the profile page uses */}
          <PreferenceEditor
            favoriteCuisines={favoriteCuisines}
            maxPriceLevel={maxPriceLevel}
            diningStyle={diningStyle}
            accessNeeds={accessNeeds}
            onToggleCuisine={toggleCuisine}
            onSetPriceLevel={setMaxPriceLevel}
            onSetDiningStyle={setDiningStyle}
            onToggleAccessNeed={toggleAccessNeed}
            sections={STEPS[step]}
          />
        </View>

        {/* Navigation */}
        <View className="flex-row justify-between">
          <TouchableOpacity
            disabled={step === 0}
            onPress={() => setStep((s) => s - 1)}
            className={`px-5 py-3 rounded-xl ${
              step === 0
                ? "bg-table-surface"
                : "bg-table-interactive"
            }`}
          >
            <Text className="text-table-cream font-bold">
              Back
            </Text>
          </TouchableOpacity>

          {step < STEPS.length - 1 ? (
            <TouchableOpacity
              onPress={() => setStep((s) => s + 1)}
              className="px-5 py-3 rounded-xl bg-table-teal"
            >
              <Text className="text-table-canvas font-bold">
                Next
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={finishOnboarding}
              disabled={saving}
              className="px-5 py-3 rounded-xl bg-table-teal"
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              <Text className="text-table-canvas font-bold">
                {saving ? "Saving…" : "Continue"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
