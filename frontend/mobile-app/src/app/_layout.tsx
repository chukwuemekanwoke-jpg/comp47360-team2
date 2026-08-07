import { useEffect, useMemo, useState } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ProfileProvider } from "@/context/ProfileContext";
import { Provider } from "react-redux";
import { store } from '@shared/store';
import { useAppSelector } from "@shared/hooks";
import { themeVars, navColors } from "@/theme";
import SettingsModal from "@/components/SettingsModal";
import "./../../global.css";

// Needs the redux provider above it (session theme lives in the settings
// slice), hence a child of RootLayout rather than the layout itself.
function ThemedApp() {
  const theme = useAppSelector((state) => state.settings.theme);
  const insets = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const colors = navColors[theme];

  // Re-point react surface to theme
  const navigationTheme = useMemo(() => {
    const base = theme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.canvas,
        card: colors.surface,
        border: colors.border,
        text: colors.cream,
        primary: colors.teal,
      },
    };
  }, [theme, colors]);

  // web only
  useEffect(() => {
    if (Platform.OS !== "web") return;
    document.body.style.backgroundColor = colors.canvas;
  }, [colors.canvas]);

  return (
    <ThemeProvider value={navigationTheme}>
    <View style={[{ flex: 1 }, themeVars[theme]]}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.cream,
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        {/* The tab navigator draws its own headers — hide the stack's
            default header (which would otherwise title this route "tabs"). */}
        <Stack.Screen name="tabs" options={{ headerShown: false }} />
      </Stack>

      {/* Floating session-settings button, present on every screen. */}
      <TouchableOpacity
        onPress={() => setSettingsOpen(true)}
        activeOpacity={0.8}
        className="absolute items-center justify-center w-10 h-10 rounded-full bg-table-surface border border-table-border"
        style={{ top: insets.top + 8, right: 16, zIndex: 50, elevation: 6 }}
        accessibilityLabel="Open settings"
      >
        <Ionicons name="settings-outline" size={18} color={colors.gold} />
      </TouchableOpacity>

      <SettingsModal isVisible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ProfileProvider>
        <ThemedApp />
      </ProfileProvider>
    </Provider>
  );
}
