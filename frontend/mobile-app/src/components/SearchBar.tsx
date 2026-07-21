import { TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@shared/hooks";
import { setSearchQuery } from "@shared/userSlice";
import { navColors } from "@/theme";

// Free-text restaurant search. The query lives in the shared user slice so
// the map, list and discover views all narrow on the same text.
export default function SearchBar() {
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector((state) => state.user.filters.searchQuery);
  const colors = navColors[useAppSelector((state) => state.settings.theme)];

  return (
    <View className="flex-1 flex-row items-center bg-table-surface border border-table-border rounded-xl px-3">
      <Ionicons name="search" size={14} color={colors.gold} />
      <TextInput
        value={searchQuery}
        onChangeText={(text) => dispatch(setSearchQuery(text))}
        placeholder="Search name, cuisine, area…"
        placeholderTextColor={colors.gold}
        autoCorrect={false}
        className="flex-1 px-2 py-2 text-xs"
        style={{ color: colors.cream }}
      />
      {searchQuery !== "" && (
        <TouchableOpacity onPress={() => dispatch(setSearchQuery(""))} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color={colors.gold} />
        </TouchableOpacity>
      )}
    </View>
  );
}
