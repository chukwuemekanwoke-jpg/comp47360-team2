export const OnboardingService = {
  /**
   * Dispatches restaurant account registration payloads to the backend database architecture.
   * * @param {Object} onboardingData - The collected form payload from registration views.
   * @param {string} onboardingData.email - The merchant's administrative email address.
   * @param {string} onboardingData.password - The authenticated password string.
   * @param {string} onboardingData.restaurantName - The public name of the food establishment.
   * @param {string} onboardingData.restaurantAddress - The physical location coordinates/street address.
   * @param {string} onboardingData.cuisineType - The primary cuisine classification descriptor.
   * @param {number} onboardingData.lat - Latitude (Required by your Postgres schema).
   * @param {number} onboardingData.lng - Longitude (Required by your Postgres schema).
   */
  registerRestaurant: async (onboardingData) => {
    try {
      // Updated to point to your actual local Express gateway (adjust port if necessary)
      const host = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
      const DATABASE_ENDPOINT = `${host}/api/v1/auth/register`;

      const response = await fetch(DATABASE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: onboardingData.email,
          password: onboardingData.password,
          name: onboardingData.restaurantName,
          address_line: onboardingData.restaurantAddress,
          cuisine_type: onboardingData.cuisineType,
          // Note: Your backend schema strictly requires lat/lng to create a restaurant
          latitude: onboardingData.lat || 0.0, 
          longitude: onboardingData.lng || 0.0
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.message || `Database transaction rejected with status: ${response.status}`);
      }

      // Expected return: { token: 'jwt...', userId: 'uuid', restaurantId: 'uuid' }
      return await response.json(); 
    } catch (error) {
      console.error("Critical Failure in Onboarding Database Persistence Layer:", error);
      throw error;
    }
  },

  /**
   * Dispatches structural room mapping, allergen specifications, and physical accessibility arrays.
   * * @param {Object} profileData - The aggregated onboarding configurations.
   * @param {string} profileData.restaurantId - The UUID returned from registerRestaurant.
   * @param {string} profileData.userId - The UUID of the manager making the request.
   * @param {Array} profileData.rooms - Array of configured merchant zones and rooms.
   * @param {Array} profileData.cuisines - Up to 5 selected specialized food classifications.
   * @param {Object} profileData.accessibility - Toggled physical access structures.
   * @param {Object} profileData.allergens - Active tracking systemic allergen matrices.
   */
  saveRestaurantProfile: async (profileData) => {
    try {
      const host = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
      // Injecting the restaurantId dynamically into the URL route
      const PROFILE_ENDPOINT = `${host}/api/v1/restaurants/${profileData.restaurantId}/profile`;
      
      const response = await fetch(PROFILE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-User-Id': profileData.userId // Required by requireUser.js middleware
        },
        body: JSON.stringify({
          rooms: profileData.rooms,
          cuisines: profileData.cuisines,
          is_wheelchair_accessible: profileData.accessibility?.wheelchair || false,
          sensory_friendly: profileData.accessibility?.sensory || false,
          allergens: profileData.allergens
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.message || `Failed to persist setup configurations: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Critical Failure in Profile Configuration Layer:", error);
      throw error;
    }
  }
};