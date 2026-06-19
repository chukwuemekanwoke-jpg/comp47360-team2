import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, FlatList } from "react-native";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  cuisineEmoji: string;
  distance: string;
  distanceKm: number;
  price: string;
  priceLevel: number;
  rating: number;
  availability: number;
  hasFlashDeal?: boolean;
  dealLabel?: string;
}

const RESTAURANTS: Restaurant[] = [
  { id: "1", name: "Mario's Pizzeria", cuisine: "Italian",   cuisineEmoji: "🍕", distance: "0.5 km", distanceKm: 0.5, price: "$$",  priceLevel: 2, rating: 4.5, availability: 8,  hasFlashDeal: true, dealLabel: "20% off today" },
  { id: "2", name: "Taj Mahal",        cuisine: "Indian",    cuisineEmoji: "🍛", distance: "1.2 km", distanceKm: 1.2, price: "$$",  priceLevel: 2, rating: 4.3, availability: 5 },
  { id: "3", name: "Sakura Ramen",     cuisine: "Japanese",  cuisineEmoji: "🍱", distance: "0.8 km", distanceKm: 0.8, price: "$$$", priceLevel: 3, rating: 4.7, availability: 12, hasFlashDeal: true, dealLabel: "Happy Hour 3–6 pm" },
  { id: "4", name: "El Mariachi",      cuisine: "Mexican",   cuisineEmoji: "🌮", distance: "1.5 km", distanceKm: 1.5, price: "$$",  priceLevel: 2, rating: 4.4, availability: 3 },
  { id: "5", name: "Thai Street",      cuisine: "Thai",      cuisineEmoji: "🥢", distance: "0.3 km", distanceKm: 0.3, price: "$",   priceLevel: 1, rating: 4.2, availability: 10 },
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

  const renderCard = ({ item: r }: { item: Restaurant }) => (
    <View className="bg-table-surface border border-table-border rounded-2xl overflow-hidden mb-3">
      {/* Emoji header */}
      <View className="h-36 bg-table-surface items-center justify-center relative border-b border-table-border">
        <Text style={{ fontSize: 52 }}>{r.cuisineEmoji}</Text>

        {r.hasFlashDeal && (
          <View className="absolute bottom-0 left-0 right-0 px-4 py-2"
            style={{ backgroundColor: "#f59e0b18", borderTopWidth: 1, borderTopColor: "#f59e0b40" }}>
            <Text className="text-table-offer text-xs font-bold">⚡ {r.dealLabel}</Text>
          </View>
        )}

        <View className="absolute top-3 right-3 bg-table-canvas/80 border border-table-border rounded-lg px-2 py-1 flex-row items-center gap-1">
          <Text style={{ fontSize: 10 }}>⭐</Text>
          <Text className="text-[11px] font-bold text-table-cream">{r.rating}</Text>
        </View>
      </View>

      {/* Body */}
      <View className="p-4">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-sm font-bold text-table-cream">{r.name}</Text>
            <Text className="text-xs text-table-gold mt-0.5">{r.cuisine}</Text>
          </View>
          <Text className="text-sm font-bold text-table-cream">{r.price}</Text>
        </View>

        {/* Stats row */}
        <View className="flex-row border-t border-table-border pt-3 mb-4">
          <View className="flex-1 items-center">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">Dist</Text>
            <Text className="text-xs font-bold text-table-cream">{r.distance}</Text>
          </View>
          <View className="w-px bg-table-border" />
          <View className="flex-1 items-center">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">Price</Text>
            <Text className="text-xs font-bold text-table-cream">{r.price}</Text>
          </View>
          <View className="w-px bg-table-border" />
          <View className="flex-1 items-center">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-gold mb-1">Free</Text>
            <Text
              className="text-xs font-bold"
              style={{ color: r.availability <= 3 ? "#f59e0b" : "#10b981" }}
            >
              {r.availability}{r.availability <= 3 ? " !" : ""}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="bg-table-teal rounded-xl py-3 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-table-canvas text-xs font-bold uppercase tracking-widest">
            Book Table
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-table-canvas">
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
    </SafeAreaView>
  );
}
