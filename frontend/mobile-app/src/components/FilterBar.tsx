import { ReactNode } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "@shared/hooks";
import { activeFilterCount } from "@shared/restaurantFilters";
import PreferenceFilters from "./PreferenceFilters";
import SearchBar from "./SearchBar";
import { navColors } from "@/theme";

interface FilterBarProps {
  /** Highlights the toggle while the panel is open. */
  active: boolean;
  onToggle: () => void;
}

// Search bar + filter toggle used on both the map and list views. The badge
// shows how many filters are narrowing the results, so filtering is never
// invisible while the panel is closed.
export default function FilterBar({ active, onToggle }: FilterBarProps) {
  const filters = useAppSelector((state) => state.user.filters);
  const colors = navColors[useAppSelector((state) => state.settings.theme)];
  const badgeCount = activeFilterCount(filters);

  return (
    <View className="flex-row items-center gap-2">
      <SearchBar />
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        className={`flex-row items-center px-3 py-2 rounded-xl border ${
          active ? "bg-table-teal/10 border-table-teal/30" : "bg-table-interactive border-table-border"
        }`}
      >
        <Ionicons name="options-outline" size={14} color={active ? colors.teal : colors.cream} />
        <Text
          className={`ml-1.5 text-[10px] font-bold uppercase tracking-widest ${
            active ? "text-table-teal" : "text-table-cream"
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
  );
}

interface FilterSheetProps {
  isVisible: boolean;
  onClose: () => void;
  /** Panel offset from the top of the screen — normally just under the bar. */
  top: number;
  /** Extra rows below the preference chips (e.g. the map's location controls). */
  children?: ReactNode;
}

// The filter panel, overlaid on the screen instead of pushed into the layout,
// so opening it never displaces the map or the list. Rendered in-tree rather
// than in a Modal to stay inside the theme cascade (see ModalSheet.web.tsx);
// mount it as a direct child of the screen's root view, since `top` is
// measured in that view's coordinates.
export function FilterSheet({ isVisible, onClose, top, children }: FilterSheetProps) {
  const windowHeight = useWindowDimensions().height;

  if (!isVisible) return null;

  return (
    <View className="absolute inset-0 z-[2000]" pointerEvents="box-none">
      <TouchableOpacity
        className="absolute inset-0 bg-black/60"
        onPress={onClose}
        activeOpacity={1}
      />

      <View
        className="mx-4 bg-table-canvas border border-table-border rounded-2xl p-4"
        style={{ marginTop: top, maxHeight: Math.max(windowHeight - top - 32, 200) }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <PreferenceFilters />
          {children && (
            <View className="mt-3 border-t border-table-border pt-3">{children}</View>
          )}
        </ScrollView>

        <TouchableOpacity
          className="mt-3 bg-table-teal rounded-xl py-2.5 items-center"
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text className="text-table-canvas text-xs font-bold uppercase tracking-widest">
            Apply
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
