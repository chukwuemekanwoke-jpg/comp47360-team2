import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import { toggleTravelMethod, toggleCuisine, setMaxBusyness } from "@shared/userSlice";
import { BUSYNESS_QUIET_MAX, BUSYNESS_BUSY_MAX } from "@shared/restaurantFilters";
import { CUISINES } from "@shared/constants";
import { TransportMode } from "@shared/types";
import { navColors } from "@/theme";
import { TRAVEL_METHODS } from "@shared/constants";

type IconName = keyof typeof Ionicons.glyphMap;

const BUSYNESS_OPTIONS: { label: string; icon: IconName; max: number | null }[] = [
  { label: "Quiet",    icon: "volume-low-outline", max: BUSYNESS_QUIET_MAX },
  { label: "Moderate", icon: "volume-medium-outline", max: BUSYNESS_BUSY_MAX },
  { label: "Any",      icon: "volume-high-outline", max: null },
];

export default function PreferenceFilters() {
  const dispatch = useAppDispatch();
  const selectedTravel = useAppSelector((state) => state.user.filters.travelMethods);
  const selectedCuisines = useAppSelector((state) => state.user.filters.cuisines);
  const maxBusyness = useAppSelector((state) => state.user.filters.maxBusyness);
  const colors = navColors[useAppSelector((state) => state.settings.theme)];

  const toggleTravel = (mode: TransportMode) => {
    dispatch(toggleTravelMethod(mode));
  };

  const toggleCuisineSelection = (cuisine: string) => {
    dispatch(toggleCuisine(cuisine));
  };

  // Inactive chips use table-* classes so they follow the session theme;
  // active chips tint with the (theme-resolved) accent via style props.
  const Chip = ({
    label, icon, active, onPress, accentColor,
  }: { label: string; icon?: IconName; active: boolean; onPress: () => void; accentColor: string }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center px-3 py-2 rounded-xl border ${
        active ? "" : "border-table-border bg-table-surface"
      }`}
      style={active ? { borderColor: accentColor, backgroundColor: accentColor + "18" } : undefined}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={13}
          color={active ? accentColor : colors.gold}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        className={`text-xs font-bold uppercase tracking-widest ${active ? "" : "text-table-gold"}`}
        style={active ? { color: accentColor } : undefined}
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
            icon={icon as IconName}
            active={selectedTravel.includes(mode)}
            onPress={() => toggleTravel(mode)}
            accentColor={colors.teal}
          />
        ))}
      </View>

      <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-2">
        Cuisine
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {CUISINES.map((label) => (
          <Chip
            key={label}
            label={label}
            active={selectedCuisines.includes(label.toLowerCase())}
            onPress={() => toggleCuisineSelection(label.toLowerCase())}
            accentColor={colors.offer}
          />
        ))}
      </View>

      <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-2">
        Busyness
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {BUSYNESS_OPTIONS.map(({ label, icon, max }) => (
          <Chip
            key={label}
            label={label}
            icon={icon}
            active={maxBusyness === max}
            onPress={() => dispatch(setMaxBusyness(max))}
            accentColor={colors.live}
          />
        ))}
      </View>
    </View>
  );
}
