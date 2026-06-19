import { Stack } from "expo-router";
import "./../../global.css";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#09090b' },
        headerTintColor: '#fbf7f2',
        headerTitleStyle: { fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen name="index"          options={{ title: 'Tablé',       headerLargeTitle: false }} />
      <Stack.Screen name="map-view"       options={{ title: 'Live Map' }} />
      <Stack.Screen name="card-list-view" options={{ title: 'Restaurants' }} />
      <Stack.Screen name="profile"        options={{ title: 'Profile' }} />
    </Stack>
  );
}
