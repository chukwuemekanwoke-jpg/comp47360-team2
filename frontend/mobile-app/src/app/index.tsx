import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert
} from "react-native";
import { router } from "expo-router";
import { useProfile } from "@/context/ProfileContext";
import { useCreateUserMutation, useUpdatePreferencesMutation } from "@shared/apiSlice";
import { setUserId } from "@shared/authSlice";
import { useAppDispatch } from "@shared/hooks";
import { registerForPushNotificationsAsync } from "@/services/pushNotifications";

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
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>([]);
  const [maxPriceLevel, setMaxPriceLevel] = useState(2);
  const [diningStyle, setDiningStyle] =
    useState<DiningStyle>("casual");

  const [radiusKm, setRadiusKm] = useState(10);

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

// RTK Query Mutation hooks
  const [triggerCreateUser] = useCreateUserMutation();
  const [triggerUpdatePreferences] = useUpdatePreferencesMutation();

  const finishOnboarding = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter a display name.");
      return;
    }

    try {
      // 1. Fire user creation with your existing dummyId mapped to the required header input
      const userResponse = await triggerCreateUser({  
        displayName: name,   // Payload body
      }).unwrap();

      // Provide some pause
      const realUserId = userResponse.id;
      dispatch(setUserId(realUserId));

      // Push notification integration point — stub only, see mobile-app/push-notifications.md
      registerForPushNotificationsAsync(realUserId);

      // 2. Fire preference mutations using the real userId
      await triggerUpdatePreferences({
        userId: realUserId,
        budgetTier: mapPriceToBudgetTier(maxPriceLevel),
        dietaryTags: [...favoriteCuisines, diningStyle],
        lastLat: 53.3498, // Fallback location context
        lastLng: -6.2603,
      }).unwrap();

      // 3. Update your local client-side profile state provider
      setProfile({
        id: realUserId,
        name,
        favoriteCuisines,
        maxPriceLevel,
        diningStyle,
        radiusKm,
      });

      Alert.alert("Welcome!", `Your profile has been created.`);
    } catch (error) {
      console.error("Onboarding server error:", error);
      Alert.alert("Error", "Could not complete registration. Please try again.");
    }
    router.replace("/tabs/MapTab");
  };

  return (
    <SafeAreaView className="flex-1 bg-table-canvas">
      <View className="flex-1 px-6 py-8 justify-between">
        <View>
          <Text className="text-table-gold text-xs font-bold uppercase tracking-[0.25em] mb-2">
            Step {step + 1} / 5
          </Text>

          <Text className="text-3xl font-bold text-table-cream mb-8">
            Welcome to Tablé
          </Text>
          {/* NOTE: Eventually Step 1 should be some sign-in, during MVP there is no backend auth */}
          {/* Onboarding - STEP 1 */}
          {step === 0 && (
            <>
              <Text className="text-lg font-bold text-table-cream mb-3">
                {"What's your name?"}
              </Text>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#888"
                className="border border-table-border bg-table-surface rounded-xl px-4 py-3 text-table-cream"
              />
            </>
          )}

          {/* STEP 2 */}
          {step === 1 && (
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

          {/* STEP 3 */}
          {step === 2 && (
            <>
              <Text className="text-lg font-bold text-table-cream mb-4">
                Preferred price range
              </Text>

              <View className="flex-row gap-3">
                {[1, 2, 3, 4].map((level) => (
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
                      {"$".repeat(level)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* STEP 4 */}
          {step === 3 && (
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

          {/* STEP 5 */}
          {step === 4 && (
            <>
              <Text className="text-lg font-bold text-table-cream mb-4">
                Search radius
              </Text>

              {[5, 10, 20, 50].map((radius) => (
                <TouchableOpacity
                  key={radius}
                  onPress={() => setRadiusKm(radius)}
                  className={`p-4 rounded-xl border mb-3 ${
                    radiusKm === radius
                      ? "border-table-teal"
                      : "border-table-border"
                  }`}
                >
                  <Text
                    className={
                      radiusKm === radius
                        ? "text-table-teal font-bold"
                        : "text-table-cream"
                    }
                  >
                    {radius} km
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

          {step < 4 ? (
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
              className="px-5 py-3 rounded-xl bg-table-teal"
            >
              <Text className="text-table-canvas font-bold">
                Continue
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}