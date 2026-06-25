import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

export interface FilterState {
  travelMethods: string[];
  cuisines: string[];
}

interface PreferenceFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
}

const TRAVEL_METHODS = [
  { label: "Walking", icon: "🚶" },
  { label: "Driving", icon: "🚗" },
  { label: "Transit", icon: "🚇" },
];

const CUISINES = [
  { label: "Italian",    icon: "🍕" },
  { label: "Indian",     icon: "🍛" },
  { label: "Vietnamese", icon: "🍜" },
  { label: "Japanese",   icon: "🍱" },
  { label: "Mexican",    icon: "🌮" },
  { label: "Thai",       icon: "🥢" },
];

export default function PreferenceFilters({ onFiltersChange }: PreferenceFiltersProps) {
  const [selectedTravel,   setSelectedTravel]   = useState<string[]>(["Walking"]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(["Italian"]);

  const toggleTravel = (method: string) => {
    const updated = selectedTravel.includes(method)
      ? selectedTravel.filter((t) => t !== method)
      : [...selectedTravel, method];
    setSelectedTravel(updated);
    onFiltersChange?.({ travelMethods: updated, cuisines: selectedCuisines });
  };

  const toggleCuisine = (cuisine: string) => {
    const updated = selectedCuisines.includes(cuisine)
      ? selectedCuisines.filter((c) => c !== cuisine)
      : [...selectedCuisines, cuisine];
    setSelectedCuisines(updated);
    onFiltersChange?.({ travelMethods: selectedTravel, cuisines: updated });
  };

  const Chip = ({
    label, icon, active, onPress, accentColor,
  }: { label: string; icon: string; active: boolean; onPress: () => void; accentColor: string }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center px-3 py-2 rounded-xl border"
      style={{
        borderColor: active ? accentColor : "#27272a",
        backgroundColor: active ? accentColor + "18" : "#09090b",
      }}
    >
      <Text style={{ fontSize: 13, marginRight: 4 }}>{icon}</Text>
      <Text
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: active ? accentColor : "#a1a1aa" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-2">
        Travel Method
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {TRAVEL_METHODS.map(({ label, icon }) => (
          <Chip
            key={label}
            label={label}
            icon={icon}
            active={selectedTravel.includes(label)}
            onPress={() => toggleTravel(label)}
            accentColor="#00f2fe"
          />
        ))}
      </View>

      <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-2">
        Cuisine
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {CUISINES.map(({ label, icon }) => (
          <Chip
            key={label}
            label={label}
            icon={icon}
            active={selectedCuisines.includes(label)}
            onPress={() => toggleCuisine(label)}
            accentColor="#f59e0b"
          />
        ))}
      </View>
    </View>
  );
}
