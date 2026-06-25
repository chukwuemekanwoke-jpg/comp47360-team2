import { Text, View, SafeAreaView } from "react-native";
import { useProfile } from "@/context/ProfileContext";

export default function ProfileScreen() {
  const { profile } = useProfile();

  if (!profile) {
    return (
      <View className="flex-1 bg-table-canvas items-center justify-center">
        <Text className="text-table-cream">
          No profile found.
        </Text>
      </View>
    );
  }

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
              {"$".repeat(profile.maxPriceLevel)}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-table-gold text-[10px] uppercase">
              Dining Style
            </Text>

            <Text className="text-table-cream text-sm font-bold mt-1">
              {profile.diningStyle
                .replace("-", " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </View>

          <View>
            <Text className="text-table-gold text-[10px] uppercase">
              Search Radius
            </Text>

            <Text className="text-table-cream text-sm font-bold mt-1">
              {profile.radiusKm} km
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
                {profile.radiusKm}
              </Text>
              <Text className="text-xs text-table-cream">
                KM Radius
              </Text>
            </View>

            <View className="w-px bg-table-border" />

            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-table-teal">
                {"$".repeat(profile.maxPriceLevel)}
              </Text>
              <Text className="text-xs text-table-cream">
                Budget
              </Text>
            </View>
          </View>
        </View>

      </View>
    </View>
  );
}