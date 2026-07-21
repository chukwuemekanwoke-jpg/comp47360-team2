import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

interface SignInPromptProps {
  message: string;
}

// Shown in place of user-specific screens when browsing as a guest.
export default function SignInPrompt({ message }: SignInPromptProps) {
  return (
    <View className="flex-1 bg-table-canvas items-center justify-center px-6">
      <Text style={{ fontSize: 36, marginBottom: 12 }}>🔒</Text>
      <Text className="text-table-cream text-sm font-bold text-center mb-2">
        Sign in required
      </Text>
      <Text className="text-table-gold text-xs text-center leading-5 mb-6">
        {message}
      </Text>
      <TouchableOpacity
        onPress={() => router.replace("/")}
        className="bg-table-teal rounded-xl px-8 py-3"
        activeOpacity={0.8}
      >
        <Text className="text-table-canvas text-xs font-bold uppercase tracking-widest">
          Sign In
        </Text>
      </TouchableOpacity>
    </View>
  );
}
