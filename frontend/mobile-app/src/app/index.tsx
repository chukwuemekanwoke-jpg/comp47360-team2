import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Redirect, Stack, router } from "expo-router";
import { useLoginMutation, useRegisterMutation } from "@shared/apiSlice";
import { setSession } from "@shared/authSlice";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import { ApiError } from "@shared/types";
import { registerForPushNotificationsAsync } from "@/services/pushNotifications";

type Mode = "login" | "register";

function extractErrorMessage(err: unknown): string {
  const apiError = (err as { data?: ApiError })?.data;
  return apiError?.error?.message ?? "Something went wrong. Please try again.";
}

export default function AuthScreen() {
  const dispatch = useAppDispatch();
  const sessionUserId = useAppSelector((state) => state.auth.userId);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const isSubmitting = loggingIn || registering;

  // Already signed in (e.g. hot reload) — skip the gate.
  if (sessionUserId) {
    return <Redirect href="/tabs/MapTab" />;
  }

  const handleSubmit = async () => {
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Please enter your email and password.");
      return;
    }
    if (mode === "register" && !displayName.trim()) {
      setFormError("Please enter a display name.");
      return;
    }

    try {
      const session =
        mode === "login"
          ? await login({ email: email.trim(), password }).unwrap()
          : await register({
              email: email.trim(),
              password,
              displayName: displayName.trim(),
            }).unwrap();

      dispatch(
        setSession({
          userId: session.userId ?? session.user.id,
          token: session.token,
          displayName: session.user.displayName,
        })
      );

      // Push notification integration point — stub only, see mobile-app/push-notifications.md
      registerForPushNotificationsAsync(session.userId ?? session.user.id);

      // New accounts (and returning users who never finished onboarding)
      // go through the preference wizard; everyone else lands on the map.
      if (mode === "register" || !session.user.budgetTier) {
        router.replace("/onboarding");
      } else {
        router.replace("/tabs/MapTab");
      }
    } catch (err) {
      setFormError(extractErrorMessage(err));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-table-canvas">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          <Text className="text-5xl font-bold text-table-cream text-center mb-2">
            Tablé
          </Text>
          <Text className="text-sm text-table-gold text-center mb-10">
            Find your table
          </Text>

          {mode === "register" && (
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Display name"
              placeholderTextColor="#888"
              autoCapitalize="words"
              className="border border-table-border bg-table-surface rounded-xl px-4 py-3 text-table-cream mb-3"
            />
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="border border-table-border bg-table-surface rounded-xl px-4 py-3 text-table-cream mb-3"
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            className="border border-table-border bg-table-surface rounded-xl px-4 py-3 text-table-cream mb-4"
          />

          {formError && (
            <Text className="text-red-400 text-xs mb-4 text-center">{formError}</Text>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className="bg-table-teal rounded-xl py-3.5 items-center justify-center flex-row gap-2"
            activeOpacity={0.8}
            style={{ opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting && <ActivityIndicator size="small" color="#09090b" />}
            <Text className="text-table-canvas text-sm font-bold uppercase tracking-widest">
              {isSubmitting
                ? "One moment…"
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-xs text-table-gold">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setMode((m) => (m === "login" ? "register" : "login"));
                setFormError(null);
              }}
            >
              <Text className="text-xs text-table-teal font-bold">
                {mode === "login" ? "Create one" : "Sign in"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
