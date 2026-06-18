import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Provider } from "react-redux";

import LocationComponent from "../components/location-poc"

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.header}>
          <Text style={styles.title}>Tablé</Text>
          <Text style={styles.subtitle}>Customer & Business Views Mockup</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Service</Text>
          <LocationComponent/>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Views</Text>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/map-view")}
          >
            <Text style={styles.navButtonEmoji}>[MAP]</Text>
            <View style={styles.navButtonContent}>
              <Text style={styles.navButtonTitle}>Map View</Text>
              <Text style={styles.navButtonDesc}>Browse restaurants on map with real-time availability</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/card-list-view")}
          >
            <Text style={styles.navButtonEmoji}>[LIST]</Text>
            <View style={styles.navButtonContent}>
              <Text style={styles.navButtonTitle}>Card List View</Text>
              <Text style={styles.navButtonDesc}>Sortable list with restaurant details and flash deals</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Views</Text>
          
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/business-dashboard")}
          >
            <Text style={styles.navButtonEmoji}>[DASH]</Text>
            <View style={styles.navButtonContent}>
              <Text style={styles.navButtonTitle}>Business Dashboard</Text>
              <Text style={styles.navButtonDesc}>Manage flash deals and table availability</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Architecture Overview</Text>
          <Text style={styles.infoText}>
            These views demonstrate the shared page flow from the frontend strategy:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bullet}>• Preference filters for travel & cuisine</Text>
            <Text style={styles.bullet}>• Real-time map visualization with busyness scores</Text>
            <Text style={styles.bullet}>• Sortable card-based list view</Text>
            <Text style={styles.bullet}>• Flash deal management for businesses</Text>
            <Text style={styles.bullet}>• REST + WebSocket ready architecture</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  navButton: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  navButtonEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  navButtonContent: {
    flex: 1,
  },
  navButtonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  navButtonDesc: {
    fontSize: 12,
    color: "#666",
  },
  infoBox: {
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0d47a1",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#1565c0",
    marginBottom: 12,
  },
  bulletList: {
    gap: 6,
  },
  bullet: {
    fontSize: 12,
    color: "#1565c0",
  },
});
