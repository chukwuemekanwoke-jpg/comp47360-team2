import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native';

interface RestaurantCard {
  id: string;
  name: string;
  cuisine: string;
  distance: string;
  price: string;
  rating: number;
  availability: number;
  image?: string;
  hasFlashDeal?: boolean;
  dealLabel?: string;
}

type SortOption = 'relevance' | 'distance' | 'price';

export default function CardListViewScreen() {
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [restaurants] = useState<RestaurantCard[]>([
    {
      id: '1',
      name: 'Mario\'s Pizzeria',
      cuisine: 'Italian',
      distance: '0.5 km',
      price: '$$',
      rating: 4.5,
      availability: 8,
      hasFlashDeal: true,
      dealLabel: '20% off today',
    },
    {
      id: '2',
      name: 'Taj Mahal',
      cuisine: 'Indian',
      distance: '1.2 km',
      price: '$$',
      rating: 4.3,
      availability: 5,
    },
    {
      id: '3',
      name: 'Sakura Ramen',
      cuisine: 'Japanese',
      distance: '0.8 km',
      price: '$$$',
      rating: 4.7,
      availability: 12,
      hasFlashDeal: true,
      dealLabel: 'Happy Hour - 3pm to 6pm',
    },
    {
      id: '4',
      name: 'El Mariachi',
      cuisine: 'Mexican',
      distance: '1.5 km',
      price: '$$',
      rating: 4.4,
      availability: 3,
    },
    {
      id: '5',
      name: 'Thai Street',
      cuisine: 'Thai',
      distance: '0.3 km',
      price: '$',
      rating: 4.2,
      availability: 10,
    },
  ]);

  const renderSortOption = (label: string, value: SortOption) => (
    <TouchableOpacity
      style={[styles.sortOption, sortBy === value && styles.sortOptionActive]}
      onPress={() => setSortBy(value)}
    >
      <Text
        style={[
          styles.sortOptionText,
          sortBy === value && styles.sortOptionTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRestaurantCard = (restaurant: RestaurantCard) => (
    <View key={restaurant.id} style={styles.card}>
      <View style={styles.cardImagePlaceholder}>
        <Text style={styles.cardImageText}>🍽️</Text>
        {restaurant.hasFlashDeal && (
          <View style={styles.flashDealBadge}>
            <Text style={styles.flashDealText}>⚡ {restaurant.dealLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleSection}>
            <Text style={styles.cardTitle}>{restaurant.name}</Text>
            <Text style={styles.cardCuisine}>{restaurant.cuisine}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {restaurant.rating}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>{restaurant.distance}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>{restaurant.price}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Available</Text>
            <Text style={styles.detailValue}>{restaurant.availability}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Table</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Restaurants Near You</Text>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.sortOptions}>
            {renderSortOption('Relevance', 'relevance')}
            {renderSortOption('Distance', 'distance')}
            {renderSortOption('Price', 'price')}
          </View>
        </ScrollView>
      </View>

      <FlatList
        data={restaurants}
        renderItem={({ item }) => renderRestaurantCard(item)}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  sortContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  sortOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImagePlaceholder: {
    height: 180,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardImageText: {
    fontSize: 48,
  },
  flashDealBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  flashDealText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  cardCuisine: {
    fontSize: 13,
    color: '#666',
  },
  ratingBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
