import { Stack } from "expo-router";
import { ProfileProvider } from "@/context/ProfileContext";
import "./../../global.css";

export default function RootLayout() {
  return (
    <ProfileProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#09090b' },
          headerTintColor: '#fbf7f2',
          headerTitleStyle: { fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
      </Stack>
    </ProfileProvider>
  );
}