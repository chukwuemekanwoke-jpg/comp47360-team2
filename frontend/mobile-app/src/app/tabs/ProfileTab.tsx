import { Text, View, ActivityIndicator, TouchableOpacity, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { skipToken } from "@reduxjs/toolkit/query";
import { tableApi, useGetProfileQuery } from "@shared/apiSlice";
import { clearSession } from "@shared/authSlice";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import  BookingsProfile  from "@/components/BookingProfile";
import SignInPrompt from "@/components/SignInPrompt";

// Onboarding persists favourite cuisines and dining style together in
// dietaryTags (see onboarding.tsx) — split them back apart for display.
const DINING_STYLES = ["casual", "family", "date-night", "business"];
const TIER_PRICE_LEVEL: Record<string, number> = {
  TIER_1: 1,
  TIER_2: 2,
  TIER_3: 3,
};

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.userId);
  const { data: user, isLoading } = useGetProfileQuery(userId ?? skipToken);

  const signOut = () => {
    dispatch(clearSession());
    // Drop cached per-user data (profile, bookings, offers) so the next
    // account doesn't see the previous user's responses.
    dispatch(tableApi.util.resetApiState());
    router.replace("/");
  };

  const confirmSignOut = () => {
    // Alert.alert is a no-op on react-native-web.
    if (Platform.OS === "web") {
      if (window.confirm("Sign out of Tablé?")) signOut();
      return;
    }
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  // Guest browsing — the profile is a user-specific route.
  if (!userId) {
    return (
      <SignInPrompt message="Sign in to view your profile, preferences and bookings." />
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-table-canvas items-center justify-center">
        <ActivityIndicator color="#00f2fe" />
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-table-canvas items-center justify-center">
        <Text className="text-table-cream">
          No profile found.
        </Text>
        <TouchableOpacity onPress={confirmSignOut} className="mt-4">
          <Text className="text-table-teal text-sm font-bold">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profile = {
    name: user.displayName,
    favoriteCuisines: user.dietaryTags.filter((t) => !DINING_STYLES.includes(t)),
    diningStyle: user.dietaryTags.find((t) => DINING_STYLES.includes(t)) ?? "casual",
    maxPriceLevel: user.budgetTier ? TIER_PRICE_LEVEL[user.budgetTier] : 1,
  };

  return (
    <View className="flex-1 bg-table-canvas">
      <View className="flex-1 px-6 py-8">

        {/* Header */}
        <View className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4 border border-table-border"
            style={{ backgroundColor: "#90b7a8" }}
          >
            <Text style={{ fontSize: 32 }}>
              {profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text className="text-xl font-bold text-table-cream">
            {profile.name}
          </Text>

          <Text className="text-xs text-table-gold mt-1">
            Tablé Member
          </Text>
        </View>

        {/* Preferences */}
        <View className="bg-table-surface border border-table-border rounded-2xl p-4 mb-4">
          <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-3">
            Favourite Cuisines
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {profile.favoriteCuisines.map((cuisine) => (
              <View
                key={cuisine}
                className="px-3 py-2 rounded-xl border border-table-border"
              >
                <Text className="text-xs text-table-cream">
                  {cuisine}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Dining Preferences */}
        <View className="bg-table-surface border border-table-border rounded-2xl p-4 mb-4">
          <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-3">
            Dining Preferences
          </Text>

          <View className="mb-3">
            <Text className="text-table-gold text-[10px] uppercase">
              Budget
            </Text>

            <Text className="text-table-cream text-sm font-bold mt-1">
              {"€".repeat(profile.maxPriceLevel)}
            </Text>
          </View>

          <View>
            <Text className="text-table-gold text-[10px] uppercase">
              Dining Style
            </Text>

            <Text className="text-table-cream text-sm font-bold mt-1">
              {profile.diningStyle
                .replace("-", " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="bg-table-surface border border-table-border rounded-2xl p-4">
          <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-3">
            Account Summary
          </Text>

          <View className="flex-row">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-table-teal">
                {profile.favoriteCuisines.length}
              </Text>
              <Text className="text-xs text-table-cream">
                Cuisines
              </Text>
            </View>

            <View className="w-px bg-table-border" />

            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-table-teal">
                {"€".repeat(profile.maxPriceLevel)}
              </Text>
              <Text className="text-xs text-table-cream">
                Budget
              </Text>
            </View>
          </View>
        </View>
        <BookingsProfile/>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={confirmSignOut}
          activeOpacity={0.8}
          className="border border-table-border rounded-2xl py-3.5 items-center mt-4"
        >
          <Text className="text-red-400 text-sm font-bold uppercase tracking-widest">
            Sign Out
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}