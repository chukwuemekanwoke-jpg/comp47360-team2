import RestaurantCard, {
  Restaurant,
} from "@/components/RestaurantCard";
import { useMemo, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";


const RESTAURANTS: Restaurant[] = [
  { id: "1", name: "Mario's Pizzeria", cuisine: "Italian",   cuisineEmoji: "🍕", distance: "0.5 km", distanceKm: 0.5, price: "$$",  priceLevel: 2, rating: 4.5, availability: 8,  hasFlashDeal: true, dealLabel: "20% off today", uri: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80" },
  { id: "2", name: "Taj Mahal",        cuisine: "Indian",    cuisineEmoji: "🍛", distance: "1.2 km", distanceKm: 1.2, price: "$$",  priceLevel: 2, rating: 4.3, availability: 5, uri: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80" },
  { id: "3", name: "Sakura Ramen",     cuisine: "Japanese",  cuisineEmoji: "🍱", distance: "0.8 km", distanceKm: 0.8, price: "$$$", priceLevel: 3, rating: 4.7, availability: 12, hasFlashDeal: true, dealLabel: "Happy Hour 3–6 pm", uri: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80" },
  { id: "4", name: "El Mariachi",      cuisine: "Mexican",   cuisineEmoji: "🌮", distance: "1.5 km", distanceKm: 1.5, price: "$$",  priceLevel: 2, rating: 4.4, availability: 3 , uri: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"},
  { id: "5", name: "Thai Street",      cuisine: "Thai",      cuisineEmoji: "🥢", distance: "0.3 km", distanceKm: 0.3, price: "$",   priceLevel: 1, rating: 4.2, availability: 10, uri: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80"},
];

type SortOption = "relevance" | "distance" | "price";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Distance",  value: "distance"  },
  { label: "Price",     value: "price"     },
];

export default function CardListView() {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");

  const sorted = useMemo(() => {
    const list = [...RESTAURANTS];
    if (sortBy === "distance")  list.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sortBy === "price")     list.sort((a, b) => a.priceLevel - b.priceLevel);
    if (sortBy === "relevance") list.sort((a) => (a.hasFlashDeal ? -1 : 1));
    return list;
  }, [sortBy]);

  const renderCard = ({ item }: { item: Restaurant }) => (
    <RestaurantCard
      restaurant={item}
      onBook={(restaurant) => {
      console.log("Book", restaurant.name);
    }}
  />
  );

  return (
    <View className="flex-1 bg-table-canvas">
      {/* Sort bar */}
      <View className="px-4 py-3 bg-table-surface border-b border-table-border">
        <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mb-2">
          Sort by
        </Text>
        <View className="flex-row gap-2">
          {SORT_OPTIONS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setSortBy(value)}
              activeOpacity={0.7}
              className={`px-4 py-2 rounded-xl border ${
                sortBy === value
                  ? "border-table-teal"
                  : "border-table-border bg-table-interactive"
              }`}
              style={sortBy === value ? { backgroundColor: "#00f2fe18" } : undefined}
            >
              <Text
                className={`text-xs font-bold uppercase tracking-widest ${
                  sortBy === value ? "text-table-teal" : "text-table-gold"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={sorted}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-3">
            {sorted.length} restaurants found
          </Text>
        }
      />
    </View>
  );
}
