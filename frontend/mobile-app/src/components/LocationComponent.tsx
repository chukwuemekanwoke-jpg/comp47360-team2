import React, { useState, useEffect } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import * as Location from "expo-location";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import { setLocation as setSharedLocation, setLocationError } from "@shared/userSlice";

export default function LocationComponent() {
  const dispatch = useAppDispatch();
  const location = useAppSelector((state) => state.user.location);
  const errorMsg = useAppSelector((state) => state.user.locationError);
  const [loading, setLoading] = useState(true); // Starts as true on mount

  const fetchLocationData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        dispatch(setLocationError("Location denied. Enable it in Settings."));
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLocationData(); 
  }, []);

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
            {location.lat.toFixed(4)}°N, {Math.abs(location.lng).toFixed(4)}°W
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
