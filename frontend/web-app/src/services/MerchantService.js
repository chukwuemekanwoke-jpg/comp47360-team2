export const MerchantService = {
  // Base URL helper
  getBaseUrl() {
    return window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
  },

  // ----------------------------------------------------------------------
  // CORE BOOKING & LIVE DATA
  // ----------------------------------------------------------------------
  async getLiveBookings(restaurantId, userId) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/restaurants/${restaurantId}/bookings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId
      }
    });

    if (!response.ok) throw new Error(`Database bookings endpoint returned: ${response.status}`);
    
    const data = await response.json();
    return data.bookings || data || [];
  },

  // ----------------------------------------------------------------------
  // VENUE METADATA & CONFIGURATION
  // ----------------------------------------------------------------------
  async getRestaurantDetails(restaurantId) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/restaurants/${restaurantId}`);
    if (!response.ok) throw new Error("Details not found in DB");
    return await response.json();
  },

  async updateRestaurantSettings(restaurantId, settingsPayload) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/restaurants/${restaurantId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsPayload)
    });
    if (!response.ok) throw new Error("Failed to update settings in DB");
    return await response.json();
  },

  // ----------------------------------------------------------------------
  // FLOOR PLAN & TABLE MANAGEMENT 
  // ----------------------------------------------------------------------
  async getFloorPlan(restaurantId) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/restaurants/${restaurantId}/floorplan`);
    if (!response.ok) throw new Error("Floor plan unavailable in DB");
    return await response.json();
  },

  async createRoom(restaurantId, roomPayload) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/restaurants/${restaurantId}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomPayload)
    });
    if (!response.ok) throw new Error("Failed to create room in DB");
    return await response.json();
  },

  async updateRoom(roomId, roomPayload) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomPayload)
    });
    if (!response.ok) throw new Error("Failed to update room in DB");
    return await response.json();
  },

  async deleteRoom(roomId) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/rooms/${roomId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error("Failed to delete room in DB");
    return true;
  },

  async createTable(restaurantId, tablePayload) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/restaurants/${restaurantId}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tablePayload)
    });
    if (!response.ok) throw new Error("Failed to create table in DB");
    return await response.json();
  },

  async updateTable(tableId, tablePayload) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/tables/${tableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tablePayload)
    });
    if (!response.ok) throw new Error("Failed to update table in DB");
    return await response.json();
  },

  async deleteTable(tableId) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/tables/${tableId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error("Failed to delete table in DB");
    return true;
  },

  // ----------------------------------------------------------------------
  // MARKETING & ANALYTICS
  // ----------------------------------------------------------------------
  async getActiveCampaign(restaurantId) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/restaurants/${restaurantId}/campaigns/active`);
    if (!response.ok) return null; 
    return await response.json();
  },

  async broadcastFlashCampaign(restaurantId, targetAudienceId, discountPercent) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/restaurants/${restaurantId}/campaigns/flash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetAudienceId, discountPercent })
    });
    if (!response.ok) throw new Error("Failed to broadcast campaign to DB");
    return await response.json();
  },

  async getAnalytics(restaurantId, timeframe) {
    const response = await fetch(`${this.getBaseUrl()}/api/v1/restaurants/${restaurantId}/analytics?timeframe=${timeframe}`);
    if (!response.ok) throw new Error("Failed to fetch analytics from DB");
    return await response.json();
  }
};