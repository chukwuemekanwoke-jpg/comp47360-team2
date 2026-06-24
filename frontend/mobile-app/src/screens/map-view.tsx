import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import PreferenceFilters from '../components/preference-filters';

interface RestaurantMarker {
  id: string;
  name: string;
  cuisine: string;
  distance: string;
  waitTime: string;
  availability: number;
  busynessScore: number;
}

export default function MapViewScreen() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [restaurants] = useState<RestaurantMarker[]>([
    {
      id: '1',
      name: 'Mario\'s Pizzeria',
      cuisine: 'Italian',
      distance: '0.5 km',
      waitTime: '15 min',
      availability: 8,
      busynessScore: 45,
    },
    {
      id: '2',
      name: 'Taj Mahal',
      cuisine: 'Indian',
      distance: '1.2 km',
      waitTime: '20 min',
      availability: 5,
      busynessScore: 60,
    },
    {
      id: '3',
      name: 'Sakura Ramen',
      cuisine: 'Japanese',
      distance: '0.8 km',
      waitTime: '10 min',
      availability: 12,
      busynessScore: 30,
    },
  ]);

  const getBusynessColor = (score: number) => {
    if (score < 40) return '#4CAF50'; // Green
    if (score < 70) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manhattan Restaurants</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowPreferences(!showPreferences)}
        >
          <Text style={styles.filterButtonText}>⚙️ Filters</Text>
        </TouchableOpacity>
      </View>

      {showPreferences && (
        <View style={styles.preferencesSection}>
          <PreferenceFilters />
        </View>
      )}

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️ Map View</Text>
        <Text style={styles.mapSubtext}>
          {restaurants.length} restaurants nearby
        </Text>
        {restaurants.map(restaurant => (
          <View key={restaurant.id} style={styles.markerPreview}>
            <View
              style={[
                styles.marker,
                { backgroundColor: getBusynessColor(restaurant.busynessScore) },
              ]}
            />
            <Text style={styles.markerName}>{restaurant.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Nearby Restaurants</Text>
        <TouchableOpacity style={styles.listToggle}>
          <Text style={styles.listToggleText}>📋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.markersList}>
        {restaurants.map(restaurant => (
          <View key={restaurant.id} style={styles.markerCard}>
            <View
              style={[
                styles.markerIndicator,
                { backgroundColor: getBusynessColor(restaurant.busynessScore) },
              ]}
            />
            <View style={styles.markerInfo}>
              <Text style={styles.markerCardName}>{restaurant.name}</Text>
              <Text style={styles.markerCardCuisine}>{restaurant.cuisine}</Text>
              <View style={styles.detailsRow}>
                <Text style={styles.detail}>📍 {restaurant.distance}</Text>
                <Text style={styles.detail}>⏱️ {restaurant.waitTime}</Text>
              </View>
              <View style={styles.availabilityRow}>
                <Text style={styles.availability}>
                  Tables: {restaurant.availability} available
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  preferencesSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    margin: 16,
    position: 'relative',
  },
  mapText: {
    fontSize: 36,
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#666',
  },
  markerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerName: {
    fontSize: 12,
    color: '#666',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  listToggle: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  listToggleText: {
    fontSize: 18,
  },
  markersList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  markerCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  markerIndicator: {
    width: 4,
    height: '100%',
  },
  markerInfo: {
    flex: 1,
    padding: 12,
  },
  markerCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  markerCardCuisine: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  detail: {
    fontSize: 12,
    color: '#666',
  },
  availabilityRow: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  availability: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '500',
  },
  viewButton: {
    marginRight: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
