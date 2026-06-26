export const OnboardingService = {
  /**
   * Dispatches restaurant account registration payloads to the backend database architecture.
   * * @param {Object} onboardingData - The collected form payload from registration views.
   * @param {string} onboardingData.email - The merchant's administrative email address.
   * @param {string} onboardingData.password - The authenticated password string.
   * @param {string} onboardingData.restaurantName - The public name of the food establishment.
   * @param {string} onboardingData.restaurantAddress - The physical location coordinates/street address.
   * @param {string} onboardingData.cuisineType - The primary cuisine classification descriptor.
   */
  registerRestaurant: async (onboardingData) => {
    try {
      const DATABASE_ENDPOINT = 'https://api.table-gateway.local/v1/merchant/register';

      const response = await fetch(DATABASE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: onboardingData.email,
          password: onboardingData.password,
          restaurant_name: onboardingData.restaurantName,
          address: onboardingData.restaurantAddress,
          cuisine_type: onboardingData.cuisineType
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.message || `Database transaction rejected with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Critical Failure in Onboarding Database Persistence Layer:", error);
      throw error;
    }
  },

  /**
   * Dispatches structural room mapping, allergen specifications, and physical accessibility arrays.
   * * @param {Object} profileData - The aggregated onboarding configurations.
   * @param {string} profileData.email - Associated administrative token identifier.
   * @param {Array} profileData.rooms - Array of configured merchant zones and rooms.
   * @param {Array} profileData.cuisines - Up to 5 selected specialized food classifications.
   * @param {Object} profileData.accessibility - Toggled physical access structures.
   * @param {Object} profileData.allergens - Active tracking systemic allergen matrices.
   */
  saveRestaurantProfile: async (profileData) => {
    try {
      const PROFILE_ENDPOINT = 'https://api.table-gateway.local/v1/merchant/profile/setup';
      
      const response = await fetch(PROFILE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: profileData.email,
          rooms: profileData.rooms,
          cuisines: profileData.cuisines,
          accessibility: profileData.accessibility,
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