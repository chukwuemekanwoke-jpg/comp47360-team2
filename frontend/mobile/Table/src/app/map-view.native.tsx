import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { useRouter } from "expo-router";
import PreferenceFilters from "../components/preference-filters";

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  distance: string;
  waitTime: string;
  availability: number;
  busynessScore: number;
  latitude: number;
  longitude: number;
  hasFlashDeal?: boolean;
  dealLabel?: string;
}

const RESTAURANTS: Restaurant[] = [
  {
    id: "1", name: "Mario's Pizzeria", cuisine: "Italian",
    distance: "0.5 km", waitTime: "15 min", availability: 8, busynessScore: 45,
    latitude: 53.2707, longitude: -9.0568,
    hasFlashDeal: true, dealLabel: "20% off today",
  },
  {
    id: "2", name: "Taj Mahal", cuisine: "Indian",
    distance: "1.2 km", waitTime: "20 min", availability: 5, busynessScore: 60,
    latitude: 53.2722, longitude: -9.0521,
  },
  {
    id: "3", name: "Sakura Ramen", cuisine: "Japanese",
    distance: "0.8 km", waitTime: "10 min", availability: 12, busynessScore: 30,
    latitude: 53.2685, longitude: -9.0602,
  },
];

function busynessColor(score: number) {
  if (score < 40) return "#10b981"; // table-live
  if (score < 70) return "#f59e0b"; // table-offer
  return "#ef4444";
}

function busynessLabel(score: number) {
  if (score < 40) return "Quiet";
  if (score < 70) return "Busy";
  return "Packed";
}

export default function MapScreen() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-table-canvas">

      {/* ── Header card ── */}
      <View className="mx-4 mt-4 bg-table-surface border border-table-border rounded-2xl px-4 py-3 flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-bold text-table-cream">Live Restaurant Map</Text>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <View className="w-1.5 h-1.5 rounded-full bg-table-teal" />
            <Text className="text-[9px] font-bold uppercase tracking-widest text-table-teal">
              Real-time feed
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters((v) => !v)}
          className={`px-3 py-1.5 rounded-lg border ${
            showFilters
              ? "bg-table-teal/10 border-table-teal/30"
              : "bg-table-interactive border-table-border"
          }`}
          activeOpacity={0.7}
        >
          <Text className={`text-[10px] font-bold uppercase tracking-widest ${
            showFilters ? "text-table-teal" : "text-table-cream"
          }`}>
            Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Filters ── */}
      {showFilters && (
        <View className="mx-4 mt-3 bg-table-surface border border-table-border rounded-2xl p-4">
          <PreferenceFilters />
          <TouchableOpacity
            className="mt-3 bg-table-teal rounded-xl py-2.5 items-center"
            onPress={() => setShowFilters(false)}
            activeOpacity={0.8}
          >
            <Text className="text-table-canvas text-xs font-bold uppercase tracking-widest">
              Apply
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Map ── */}
      <View className="mx-4 mt-3 rounded-2xl overflow-hidden border border-table-border" style={{ height: 240 }}>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: 53.2707,
            longitude: -9.0568,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          customMapStyle={darkMapStyle}
        >
          {RESTAURANTS.map((r) => (
            <Marker
              key={r.id}
              coordinate={{ latitude: r.latitude, longitude: r.longitude }}
              pinColor={busynessColor(r.busynessScore)}
            >
              <Callout>
                <View style={{ width: 140, padding: 8 }}>
                  <Text style={{ fontWeight: "700", fontSize: 13 }}>{r.name}</Text>
                  <Text style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{r.cuisine}</Text>
                  <Text style={{ fontSize: 11, marginTop: 4 }}>⏱ {r.waitTime}</Text>
                  <Text style={{ fontSize: 11 }}>🪑 {r.availability} tables free</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* List toggle overlay */}
        <TouchableOpacity
          className="absolute bottom-3 right-3 bg-table-canvas/80 border border-table-border px-3 py-1.5 rounded-lg"
          onPress={() => router.push("/card-list-view")}
          activeOpacity={0.8}
        >
          <Text className="text-table-cream text-[10px] font-bold uppercase tracking-widest">
            List View
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Restaurant cards below map ── */}
      <Text className="text-[9px] font-bold uppercase tracking-[0.2em] text-table-gold mx-4 mt-5 mb-2">
        Nearby
      </Text>

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {RESTAURANTS.map((r) => (
          <View
            key={r.id}
            className="bg-table-surface border border-table-border rounded-2xl p-4 mb-3"
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-bold text-table-cream">{r.name}</Text>
                <Text className="text-xs text-table-gold mt-0.5">
                  {r.cuisine} · {r.distance}
                </Text>
              </View>
              <View
                className="px-2 py-1 rounded-lg"
                style={{ backgroundColor: busynessColor(r.busynessScore) + "18" }}
              >
                <Text
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: busynessColor(r.busynessScore) }}
                >
                  {busynessLabel(r.busynessScore)}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4 border-t border-table-border pt-2 mt-1">
              <Text className="text-xs text-table-gold">⏱ {r.waitTime}</Text>
              <Text className="text-xs text-table-gold">
                🪑{" "}
                <Text className="text-table-live font-bold">{r.availability} free</Text>
              </Text>
              {r.hasFlashDeal && (
                <Text className="text-xs text-table-offer font-bold">⚡ {r.dealLabel}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Minimal dark map style (subset of Google Maps dark style)
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a1a1aa" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#27272a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
