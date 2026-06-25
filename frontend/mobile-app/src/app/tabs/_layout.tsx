import { Tabs } from "expo-router";

export default function TabsLayout() {
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
        name="map-view"
        options={{ title: "Map" }}
      />
      <Tabs.Screen
        name="card-list-view"
        options={{ title: "Restaurants" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
    </Tabs>
  );
}