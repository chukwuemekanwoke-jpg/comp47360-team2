import { Redirect, Tabs } from "expo-router";
import { useAppSelector } from "@shared/hooks";

export default function TabsLayout() {
  const userId = useAppSelector((state) => state.auth.userId);

  // Authentication gate — unauthenticated traffic goes back to login.
  if (!userId) {
    return <Redirect href="/" />;
  }

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
        options={{ title: "Map" }}
      />
      <Tabs.Screen
        name="CardTab"
        options={{ title: "Restaurants" }}
      />
      <Tabs.Screen
        name="ProfileTab"
        options={{ title: "Profile" }}
      />
      <Tabs.Screen
        name="InboxTab"
        options={{title: "Inbox"}}
      />
    </Tabs>
  );
}