import { Modal, Switch, Text, TouchableOpacity, View } from "react-native";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import { setLocationEnabled, setTheme } from "@shared/settingsSlice";
import { clearLocation } from "@shared/userSlice";
import { navColors } from "@/theme";

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

// Session-only settings sheet — state lives in the redux settings slice
// (memory only), so everything here resets on the next app launch.
export default function SettingsModal({ isVisible, onClose }: SettingsModalProps) {
  const dispatch = useAppDispatch();
  const locationEnabled = useAppSelector((state) => state.settings.locationEnabled);
  const theme = useAppSelector((state) => state.settings.theme);
  const colors = navColors[theme];

  const handleLocationToggle = (enabled: boolean) => {
    dispatch(setLocationEnabled(enabled));
    // Drop the current GPS fix immediately so nothing keeps using it.
    if (!enabled) {
      dispatch(clearLocation());
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <TouchableOpacity className="flex-1" onPress={onClose} activeOpacity={1} />

        <View className="bg-table-canvas border-t border-table-border rounded-t-3xl p-6 pb-10">
          <View className="w-12 h-1 bg-table-border rounded-full mx-auto mb-4" />

          <Text className="text-lg font-bold text-table-cream mb-1">Settings</Text>
          <Text className="text-xs text-table-gold mb-5">
            Applies to this session only — resets when you restart the app.
          </Text>

          {/* Location */}
          <View className="bg-table-surface border border-table-border rounded-2xl p-4 mb-3 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-bold text-table-cream">Use device location</Text>
              <Text className="text-xs text-table-gold mt-1 leading-4">
                {locationEnabled
                  ? "Nearby results follow your GPS position."
                  : "Location is off. Results use a default area."}
              </Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              trackColor={{ false: colors.interactive, true: colors.teal + "55" }}
              thumbColor={locationEnabled ? colors.teal : colors.gold}
            />
          </View>

          {/* Theme */}
          <View className="bg-table-surface border border-table-border rounded-2xl p-4 mb-6 flex-row items-center justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-sm font-bold text-table-cream">Light mode</Text>
              <Text className="text-xs text-table-gold mt-1 leading-4">
                {theme === "light" ? "Bright palette is on." : "Using the dark palette."}
              </Text>
            </View>
            <Switch
              value={theme === "light"}
              onValueChange={(on) => {
                dispatch(setTheme(on ? "light" : "dark"));
              }}
              trackColor={{ false: colors.interactive, true: colors.teal + "55" }}
              thumbColor={theme === "light" ? colors.teal : colors.gold}
            />
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="border border-table-border rounded-xl py-3.5 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-table-cream text-xs font-bold uppercase tracking-widest">
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
