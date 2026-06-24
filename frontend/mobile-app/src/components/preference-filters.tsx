import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PreferenceFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
}

export interface FilterState {
  travelMethods: string[];
  cuisines: string[];
}

const TRAVEL_METHODS = ['Walking', 'Driving', 'Transit'];
const CUISINES = ['Italian', 'Indian', 'Vietnamese', 'Japanese', 'Mexican', 'Thai'];

export default function PreferenceFilters({ onFiltersChange }: PreferenceFiltersProps) {
  const [selectedTravel, setSelectedTravel] = useState<string[]>(['Walking']);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(['Italian']);

  const toggleTravel = (method: string) => {
    const updated = selectedTravel.includes(method)
      ? selectedTravel.filter(t => t !== method)
      : [...selectedTravel, method];
    setSelectedTravel(updated);
    onFiltersChange?.({ travelMethods: updated, cuisines: selectedCuisines });
  };

  const toggleCuisine = (cuisine: string) => {
    const updated = selectedCuisines.includes(cuisine)
      ? selectedCuisines.filter(c => c !== cuisine)
      : [...selectedCuisines, cuisine];
    setSelectedCuisines(updated);
    onFiltersChange?.({ travelMethods: selectedTravel, cuisines: updated });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Travel Method</Text>
      <View style={styles.chipContainer}>
        {TRAVEL_METHODS.map(method => (
          <TouchableOpacity
            key={method}
            style={[
              styles.chip,
              selectedTravel.includes(method) && styles.chipSelected,
            ]}
            onPress={() => toggleTravel(method)}
          >
            <Text
              style={[
                styles.chipText,
                selectedTravel.includes(method) && styles.chipTextSelected,
              ]}
            >
              {method}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Cuisine Preferences</Text>
      <View style={styles.chipContainer}>
        {CUISINES.map(cuisine => (
          <TouchableOpacity
            key={cuisine}
            style={[
              styles.chip,
              selectedCuisines.includes(cuisine) && styles.chipSelected,
            ]}
            onPress={() => toggleCuisine(cuisine)}
          >
            <Text
              style={[
                styles.chipText,
                selectedCuisines.includes(cuisine) && styles.chipTextSelected,
              ]}
            >
              {cuisine}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chipSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  chipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#007AFF',
  },
});
