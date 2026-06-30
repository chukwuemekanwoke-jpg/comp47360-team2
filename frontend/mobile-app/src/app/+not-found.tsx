import { Link, Stack } from "expo-router";
import { View, Text} from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View className="flex-1 bg-table-canvas items-center justify-center px-8">
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🍽️</Text>
        <Text className="text-xl font-black text-table-cream mb-2">Table Not Found</Text>
        <Text className="text-xs text-table-gold text-center mb-8">
          {"This page doesn't exist — but there are plenty of great restaurants that do."}
        </Text> 
        <Link
          href="/tabs/map-view"
          className="bg-table-teal rounded-xl px-8 py-4"
        >
          <Text className="text-table-canvas text-sm font-bold uppercase tracking-widest">
            {"Back to Tablé"}
          </Text>
        </Link>
      </View>
    </>
  );
}
