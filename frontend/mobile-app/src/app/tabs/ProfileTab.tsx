import { useState } from "react";
import { Text, View, ActivityIndicator, TouchableOpacity, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { skipToken } from "@reduxjs/toolkit/query";
import { Ionicons } from "@expo/vector-icons";
import { tableApi, useGetProfileQuery } from "@shared/apiSlice";
import { clearSession } from "@shared/authSlice";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import BookingsProfile from "@/components/BookingProfile";
import EditPreferencesModal from "@/components/EditPreferencesModal";
import {
  DiningStyle,
  DINING_STYLES,
  TIER_PRICE_LEVEL,
  formatDiningStyle,
} from "@/components/PreferenceEditor";
import SignInPrompt from "@/components/SignInPrompt";
import { navColors } from "@/theme";

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.userId);
  const colors = navColors[useAppSelector((state) => state.settings.theme)];
  const { data: user, isLoading } = useGetProfileQuery(userId ?? skipToken);
  const [editingPreferences, setEditingPreferences] = useState(false);

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
        <ActivityIndicator color={colors.teal} />
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

  // Prefer the categorized fields introduced with user_preferences. The
  // dietaryTags fallback keeps the profile readable during a rolling deploy.
  const legacyCuisines = user.dietaryTags.filter(
    (tag) => !DINING_STYLES.includes(tag as DiningStyle)
  );
  const legacyDiningStyle = user.dietaryTags.find((tag) =>
    DINING_STYLES.includes(tag as DiningStyle)
  );
  const profile = {
    name: user.displayName,
    favoriteCuisines: user.preferredCuisines ?? legacyCuisines,
    diningStyle: (user.diningStyles?.[0] ?? legacyDiningStyle ?? "casual") as DiningStyle,
    maxPriceLevel: user.budgetTier ? TIER_PRICE_LEVEL[user.budgetTier] : 1,
  };

  // Everything above the bookings list scrolls with it — BookingsProfile's
  // FlatList is the single page scroller.
  const profileHeader = (
    <View>
      {/* Header */}
      <View className="items-center mb-8 mt-4">
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
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold">
            Favourite Cuisines
          </Text>
          <TouchableOpacity
            onPress={() => setEditingPreferences(true)}
            activeOpacity={0.7}
            className="flex-row items-center gap-1"
            hitSlop={8}
          >
            <Ionicons name="pencil" size={11} color={colors.teal} />
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-teal">
              Edit
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap gap-2">
          {profile.favoriteCuisines.length === 0 ? (
            <Text className="text-xs text-table-gold">No cuisines picked yet.</Text>
          ) : (
            profile.favoriteCuisines.map((cuisine) => (
              <View
                key={cuisine}
                className="px-3 py-2 rounded-xl border border-table-border"
              >
                <Text className="text-xs text-table-cream">
                  {cuisine}
                </Text>
              </View>
            ))
          )}
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
            {formatDiningStyle(profile.diningStyle)}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View className="bg-table-surface border border-table-border rounded-2xl p-4 mb-4">
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
    </View>
  );

  const profileFooter = (
    <TouchableOpacity
      onPress={confirmSignOut}
      activeOpacity={0.8}
      className="border border-table-border rounded-2xl py-3.5 items-center mt-4"
    >
      <Text className="text-red-400 text-sm font-bold uppercase tracking-widest">
        Sign Out
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-table-canvas">
      <BookingsProfile
        ListHeaderComponent={profileHeader}
        ListFooterComponent={profileFooter}
      />

      {/* Mounted per-open so the pickers prefill from the latest profile */}
      {editingPreferences && (
        <EditPreferencesModal
          isVisible={editingPreferences}
          onClose={() => setEditingPreferences(false)}
          initialCuisines={profile.favoriteCuisines}
          initialPriceLevel={profile.maxPriceLevel}
          initialDiningStyle={profile.diningStyle}
        />
      )}
    </View>
  );
}
