import { Text, View, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import LocationComponent from "../components/location-poc";

interface NavItem {
  route: string;
  label: string;
  sublabel: string;
  tag?: string;
  tagColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    route: "/map-view",
    label: "Live Map",
    sublabel: "Real-time busyness & availability",
    tag: "LIVE",
    tagColor: "text-table-teal",
  },
  {
    route: "/card-list-view",
    label: "Restaurants",
    sublabel: "Sortable list with flash deals",
  },
  {
    route: "/profile",
    label: "Profile",
    sublabel: "Sign in to save preferences",
  },
];

const STATS = [
  { value: "142", label: "Active Tables" },
  { value: "38", label: "Flash Deals" },
  { value: "4.6★", label: "Avg Rating" },
];

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-table-canvas">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Wordmark ── */}
        <View className="mb-8">
          <Text
            className="text-4xl font-black text-table-cream tracking-tight"
            style={{ letterSpacing: -1 }}
          >
            Tablé
          </Text>
          <Text className="text-[10px] font-bold uppercase tracking-[0.25em] text-table-gold mt-1">
            Manhattan · Real-Time Dining
          </Text>
        </View>

        {/* ── Live stats strip (mirrors AnalyticsView metric row) ── */}
        <View className="flex-row gap-3 mb-6">
          {STATS.map(({ value, label }) => (
            <View
              key={label}
              className="flex-1 bg-table-surface border border-table-border rounded-2xl px-3 py-4"
            >
              <Text className="text-xl font-black text-table-teal">{value}</Text>
              <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mt-0.5">
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Location ── */}
        <View className="bg-table-surface border border-table-border rounded-2xl p-4 mb-6">
          <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-3">
            Your Location
          </Text>
          <LocationComponent />
        </View>

        {/* ── Navigation ── */}
        <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-3">
          Navigate
        </Text>
        <View className="gap-3">
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
              className="bg-table-surface border border-table-border rounded-2xl p-4 flex-row items-center"
            >
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-sm font-bold text-table-cream">
                    {item.label}
                  </Text>
                  {item.tag && (
                    <View className="bg-table-teal/10 border border-table-teal/20 rounded px-1.5 py-0.5">
                      <Text className={`text-[9px] font-bold tracking-widest ${item.tagColor}`}>
                        {item.tag}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-table-gold">{item.sublabel}</Text>
              </View>
              <Text className="text-table-interactive text-lg">›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
