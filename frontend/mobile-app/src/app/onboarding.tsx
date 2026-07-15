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

type DiningStyle =
  | "casual"
  | "family"
  | "date-night"
  | "business";

type BudgetTier = "TIER_1" | "TIER_2" | "TIER_3";

const CUISINES = [
  "Italian",
  "Indian",
  "Japanese",
  "Mexican",
  "Thai",
];

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

  function mapPriceToBudgetTier(level: number): BudgetTier {
    if (level <= 1) return "TIER_1";
    if (level === 2) return "TIER_2";
    return "TIER_3";
  }

  const finishOnboarding = async () => {
    try {
      await triggerUpdatePreferences({
        userId,
        budgetTier: mapPriceToBudgetTier(maxPriceLevel),
        dietaryTags: [...favoriteCuisines, diningStyle],
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
            Step {step + 1} / 3
          </Text>

          <Text className="text-3xl font-bold text-table-cream mb-8">
            Welcome{displayName ? `, ${displayName}` : ""}
          </Text>

          {/* STEP 1 */}
          {step === 0 && (
            <>
              <Text className="text-lg font-bold text-table-cream mb-4">
                Favourite cuisines
              </Text>

              <View className="flex-row flex-wrap gap-2">
                {CUISINES.map((cuisine) => {
                  const selected =
                    favoriteCuisines.includes(cuisine);

                  return (
                    <TouchableOpacity
                      key={cuisine}
                      onPress={() => toggleCuisine(cuisine)}
                      className={`px-4 py-3 rounded-xl border ${
                        selected
                          ? "border-table-teal"
                          : "border-table-border"
                      }`}
                      style={
                        selected
                          ? { backgroundColor: "#00f2fe18" }
                          : undefined
                      }
                    >
                      <Text
                        className={
                          selected
                            ? "text-table-teal font-bold"
                            : "text-table-cream"
                        }
                      >
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <>
              <Text className="text-lg font-bold text-table-cream mb-4">
                Preferred price range
              </Text>

              <View className="flex-row gap-3">
                {[1, 2, 3].map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setMaxPriceLevel(level)}
                    className={`px-5 py-4 rounded-xl border ${
                      maxPriceLevel === level
                        ? "border-table-teal"
                        : "border-table-border"
                    }`}
                  >
                    <Text
                      className={
                        maxPriceLevel === level
                          ? "text-table-teal font-bold"
                          : "text-table-cream"
                      }
                    >
                      {"€".repeat(level)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <>
              <Text className="text-lg font-bold text-table-cream mb-4">
                Dining style
              </Text>

              {[
                "casual",
                "family",
                "date-night",
                "business",
              ].map((style) => (
                <TouchableOpacity
                  key={style}
                  onPress={() =>
                    setDiningStyle(style as DiningStyle)
                  }
                  className={`p-4 rounded-xl border mb-3 ${
                    diningStyle === style
                      ? "border-table-teal"
                      : "border-table-border"
                  }`}
                >
                  <Text
                    className={
                      diningStyle === style
                        ? "text-table-teal font-bold"
                        : "text-table-cream"
                    }
                  >
                    {style
                      .replace("-", " ")
                      .replace(/\b\w/g, (c) =>
                        c.toUpperCase()
                      )}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
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

          {step < 2 ? (
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
