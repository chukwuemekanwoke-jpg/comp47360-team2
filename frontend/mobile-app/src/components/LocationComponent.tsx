import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import { setLocation as setSharedLocation, setLocationError } from "@shared/userSlice";
import ManhattanAreaPicker from "./ManhattanAreaPicker";

export default function LocationComponent() {
  const dispatch = useAppDispatch();
  const location = useAppSelector((state) => state.user.location);
  const errorMsg = useAppSelector((state) => state.user.locationError);
  const locationEnabled = useAppSelector((state) => state.settings.locationEnabled);
  const [loading, setLoading] = useState(true); // Starts as true on mount
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  const fetchLocationData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        dispatch(setLocationError("Location denied. Choose a Manhattan area below or enable GPS in Settings."));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      dispatch(setSharedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
    } catch (e) {
      dispatch(setLocationError(e instanceof Error ? e.message : "Could not retrieve location."));
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    setLoading(true);
    fetchLocationData();
  };

  useEffect(() => {
    if (!locationEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    // Runs on mount and again whenever location is re-enabled in settings.
    setLoading(true);
    fetchLocationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationEnabled]);

  // Location switched off in the session settings — don't request GPS and
  // don't offer the manual picker; results fall back to the default area.
  if (!locationEnabled) {
    return (
      <View className="flex-row items-center gap-2">
        <View className="w-2 h-2 rounded-full bg-table-border" />
        <Text className="text-xs text-table-gold">
          Location is turned off in Settings.
        </Text>
      </View>
    );
  }

  // GPS denied/failed and no manual area chosen yet → offer the fallback.
  const needsManualFallback = !loading && !location;

  return (
    <View className="gap-3">
      {location ? (
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-table-live" />
          <Text className="text-xs text-table-cream font-bold">
            {location.label
              ? `${location.label}, Manhattan`
              : `${location.lat.toFixed(4)}°N, ${Math.abs(location.lng).toFixed(4)}°W`}
          </Text>
        </View>
      ) : errorMsg ? (
        <View className="flex-row items-start gap-2">
          <Text className="text-xs text-red-400 flex-1">{errorMsg}</Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-table-border" />
          <Text className="text-xs text-table-gold">
            {loading ? "Locating…" : "No location"}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={requestLocation}
        disabled={loading}
        activeOpacity={0.8}
        className={`py-2.5 rounded-xl items-center border ${
          loading
            ? "border-table-border"
            : "border-table-teal"
        }`}
        style={loading ? undefined : { backgroundColor: "#00f2fe18" }}
      >
        <Text className={`text-xs font-bold uppercase tracking-widest ${
          loading ? "text-table-gold" : "text-table-teal"
        }`}>
          {loading ? "Locating…" : "↺  Refresh"}
        </Text>
      </TouchableOpacity>

      {(needsManualFallback || location?.label) && (
        <TouchableOpacity
          onPress={() => setShowAreaPicker(true)}
          activeOpacity={0.8}
          className="py-2.5 rounded-xl items-center border border-table-gold/40"
        >
          <Text className="text-xs font-bold uppercase tracking-widest text-table-gold">
            {location?.label ? "Change Area" : "Choose an Area in Manhattan"}
          </Text>
        </TouchableOpacity>
      )}

      <ManhattanAreaPicker
        isVisible={showAreaPicker}
        onClose={() => setShowAreaPicker(false)}
      />
    </View>
  );
}
