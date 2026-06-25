import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import * as Location from "expo-location";

export default function LocationComponent() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Location denied. Enable it in Settings.");
        setLocation(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation(pos.coords);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Could not retrieve location.");
      setLocation(null);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD:frontend/mobile/Table/src/components/location-poc.tsx
  useEffect(() => { requestLocation(); }, []);
=======
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async permission/location request on mount
    requestLocationPermission();
  }, []);
>>>>>>> fbaabb14956aa2e7f62602c5a2c7892e7b85ab53:frontend/mobile-app/src/components/location-poc.tsx

  return (
    <View className="gap-3">
      {errorMsg ? (
        <View className="flex-row items-start gap-2">
          <Text className="text-xs text-red-400 flex-1">{errorMsg}</Text>
        </View>
      ) : location ? (
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-table-live" />
          <Text className="text-xs text-table-cream font-bold">
            {location.latitude.toFixed(4)}°N, {Math.abs(location.longitude).toFixed(4)}°W
          </Text>
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
    </View>
  );
}
