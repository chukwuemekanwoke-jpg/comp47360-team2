import { Stack } from "expo-router";
import { ProfileProvider } from "@/context/ProfileContext";
import { Provider } from "react-redux";
import { store } from '@shared/store';
import "./../../global.css";

export default function RootLayout() {
  return (
    <Provider store={store}>
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
          {/* The tab navigator draws its own headers — hide the stack's
              default header (which would otherwise title this route "tabs"). */}
          <Stack.Screen name="tabs" options={{ headerShown: false }} />
        </Stack>
      </ProfileProvider>
    </Provider>
  );
}