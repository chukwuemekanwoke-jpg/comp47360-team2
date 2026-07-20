import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppDispatch } from "@shared/hooks";
import { setLocation } from "@shared/userSlice";

// Manual fallback for Story 2.2 (GPS denied): the user picks an area within
// Manhattan and discovery runs from its centroid. Client-side lookup because
// the backend's `neighborhood=` geocoding param is still P1/unimplemented
// (docs/api-contract-v0.md §6.2).
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

interface ManhattanAreaPickerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function ManhattanAreaPicker({ isVisible, onClose }: ManhattanAreaPickerProps) {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");

  const areas = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MANHATTAN_AREAS;
    return MANHATTAN_AREAS.filter((a) => a.name.toLowerCase().includes(query));
  }, [search]);

  const selectArea = (area: { name: string; lat: number; lng: number }) => {
    dispatch(setLocation({ lat: area.lat, lng: area.lng, label: area.name }));
    setSearch("");
    onClose();
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/60">
        <TouchableOpacity className="flex-1" onPress={onClose} activeOpacity={1} />

        <View className="bg-table-canvas border-t border-table-border rounded-t-3xl p-6 pb-8" style={{ maxHeight: "75%" }}>
          <View className="w-12 h-1 bg-table-border rounded-full mx-auto mb-4" />

          <Text className="text-lg font-bold text-table-cream">Location required</Text>
          <Text className="text-xs text-table-gold mt-1 mb-4">
            GPS is unavailable — choose an area in Manhattan to explore instead.
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search neighbourhoods…"
            placeholderTextColor="#888"
            autoCorrect={false}
            className="border border-table-border bg-table-surface rounded-xl px-4 py-3 text-table-cream mb-3"
          />

          <FlatList
            data={areas}
            keyExtractor={(item) => item.name}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text className="text-table-gold text-xs text-center py-6">
                No matching Manhattan neighbourhood.
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => selectArea(item)}
                className="border border-table-border bg-table-surface rounded-xl px-4 py-3 mb-2"
                activeOpacity={0.7}
              >
                <Text className="text-sm text-table-cream font-semibold">{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
