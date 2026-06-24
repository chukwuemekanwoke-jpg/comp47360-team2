import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import * as Location from 'expo-location';

export default function LocationComponent() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestLocationPermission = async () => {
    try {
      // 1. Check current permission status
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      // 2. Handle denial state
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied. Please enable it in system settings.');
        return;
      }

      // 3. Retrieve coordinates if granted
      let currentPosition = await Location.getCurrentPositionAsync({});
      setLocation(currentPosition.coords);
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Failed to retrieve location');
      setLocation(null);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async permission/location request on mount
    requestLocationPermission();
  }, []);

  return (
    <View style={styles.container}>
      {errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : location ? (
        <Text>
          Latitude: {location.latitude}, Longitude: {location.longitude}
        </Text>
      ) : (
        <Text>No location found...</Text>
      )}
      <Button title="Refresh Location" onPress={requestLocationPermission} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10},
  errorText: { color: 'red', textAlign: 'center', marginHorizontal: 20 }
});