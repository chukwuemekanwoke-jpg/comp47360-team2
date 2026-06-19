import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { useProfile } from "@/context/ProfileContext";

type DiningStyle =
  | "casual"
  | "family"
  | "date-night"
  | "business";

const CUISINES = [
  "Italian",
  "Indian",
  "Japanese",
  "Mexican",
  "Thai",
];

export default function OnboardingScreen() {
  const { setProfile } = useProfile();

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

  const finishOnboarding = () => {
    setProfile({
      name,
      favoriteCuisines,
      maxPriceLevel,
      diningStyle,
      radiusKm,
    });

    router.replace("/tabs/map-view");
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
                What's your name?
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