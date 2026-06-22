import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';

interface FlashDeal {
  id: string;
  title: string;
  discount: string;
  expiresIn: string;
  tablesReserved: number;
  status: 'active' | 'scheduled' | 'expired';
}

export default function BusinessDashboard() {
  const router = useRouter();
  const [deals, setDeals] = useState<FlashDeal[]>([
    {
      id: '1',
      title: '20% off during lunch',
      discount: '20%',
      expiresIn: '2 hours',
      tablesReserved: 12,
      status: 'active',
    },
    {
      id: '2',
      title: 'Happy hour - free appetizer',
      discount: 'Appetizer',
      expiresIn: '5 hours',
      tablesReserved: 8,
      status: 'active',
    },
    {
      id: '3',
      title: 'Early bird special',
      discount: '15% off',
      expiresIn: 'Tomorrow 5pm',
      tablesReserved: 0,
      status: 'scheduled',
    },
  ]);

  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealDiscount, setNewDealDiscount] = useState('');

  const handleCreateDeal = () => {
    if (newDealTitle && newDealDiscount) {
      const newDeal: FlashDeal = {
        id: String(deals.length + 1),
        title: newDealTitle,
        discount: newDealDiscount,
        expiresIn: 'Soon',
        tablesReserved: 0,
        status: 'scheduled',
      };
      setDeals([...deals, newDeal]);
      setNewDealTitle('');
      setNewDealDiscount('');
    }
  };

  const getStatusColor = (status: FlashDeal['status']) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'scheduled':
        return '#FFC107';
      case 'expired':
        return '#999';
      default:
        return '#999';
    }
  };

  const renderDealCard = (deal: FlashDeal) => (
    <View key={deal.id} style={styles.dealCard}>
      <View style={styles.dealHeader}>
        <View style={styles.dealTitleSection}>
          <Text style={styles.dealTitle}>{deal.title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(deal.status) },
            ]}
          >
            <Text style={styles.statusText}>{deal.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{deal.discount}</Text>
        </View>
      </View>

      <View style={styles.dealDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Expires</Text>
          <Text style={styles.detailValue}>{deal.expiresIn}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Reserved</Text>
          <Text style={styles.detailValue}>{deal.tablesReserved} tables</Text>
        </View>
      </View>

      <View style={styles.dealActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
        >
          <Text style={styles.actionButtonDangerText}>Deactivate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const activeDealCount = deals.filter(d => d.status === 'active').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Business Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your restaurant deals</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeDealCount}</Text>
            <Text style={styles.statLabel}>Active Deals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {deals.reduce((sum, d) => sum + d.tablesReserved, 0)}
            </Text>
            <Text style={styles.statLabel}>Tables Reserved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{deals.length}</Text>
            <Text style={styles.statLabel}>Total Deals</Text>
          </View>
        </View>

        <View style={styles.createDealSection}>
          <Text style={styles.sectionTitle}>Create New Flash Deal</Text>

          <TextInput
            style={styles.input}
            placeholder="Deal title (e.g., '20% off lunch')"
            placeholderTextColor="#999"
            value={newDealTitle}
            onChangeText={setNewDealTitle}
          />

          <TextInput
            style={styles.input}
            placeholder="Discount (e.g., '20%', 'Free appetizer')"
            placeholderTextColor="#999"
            value={newDealDiscount}
            onChangeText={setNewDealDiscount}
          />

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateDeal}
          >
            <Text style={styles.createButtonText}>+ Create Deal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dealsSection}>
          <Text style={styles.sectionTitle}>Your Flash Deals</Text>
          <View style={styles.dealsList}>
            {deals.map(deal => renderDealCard(deal))}
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  createDealSection: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  createButton: {
    backgroundColor: '#28a745',
    borderRadius: 6,
    paddingVertical: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dealsSection: {
    marginBottom: 24,
  },
  dealsList: {
    gap: 12,
  },
  dealCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dealTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  dealTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  discountBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  discountText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dealDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailItem: {
    flex: 1,
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
  dealActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtonDanger: {
    borderColor: '#FF6B6B',
  },
  actionButtonDangerText: {
    color: '#FF6B6B',
  },
});
