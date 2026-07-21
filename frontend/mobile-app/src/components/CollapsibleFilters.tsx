import { ReactNode, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "@shared/hooks";
import { activeFilterCount } from "@shared/restaurantFilters";
import PreferenceFilters from "./PreferenceFilters";
import SearchBar from "./SearchBar";
import { navColors } from "@/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleFiltersProps {
  // Extra rows rendered inside the expanded panel below the preference chips
  // (e.g. the map tab's location controls).
  children?: ReactNode;
}

// Search bar + collapsible preference panel used on both the map and list
// views. The badge on the toggle shows how many filters are narrowing the
// results, so filtering is never invisible when the panel is collapsed.
export default function CollapsibleFilters({ children }: CollapsibleFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const filters = useAppSelector((state) => state.user.filters);
  const colors = navColors[useAppSelector((state) => state.settings.theme)];
  const badgeCount = activeFilterCount(filters);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View>
      <View className="flex-row items-center gap-2">
        <SearchBar />
        <TouchableOpacity
          onPress={toggle}
          activeOpacity={0.7}
          className={`flex-row items-center px-3 py-2 rounded-xl border ${
            expanded ? "bg-table-teal/10 border-table-teal/30" : "bg-table-interactive border-table-border"
          }`}
        >
          <Ionicons
            name="options-outline"
            size={14}
            color={expanded ? colors.teal : colors.cream}
          />
          <Text
            className={`ml-1.5 text-[10px] font-bold uppercase tracking-widest ${
              expanded ? "text-table-teal" : "text-table-cream"
            }`}
          >
            Filters
          </Text>
          {badgeCount > 0 && (
            <View
              className="ml-1.5 w-4 h-4 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.teal }}
            >
              <Text className="text-[9px] font-bold" style={{ color: colors.canvas }}>
                {badgeCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {expanded && (
        <View className="mt-3 bg-table-surface border border-table-border rounded-2xl p-4">
          <PreferenceFilters />
          {children && (
            <View className="mt-3 border-t border-table-border pt-3">{children}</View>
          )}
          <TouchableOpacity
            className="mt-3 bg-table-teal rounded-xl py-2.5 items-center"
            onPress={toggle}
            activeOpacity={0.8}
          >
            <Text className="text-table-canvas text-xs font-bold uppercase tracking-widest">
              Apply
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
