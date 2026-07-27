import { useState, useEffect } from "react";
import { Text, View, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import { setLocation as setSharedLocation, setLocationError } from "@shared/userSlice";
import { navColors } from "@/theme";

// Web port of LocationComponent. Two deliberate differences from native:
//   1. Browser Geolocation instead of expo-location.
//   2. The area picker is an inline collapsible panel rather than the
//      ManhattanAreaPicker modal — react-native-web's Modal portals into a
//      div on document.body, above the themeVars root, so the --table-*
//      custom properties never reach it and every table-* class resolves to
//      an invalid colour. Inline keeps it inside the theme cascade.
// Styling is otherwise the same Tailwind palette as the native components.

const MANHATTAN_AREAS: { name: string; lat: number; lng: number }[] = [
  { name: "Financial District", lat: 40.7075, lng: -74.0113 },
  { name: "Tribeca",            lat: 40.7163, lng: -74.0086 },
  { name: "Chinatown",          lat: 40.7158, lng: -73.997  },
  { name: "Lower East Side",    lat: 40.715,  lng: -73.9843 },
  { name: "SoHo",               lat: 40.7233, lng: -74.003  },
  { name: "Greenwich Village",  lat: 40.7336, lng: -74.0027 },
  { name: "East Village",       lat: 40.7265, lng: -73.9815 },
  { name: "Chelsea",            lat: 40.7465, lng: -74.0014 },
  { name: "Gramercy",           lat: 40.7368, lng: -73.9845 },
  { name: "Midtown",            lat: 40.7549, lng: -73.984  },
  { name: "Hell's Kitchen",     lat: 40.7638, lng: -73.9918 },
  { name: "Upper East Side",    lat: 40.7736, lng: -73.9566 },
  { name: "Upper West Side",    lat: 40.787,  lng: -73.9754 },
  { name: "Harlem",             lat: 40.8116, lng: -73.9465 },
];

export default function LocationComponent() {
  const dispatch = useAppDispatch();
  const location = useAppSelector((state) => state.user.location);
  const errorMsg = useAppSelector((state) => state.user.locationError);
  const locationEnabled = useAppSelector((state) => state.settings.locationEnabled);
  const theme = useAppSelector((state) => state.settings.theme);
  const colors = navColors[theme];
  const [loading, setLoading] = useState(true);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [search, setSearch] = useState("");

  const requestLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      dispatch(setLocationError("Geolocation unavailable. Choose a Manhattan area below."));
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        dispatch(
          setSharedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        );
        setLoading(false);
      },
      () => {
        dispatch(setLocationError("Location denied. Choose a Manhattan area below."));
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    if (!locationEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationEnabled]);

  // Location switched off in the session settings — don't request GPS and
  // don't offer the manual picker; results fall back to the default area.
  if (!locationEnabled) {
    return (
      <View className="flex-row items-center gap-2">
        <View className="w-2 h-2 rounded-full bg-table-border" />
        <Text className="text-xs text-table-gold">Location is turned off in Settings.</Text>
      </View>
    );
  }

  // GPS denied/failed and no manual area chosen yet → offer the fallback.
  const needsManualFallback = !loading && !location;

  const query = search.trim().toLowerCase();
  const areas = query
    ? MANHATTAN_AREAS.filter((a) => a.name.toLowerCase().includes(query))
    : MANHATTAN_AREAS;

  const selectArea = (area: { name: string; lat: number; lng: number }) => {
    dispatch(setSharedLocation({ lat: area.lat, lng: area.lng, label: area.name }));
    setSearch("");
    setShowAreaPicker(false);
  };

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
          loading ? "border-table-border" : "border-table-teal bg-table-teal/10"
        }`}
      >
        <Text
          className={`text-xs font-bold uppercase tracking-widest ${
            loading ? "text-table-gold" : "text-table-teal"
          }`}
        >
          {loading ? "Locating…" : "↺  Refresh"}
        </Text>
      </TouchableOpacity>

      {(needsManualFallback || location?.label) && (
        <>
          <TouchableOpacity
            onPress={() => setShowAreaPicker((open) => !open)}
            activeOpacity={0.8}
            className="py-2.5 rounded-xl items-center border border-table-gold/40"
          >
            <Text className="text-xs font-bold uppercase tracking-widest text-table-gold">
              {location?.label ? "Change Area" : "Choose an Area in Manhattan"}
            </Text>
          </TouchableOpacity>

          {showAreaPicker && (
            <View className="bg-table-canvas border border-table-border rounded-2xl p-4">
              <Text className="text-xs text-table-gold mb-3">
                Choose an area in Manhattan to explore instead.
              </Text>

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search neighbourhoods…"
                placeholderTextColor={colors.gold}
                autoCorrect={false}
                className="border border-table-border bg-table-surface rounded-xl px-4 py-3 text-table-cream mb-3"
              />

              <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
                {areas.length > 0 ? (
                  areas.map((area) => (
                    <TouchableOpacity
                      key={area.name}
                      onPress={() => selectArea(area)}
                      className="border border-table-border bg-table-surface rounded-xl px-4 py-3 mb-2"
                      activeOpacity={0.7}
                    >
                      <Text className="text-sm text-table-cream font-semibold">{area.name}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text className="text-table-gold text-xs text-center py-6">
                    No matching Manhattan neighbourhood.
                  </Text>
                )}
              </ScrollView>
            </View>
          )}
        </>
      )}
    </View>
  );
}
