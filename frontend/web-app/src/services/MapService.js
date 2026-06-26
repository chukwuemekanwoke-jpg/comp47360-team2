// src/services/MapService.js

export const MapService = {
  /**
   * FUTURE: Will call Google Places API mixed with our internal DB 
   * to get restaurant data and accessibility metrics.
   */
  // eslint-disable-next-line no-unused-vars
  getPlaces: async (searchQuery, location) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          // We will eventually populate this with real Google Places payloads
          { id: 1, name: "Osteria Morini", lat: 40.7225, lng: -74.0001, hasLullDeal: true },
        ]);
      }, 500); // simulate 500ms network delay
    });
  },

  /**
   * FUTURE: Will poll our backend WebSockets or Redis cache 
   * for live, opted-in user GPS coordinates.
   */
  // eslint-disable-next-line no-unused-vars
  getNearbyDiners: async (centerCoords, radiusInMiles) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 'u1', name: 'Alex M.', lat: 40.7590, lng: -73.9845, distance: '0.1 mi', status: 'Active Walking' }, 
          { id: 'u2', name: 'Sarah T.', lat: 40.7565, lng: -73.9870, distance: '0.3 mi', status: 'Active Walking' }, 
          { id: 'u3', name: 'Jordan K.', lat: 40.7542, lng: -73.9820, distance: '0.6 mi', status: 'Stationary' }, 
        ]);
      }, 800); // simulate 800ms network delay
    });
  }
};