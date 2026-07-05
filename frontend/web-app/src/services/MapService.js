/**
 * Tablé Merchant Radar Map Layer Service Handler
 */

export const MapService = {
  /**
   * Fetches mock localized active diners situated near the target restaurant parameters
   */
  async getNearbyDiners() {
    // Simulating remote data fetch with structured mock responses matching your UI dependencies
    return [
      { id: 'guest-101', name: 'Marcus Aurelius', lat: 40.7585, lng: -73.9845, distance: '120m', status: 'Active Walking' },
      { id: 'guest-102', name: 'Seneca Elder', lat: 40.7572, lng: -73.9860, distance: '340m', status: 'Approaching Vehicle' },
      { id: 'guest-103', name: 'Hypatia Alexandria', lat: 40.7591, lng: -73.9830, distance: '610m', status: 'Stationary Delayed' }
    ];
  },

  /**
   * Initializes a map instance on a target HTML container element
   */
  initializeMap(containerId, centerCoordinates = [-73.935242, 40.730610], zoomLevel = 13) {
    if (!containerId) throw new Error("Map initialization container target element ID is required.");
    
    console.log(`🌐 Spatial Radar Map initialized inside element #${containerId}`);
    
    return {
      containerId,
      center: centerCoordinates,
      zoom: zoomLevel,
      markers: [],
      destroyed: false
    };
  },

  /**
   * Drops a localized custom push-pin or marker onto an active map instance grid matrix
   */
  addRadarMarker(mapInstance, markerData) {
    if (!mapInstance || mapInstance.destroyed) return null;

    const nextId = markerData.id || `marker-${Math.random().toString(36).substr(2, 9)}`;
    const newMarker = {
      id: nextId,
      coordinates: markerData.coordinates || [0, 0],
      title: markerData.title || "Target Node"
    };

    mapInstance.markers.push(newMarker);
    return newMarker;
  },

  /**
   * Clears a batch collection of tracking markers from the active view state layer
   */
  clearAllMarkers(mapInstance) {
    if (!mapInstance) return;
    mapInstance.markers = [];
  },

  /**
   * Completely tears down map references to prevent lingering canvas memory leaks
   */
  destroyMapInstance(mapInstance) {
    if (!mapInstance) return;
    mapInstance.destroyed = true;
    mapInstance.markers = [];
  }
};

// Fail-safe default export addition
export default MapService;