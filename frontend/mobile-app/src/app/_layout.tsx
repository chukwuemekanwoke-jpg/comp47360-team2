import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="map-view" options={{ title: 'Map View' }} />
      <Stack.Screen name="card-list-view" options={{ title: 'List View' }} />
      <Stack.Screen name="business-dashboard" options={{ title: 'Business' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile'}} />
    </Stack>
  );
}
