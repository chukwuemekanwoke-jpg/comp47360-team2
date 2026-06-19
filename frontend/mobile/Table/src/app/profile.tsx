import { Text, View, TouchableOpacity, SafeAreaView } from "react-native";

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-table-canvas">
      <View className="flex-1 px-6 justify-center">

        {/* Avatar */}
        <View className="items-center mb-8">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4 border border-table-border"
            style={{ backgroundColor: "#09090b" }}
          >
            <Text style={{ fontSize: 32 }}>👤</Text>
          </View>
          <Text className="text-lg font-bold text-table-cream">Your Profile</Text>
          <Text className="text-xs text-table-gold text-center mt-1" style={{ maxWidth: 240 }}>
            Sign in to save preferences and view booking history
          </Text>
        </View>

        {/* Auth buttons */}
        <TouchableOpacity
          className="bg-table-teal rounded-xl py-4 items-center mb-3"
          activeOpacity={0.8}
        >
          <Text className="text-table-canvas text-sm font-bold uppercase tracking-widest">
            Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-table-border rounded-xl py-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-table-cream text-sm font-bold uppercase tracking-widest">
            Create Account
          </Text>
        </TouchableOpacity>

        {/* Feature list */}
        <View className="mt-8 bg-table-surface border border-table-border rounded-2xl p-4">
          <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-3">
            Member Benefits
          </Text>
          {[
            "Save cuisine & travel preferences",
            "View booking history",
            "Receive flash deal alerts",
          ].map((item, i) => (
            <View key={i} className="flex-row items-center gap-2 mb-2">
              <View className="w-1 h-1 rounded-full bg-table-teal" />
              <Text className="text-xs text-table-cream">{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
