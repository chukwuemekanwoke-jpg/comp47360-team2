/**
 * Tablé Merchant Dashboard API Service Handler
 */

// Helper to securely attach Auth Tokens to all requests
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('table_merchant_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, { ...options, headers });
  
  // Auto-handle unauthorized token expiration by forcing a re-login
  if (response.status === 401) {
    localStorage.removeItem('table_merchant_token');
    localStorage.removeItem('table_restaurant_id');
    window.location.reload(); 
    throw new Error("Session expired. Please log in again.");
  }

  return response;
}

export const MerchantService = {
  /**
   * Fetches the core profile metadata for the restaurant
   */
  async getRestaurantDetails(restaurantId) {
    if (!restaurantId) throw new Error("Missing restaurant ID for context.");
    const response = await apiFetch(`/api/v1/restaurants/${restaurantId}`);
    if (!response.ok) throw new Error("Failed to retrieve restaurant metadata.");
    return await response.json();
  },

  /**
   * Fetches the complete spatial layout configuration (Rooms and Tables)
   */
  async getFloorPlan(restaurantId) {
    if (!restaurantId) throw new Error("Missing restaurant ID for context.");
    const response = await apiFetch(`/api/v1/restaurants/${restaurantId}/floorplan`);
    if (!response.ok) throw new Error("Failed to fetch floor plan layout.");
    return await response.json(); // Expects: { rooms: [...], tables: [...] }
  },

  /**
   * Commits a brand new room structure to the platform database
   */
  async createRoom(restaurantId, roomData) {
    if (!restaurantId) throw new Error("Missing restaurant ID for context.");
    const response = await apiFetch(`/api/v1/restaurants/${restaurantId}/rooms`, {
      method: "POST",
      body: JSON.stringify(roomData)
    });
    if (!response.ok) throw new Error("Failed to save room configuration.");
    return await response.json();
  },

  /**
   * Updates an existing room configuration details (e.g., custom labels)
   */
  async updateRoom(roomId, roomData) {
    const response = await apiFetch(`/api/v1/rooms/${roomId}`, {
      method: "PUT",
      body: JSON.stringify(roomData)
    });
    if (!response.ok) throw new Error("Failed to modify room record.");
    return await response.json();
  },

  /**
   * Removes a room record completely from the data grid
   */
  async deleteRoom(roomId) {
    const response = await apiFetch(`/api/v1/rooms/${roomId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to drop room record.");
    return await response.json();
  },

  /**
   * Provisions a brand new physical table entity inside a room
   */
  async createTable(restaurantId, tableData) {
    if (!restaurantId) throw new Error("Missing restaurant ID for context.");
    const response = await apiFetch(`/api/v1/restaurants/${restaurantId}/tables`, {
      method: "POST",
      body: JSON.stringify(tableData)
    });
    if (!response.ok) throw new Error("Failed to provision new table.");
    return await response.json();
  },

  /**
   * Persists direct physical properties of an existing table grid unit
   */
  async updateTable(tableId, tableData) {
    const response = await apiFetch(`/api/v1/tables/${tableId}`, {
      method: "PUT",
      body: JSON.stringify(tableData)
    });
    if (!response.ok) throw new Error("Failed to update table details.");
    return await response.json();
  },

  /**
   * Drops a single physical table unit from the spatial matrix
   */
  async deleteTable(tableId) {
    const response = await apiFetch(`/api/v1/tables/${tableId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to remove table unit.");
    return await response.json();
  },

  /**
   * Retrieves any currently active flash discount campaigns
   */
  async getActiveCampaign(restaurantId) {
    if (!restaurantId) throw new Error("Missing restaurant ID for context.");
    const response = await apiFetch(`/api/v1/restaurants/${restaurantId}/campaigns/active`);
    if (!response.ok) throw new Error("Failed to fetch active campaigns.");
    const data = await response.json();
    return data.campaign;
  },

  /**
   * Broadcasts a new limited-time flash discount to local app users
   */
  async broadcastFlashCampaign(restaurantId, tableQuota, discountPercent) {
    if (!restaurantId) throw new Error("Missing restaurant ID for context.");
    const sanitizedDiscount = Math.max(10, Math.min(50, discountPercent));
    const response = await apiFetch(`/api/v1/restaurants/${restaurantId}/campaigns`, {
      method: "POST",
      body: JSON.stringify({
        tableQuota: parseInt(tableQuota, 10) || 1,
        discountPercent: parseInt(sanitizedDiscount, 10)
      }),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to broadcast flash deal campaign.");
    }
    return await response.json();
  },

  /**
   * Fetches all live bookings and reservations for the current shift
   */
  async getLiveBookings(restaurantId) {
    if (!restaurantId) throw new Error("Missing restaurant ID for context.");
    const response = await apiFetch(`/api/v1/restaurants/${restaurantId}/bookings`);
    if (!response.ok) throw new Error("Failed to synchronize active restaurant bookings.");
    const data = await response.json();
    return data.bookings || [];
  },

  /**
   * Updates the status of a specific booking (e.g., pending -> confirmed -> seated)
   */
  async patchBookingStatus(bookingId, targetStatus) {
    const response = await apiFetch(`/api/v1/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: targetStatus })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to modify reservation status registry.");
    }
    return await response.json();
  },

  /**
   * Syncs operational preferences like accessibility and sensory guidelines
   */
  async updateRestaurantSettings(restaurantId, settingsUpdates) {
    if (!restaurantId) throw new Error("Missing restaurant ID for context.");
    const response = await apiFetch(`/api/v1/restaurants/${restaurantId}`, {
      method: "PATCH",
      body: JSON.stringify(settingsUpdates)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to update restaurant profile configurations.");
    }
    return await response.json();
  },

  /**
   * Fetches aggregated financial and operational metrics based on a specific timeframe
   */
  async getAnalytics(restaurantId, timeframe = 'Today') {
    if (!restaurantId) throw new Error("Missing restaurant ID for context.");
    const period = timeframe.toLowerCase(); // 'today', 'week', 'month'
    const response = await apiFetch(`/api/v1/restaurants/${restaurantId}/analytics?period=${period}`);
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to fetch aggregated analytics data.");
    }
    return await response.json();
  }
};