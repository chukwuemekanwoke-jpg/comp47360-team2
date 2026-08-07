import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "@shared/hooks";
import { navColors } from "@/theme";

export default function TabsLayout() {
  const colors = navColors[useAppSelector((state) => state.settings.theme)];

  // No auth gate here — guests may browse the map and restaurant list.
  // User-specific screens (profile, inbox) and actions (booking) gate
  // themselves on auth.userId and render a SignInPrompt instead.
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.cream,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.gold,
        // `sceneStyle`, not `sceneContainerStyle` — the latter was silently
        // dropped (it is not a valid screen option in react-navigation v7), so
        // the tab scene container kept its stock light-grey background.
        sceneStyle: {
          backgroundColor: colors.canvas,
        },
      }}
    >
      <Tabs.Screen
        name="MapTab"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="DiscoverTab"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CardTab"
        options={{
          title: "Restaurants",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileTab"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="InboxTab"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}