import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import { toggleTravelMethod, toggleCuisine } from "@shared/userSlice";
import { TransportMode } from "@shared/types";

const TRAVEL_METHODS: { label: string; icon: string; mode: TransportMode }[] = [
  { label: "Walking", icon: "🚶", mode: "walking" },
  { label: "Driving", icon: "🚗", mode: "driving" },
  { label: "Transit", icon: "🚇", mode: "transit" },
];

const CUISINES = [
  { label: "Italian",    icon: "🍕" },
  { label: "Indian",     icon: "🍛" },
  { label: "Vietnamese", icon: "🍜" },
  { label: "Japanese",   icon: "🍱" },
  { label: "Mexican",    icon: "🌮" },
  { label: "Thai",       icon: "🥢" },
];

export default function PreferenceFilters() {
  const dispatch = useAppDispatch();
  const selectedTravel = useAppSelector((state) => state.user.filters.travelMethods);
  const selectedCuisines = useAppSelector((state) => state.user.filters.cuisines);

  const toggleTravel = (mode: TransportMode) => {
    dispatch(toggleTravelMethod(mode));
  };

  const toggleCuisineSelection = (cuisine: string) => {
    dispatch(toggleCuisine(cuisine));
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
        {TRAVEL_METHODS.map(({ label, icon, mode }) => (
          <Chip
            key={label}
            label={label}
            icon={icon}
            active={selectedTravel.includes(mode)}
            onPress={() => toggleTravel(mode)}
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
            active={selectedCuisines.includes(label.toLowerCase())}
            onPress={() => toggleCuisineSelection(label.toLowerCase())}
            accentColor="#f59e0b"
          />
        ))}
      </View>
    </View>
  );
}
