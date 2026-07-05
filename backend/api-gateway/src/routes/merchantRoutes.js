const express = require('express');
const router = express.Router();

// Import your database controllers here (adjust path/names to match your setup)
const { 
  getLiveBookings, 
  getRestaurantDetails, 
  updateRestaurantSettings,
  getFloorPlan,
  createRoom,
  updateRoom,
  deleteRoom,
  createTable,
  updateTable,
  deleteTable,
  getActiveCampaign,
  broadcastFlashCampaign,
  getAnalytics
} = require('../controllers/merchantController');

// ----------------------------------------------------------------------
// CORE BOOKING & LIVE DATA
// ----------------------------------------------------------------------
router.get('/restaurants/:restaurantId/bookings', getLiveBookings);

// ----------------------------------------------------------------------
// VENUE METADATA & CONFIGURATION
// ----------------------------------------------------------------------
router.get('/restaurants/:restaurantId', getRestaurantDetails);
router.put('/restaurants/:restaurantId/settings', updateRestaurantSettings);

// ----------------------------------------------------------------------
// FLOOR PLAN & TABLE MANAGEMENT 
// ----------------------------------------------------------------------
router.get('/restaurants/:restaurantId/floorplan', getFloorPlan);

// Rooms
router.post('/restaurants/:restaurantId/rooms', createRoom);
router.put('/rooms/:roomId', updateRoom);
router.delete('/rooms/:roomId', deleteRoom);

// Tables
router.post('/restaurants/:restaurantId/tables', createTable);
router.put('/tables/:tableId', updateTable);
router.delete('/tables/:tableId', deleteTable);

// ----------------------------------------------------------------------
// MARKETING & ANALYTICS
// ----------------------------------------------------------------------
router.get('/restaurants/:restaurantId/campaigns/active', getActiveCampaign);
router.post('/restaurants/:restaurantId/campaigns/flash', broadcastFlashCampaign);
router.get('/restaurants/:restaurantId/analytics', getAnalytics);

module.exports = router;