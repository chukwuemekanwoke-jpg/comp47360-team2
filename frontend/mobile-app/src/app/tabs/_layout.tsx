import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  // No auth gate here — guests may browse the map and restaurant list.
  // User-specific screens (profile, inbox) and actions (booking) gate
  // themselves on auth.userId and render a SignInPrompt instead.
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#09090b" },
        headerTintColor: "#fbf7f2",
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#09090b",
          borderTopColor: "#222",
        },
        tabBarActiveTintColor: "#00f2fe",
        tabBarInactiveTintColor: "#aaa",
        sceneContainerStyle: {
          backgroundColor: "#09090b",
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