const request = require("supertest");

const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
};

jest.mock("../db/pool", () => ({
  getPool: jest.fn(() => mockPool),
  checkConnection: jest.fn(async () => ({ configured: true, ok: true })),
  closePool: jest.fn(),
}));

jest.mock("../services/createBooking", () => ({
  createBooking: jest.fn(),
}));

jest.mock("../services/cancelBooking", () => ({
  cancelBooking: jest.fn(),
}));

jest.mock("../services/updateBookingStatus", () => ({
  updateBookingStatus: jest.fn(),
}));

jest.mock("../services/createCampaignOffers", () => ({
  createCampaignOffers: jest.fn(),
}));

jest.mock("../services/mlBusynessClient", () => ({
  callMlBusyness: jest.fn(),
}));

jest.mock("../services/getRevpash", () => ({
  getRevpashSummary: jest.fn(),
}));

jest.mock("../services/getCampaignRevpashLift", () => ({
  getCampaignRevpashLift: jest.fn(),
}));

const createApp = require("../app");
const { createBooking } = require("../services/createBooking");
const { cancelBooking } = require("../services/cancelBooking");
const { updateBookingStatus } = require("../services/updateBookingStatus");
const { createCampaignOffers } = require("../services/createCampaignOffers");
const { callMlBusyness } = require("../services/mlBusynessClient");
const { getRevpashSummary } = require("../services/getRevpash");
const { getCampaignRevpashLift } = require("../services/getCampaignRevpashLift");
const config = require("../config");

const app = createApp();

const USER_ID = "11111111-1111-4111-8111-111111111111";
const RESTAURANT_ID = "22222222-2222-4222-8222-222222222222";
const OFFER_ID = "33333333-3333-4333-8333-333333333333";
const CAMPAIGN_ID = "44444444-4444-4444-8444-444444444444";
const NOW = new Date("2026-06-30T12:00:00.000Z");

function userRow(overrides = {}) {
  return {
    id: USER_ID,
    display_name: "Yuhao",
    budget_tier: null,
    dietary_tags: [],
    preferred_cuisines: [],
    dining_styles: [],
    last_lat: null,
    last_lng: null,
    created_at: NOW,
    ...overrides,
  };
}

function restaurantRow(overrides = {}) {
  return {
    id: RESTAURANT_ID,
    name: "Mercer Room",
    latitude: 40.735,
    longitude: -73.99,
    neighborhood: "Manhattan",
    available_table_count: 2,
    capacity: 24,
    cuisine: "Omakase",
    busyness_score: 0.35,
    is_wheelchair_accessible: true,
    sensory_friendly: false,
    address_line: "12 Mercer Street",
    hold_window_minutes: 15,
    phone: "+1 212-555-0100",
    distance_meters: 450,
    manager_user_id: USER_ID,
    ...overrides,
  };
}

function maturityStatsRow(overrides = {}) {
  return {
    days_since_onboarding: 42.5,
    capacity: 24,
    total_30d: 18,
    same_bucket_30d: 3,
    ...overrides,
  };
}

function bookingRow(overrides = {}) {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    user_id: USER_ID,
    restaurant_id: RESTAURANT_ID,
    offer_id: null,
    campaign_id: null,
    status: "confirmed",
    transport_mode: "walking",
    eta_minutes: 8,
    eta_source: "estimate",
    hold_expires_at: new Date("2026-06-30T12:15:00.000Z"),
    confirmed_at: NOW,
    ...overrides,
  };
}

function campaignRow(overrides = {}) {
  return {
    id: CAMPAIGN_ID,
    restaurant_id: RESTAURANT_ID,
    status: "active",
    table_quota: 3,
    tables_claimed: 0,
    discount_percent: 20,
    created_at: NOW,
    expires_at: new Date("2099-01-01T00:15:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPool.query.mockReset();
  mockPool.connect.mockReset();
});

describe("users routes", () => {
  it("creates a user profile", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [userRow()] });

    const res = await request(app)
      .post("/api/v1/users")
      .send({ displayName: " Yuhao " });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: USER_ID,
      displayName: "Yuhao",
      dietaryTags: [],
      createdAt: NOW.toISOString(),
    });
    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO users"), [
      "Yuhao",
    ]);
  });

  it("updates preferences and returns normalized coordinates", async () => {
    const updatedUser = userRow({
      budget_tier: "TIER_2",
      dietary_tags: ["vegetarian"],
      preferred_cuisines: ["Japanese"],
      dining_styles: ["casual"],
      requires_wheelchair_access: true,
      requires_sensory_friendly: true,
      last_lat: "40.73",
      last_lng: "-73.99",
    });
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // defensive preference INSERT
        .mockResolvedValueOnce({ rows: [] }) // preference UPDATE
        .mockResolvedValueOnce({ rows: [] }) // location UPDATE
        .mockResolvedValueOnce({ rows: [updatedUser] }) // joined profile SELECT
        .mockResolvedValueOnce({ rows: [] }), // COMMIT
      release: jest.fn(),
    };
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: USER_ID }] });
    mockPool.connect.mockResolvedValueOnce(client);

    const res = await request(app)
      .patch("/api/v1/users/me/preferences")
      .set("X-User-Id", USER_ID)
      .send({
        budgetTier: "TIER_2",
        dietaryTags: ["vegetarian"],
        preferredCuisines: ["Japanese"],
        diningStyles: ["casual"],
        requiresWheelchairAccess: true,
        requiresSensoryFriendly: true,
        lastLat: 40.73,
        lastLng: -73.99,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      budgetTier: "TIER_2",
      dietaryTags: ["vegetarian"],
      preferredCuisines: ["Japanese"],
      diningStyles: ["casual"],
      requiresWheelchairAccess: true,
      requiresSensoryFriendly: true,
      lastLat: 40.73,
      lastLng: -73.99,
    });
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE user_preferences"),
      ["TIER_2", ["vegetarian"], ["Japanese"], ["casual"], true, true, USER_ID]
    );
    expect(client.release).toHaveBeenCalled();
  });

  it("updates accessibility requirements on their own", async () => {
    const updatedUser = userRow({ requires_wheelchair_access: true });
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // defensive preference INSERT
        .mockResolvedValueOnce({ rows: [] }) // preference UPDATE
        .mockResolvedValueOnce({ rows: [updatedUser] }) // joined profile SELECT
        .mockResolvedValueOnce({ rows: [] }), // COMMIT
      release: jest.fn(),
    };
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: USER_ID }] });
    mockPool.connect.mockResolvedValueOnce(client);

    const res = await request(app)
      .patch("/api/v1/users/me/preferences")
      .set("X-User-Id", USER_ID)
      .send({ requiresWheelchairAccess: true });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ requiresWheelchairAccess: true });
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("requires_wheelchair_access = $1"),
      [true, USER_ID]
    );
  });

  it("rejects non-boolean accessibility requirements", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: USER_ID }] });

    const res = await request(app)
      .patch("/api/v1/users/me/preferences")
      .set("X-User-Id", USER_ID)
      .send({ requiresSensoryFriendly: "yes" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(mockPool.connect).not.toHaveBeenCalled();
  });

  it("returns bookings for the signed-in user", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // lapseExpiredBookings SELECT
        .mockResolvedValueOnce({ rows: [] }), // COMMIT
      release: jest.fn(),
    };
    mockPool.connect.mockResolvedValueOnce(client);
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [bookingRow()] });

    const res = await request(app)
      .get("/api/v1/users/me/bookings")
      .set("X-User-Id", USER_ID);

    expect(res.status).toBe(200);
    expect(res.body.bookings[0]).toMatchObject({
      id: "55555555-5555-4555-8555-555555555555",
      userId: USER_ID,
      restaurantId: RESTAURANT_ID,
      etaMinutes: 8,
    });
  });
});

describe("restaurant routes", () => {
  it("returns nearby restaurants with parsed location and radius", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [restaurantRow()] });

    const res = await request(app).get("/api/v1/restaurants/nearby?lat=40.73&lng=-73.99");

    expect(res.status).toBe(200);
    expect(res.body.origin).toEqual({ lat: 40.73, lng: -73.99 });
    expect(res.body.radiusM).toBe(1500);
    expect(res.body.restaurants[0]).toMatchObject({
      id: RESTAURANT_ID,
      name: "Mercer Room",
      availableTableCount: 2,
      distanceMeters: 450,
    });
  });

  it("does not trust X-User-Id to update location when legacy auth is disabled", async () => {
    const previous = config.allowLegacyUserHeader;
    config.allowLegacyUserHeader = false;
    mockPool.query.mockResolvedValueOnce({ rows: [restaurantRow()] });

    try {
      const res = await request(app)
        .get("/api/v1/restaurants/nearby?lat=40.73&lng=-73.99")
        .set("X-User-Id", USER_ID);

      expect(res.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(mockPool.query).not.toHaveBeenCalledWith(
        expect.stringContaining("UPDATE users"),
        expect.any(Array)
      );
    } finally {
      config.allowLegacyUserHeader = previous;
    }
  });

  it("geocodes neighborhood when lat/lng are omitted", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [restaurantRow()] });

    const res = await request(app).get("/api/v1/restaurants/nearby?neighborhood=Manhattan");

    expect(res.status).toBe(200);
    expect(res.body.origin).toEqual({ lat: 40.7831, lng: -73.9712 });
    expect(res.body.radiusM).toBe(1500);
  });

  it("returns 404 for an unknown neighborhood lookup", async () => {
    const res = await request(app).get("/api/v1/restaurants/nearby?neighborhood=Queens");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({
      code: "NOT_FOUND",
      message: "Unknown neighborhood: Queens",
    });
  });

  it("returns restaurant details with a live busyness prediction", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [restaurantRow()] })
      .mockResolvedValueOnce({ rows: [maturityStatsRow()] }) // booking-maturity stats
      .mockResolvedValueOnce({ rows: [] }); // availability_snapshots insert
    callMlBusyness.mockResolvedValueOnce({
      busynessScore: 0.72,
      availableTableCount: 3,
      confidence: 0.9,
    });

    const res = await request(app).get(`/api/v1/restaurants/${RESTAURANT_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: RESTAURANT_ID,
      addressLine: "12 Mercer Street",
      holdWindowMinutes: 15,
      busynessScore: 0.72,
      availableTableCount: 2, // real DB value, not overridden by ml-service's simulated count
    });
    // Booking-maturity stats flow through to the ml-service call.
    expect(callMlBusyness).toHaveBeenCalledWith(
      expect.objectContaining({
        restaurantId: RESTAURANT_ID,
        daysSinceOnboarding: 42.5,
        capacity: 24,
        recentBookingsTotal30d: 18,
        recentBookingsSameBucket30d: 3,
      })
    );
    expect(mockPool.query).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO availability_snapshots"),
      [RESTAURANT_ID, 3, 0.72]
    );
  });

  it("falls back to the stored busyness score when ml-service is unavailable", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [restaurantRow()] })
      .mockResolvedValueOnce({ rows: [maturityStatsRow()] }); // booking-maturity stats
    callMlBusyness.mockRejectedValueOnce(new Error("connection refused"));

    const res = await request(app).get(`/api/v1/restaurants/${RESTAURANT_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: RESTAURANT_ID,
      busynessScore: 0.35, // stored restaurants.busyness_score, unchanged
    });
    expect(mockPool.query).toHaveBeenCalledTimes(2); // no snapshot insert attempted
  });

  it("creates a restaurant for the authenticated manager and seeds a location-based busyness score", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, token_version: 0 }] })
      .mockResolvedValueOnce({
        rows: [
          restaurantRow({
            name: "New Venue",
            address_line: "100 Main St",
            phone: "+1 212-555-0199",
            cuisine: "italian",
            neighborhood: "Midtown",
            available_table_count: 0,
          }),
        ],
      })
      // Day-0 merchant: no booking history yet.
      .mockResolvedValueOnce({
        rows: [maturityStatsRow({ days_since_onboarding: 0, total_30d: 0, same_bucket_30d: 0 })],
      })
      .mockResolvedValueOnce({ rows: [] }) // availability_snapshots insert
      .mockResolvedValueOnce({ rows: [] }); // persist seeded busyness_score
    callMlBusyness.mockResolvedValueOnce({
      busynessScore: 0.41,
      availableTableCount: 5,
      confidence: 0.85,
    });

    const res = await request(app)
      .post("/api/v1/restaurants")
      .set("X-User-Id", USER_ID)
      .send({
        name: "New Venue",
        addressLine: "100 Main St",
        phone: "+1 212-555-0199",
        latitude: 40.73,
        longitude: -73.99,
        cuisine: "italian",
        neighborhood: "Midtown",
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "New Venue",
      addressLine: "100 Main St",
      phone: "+1 212-555-0199",
      cuisine: "italian",
      availableTableCount: 0,
      busynessScore: 0.41, // seeded from the onboarding location prediction
    });
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO restaurants"),
      expect.arrayContaining([USER_ID])
    );
    // Day-0 stats flow through so the ml-service scores from location alone.
    expect(callMlBusyness).toHaveBeenCalledWith(
      expect.objectContaining({
        daysSinceOnboarding: 0,
        recentBookingsTotal30d: 0,
        recentBookingsSameBucket30d: 0,
      })
    );
    expect(mockPool.query).toHaveBeenLastCalledWith(
      expect.stringContaining("UPDATE restaurants SET busyness_score"),
      [0.41, RESTAURANT_ID]
    );
  });

  it("still creates the restaurant when the onboarding prediction is unavailable", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, token_version: 0 }] })
      .mockResolvedValueOnce({
        rows: [restaurantRow({ name: "New Venue", available_table_count: 0, busyness_score: null })],
      })
      .mockResolvedValueOnce({
        rows: [maturityStatsRow({ days_since_onboarding: 0, total_30d: 0, same_bucket_30d: 0 })],
      });
    callMlBusyness.mockRejectedValueOnce(new Error("connection refused"));

    const res = await request(app)
      .post("/api/v1/restaurants")
      .set("X-User-Id", USER_ID)
      .send({
        name: "New Venue",
        addressLine: "100 Main St",
        phone: "+1 212-555-0199",
        cuisine: "italian",
        latitude: 40.73,
        longitude: -73.99,
      });

    expect(res.status).toBe(201);
    // No seeded score: serializer maps a null busyness_score to 0.
    expect(res.body).toMatchObject({ name: "New Venue", busynessScore: 0 });
  });

  it("updates accessibility settings for a managed restaurant", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, token_version: 0 }] })
      .mockResolvedValueOnce({ rows: [{ id: RESTAURANT_ID, manager_user_id: USER_ID }] })
      .mockResolvedValueOnce({
        rows: [
          restaurantRow({
            is_wheelchair_accessible: true,
            sensory_friendly: true,
          }),
        ],
      });

    const res = await request(app)
      .patch(`/api/v1/restaurants/${RESTAURANT_ID}/settings`)
      .set("X-User-Id", USER_ID)
      .send({
        isWheelchairAccessible: true,
        sensoryFriendly: true,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      isWheelchairAccessible: true,
      sensoryFriendly: true,
    });
  });

  it("returns RevPASH summary for a managed restaurant", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, token_version: 0 }] })
      .mockResolvedValueOnce({ rows: [{ id: RESTAURANT_ID, manager_user_id: USER_ID }] });
    getRevpashSummary.mockResolvedValueOnce({
      restaurantId: RESTAURANT_ID,
      window: "today",
      revenue: 314.16,
      availableSeatHours: 88,
      revpash: 3.57,
    });

    const res = await request(app)
      .get(`/api/v1/restaurants/${RESTAURANT_ID}/revpash?window=today`)
      .set("X-User-Id", USER_ID);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      restaurantId: RESTAURANT_ID,
      window: "today",
      revenue: 314.16,
      availableSeatHours: 88,
      revpash: 3.57,
    });
    expect(getRevpashSummary).toHaveBeenCalledWith(mockPool, {
      restaurantId: RESTAURANT_ID,
      window: "today",
    });
  });
});

describe("booking routes", () => {
  it("requires a signed-in user", async () => {
    const res = await request(app).post("/api/v1/bookings").send({});

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("creates a confirmed booking inside a transaction", async () => {
    const client = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };

    mockPool.query.mockResolvedValueOnce({ rows: [{ id: USER_ID }] });
    mockPool.connect.mockResolvedValueOnce(client);
    createBooking.mockResolvedValueOnce(bookingRow());

    const res = await request(app)
      .post("/api/v1/bookings")
      .set("X-User-Id", USER_ID)
      .send({
        restaurantId: RESTAURANT_ID,
        transportMode: "walking",
        userLat: 40.73,
        userLng: -73.99,
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      userId: USER_ID,
      restaurantId: RESTAURANT_ID,
      status: "confirmed",
      etaMinutes: 8,
    });
    expect(client.query).toHaveBeenCalledWith("BEGIN");
    expect(client.query).toHaveBeenCalledWith("COMMIT");
    expect(client.release).toHaveBeenCalled();
  });

  it("cancels a booking inside a transaction", async () => {
    const client = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };

    mockPool.query.mockResolvedValueOnce({ rows: [{ id: USER_ID }] });
    mockPool.connect.mockResolvedValueOnce(client);
    cancelBooking.mockResolvedValueOnce(
      bookingRow({
        status: "cancelled",
        cancelled_at: NOW,
      })
    );

    const res = await request(app)
      .post(`/api/v1/bookings/${bookingRow().id}/cancel`)
      .set("X-User-Id", USER_ID)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: bookingRow().id,
      status: "cancelled",
    });
    expect(cancelBooking).toHaveBeenCalledWith(client, {
      userId: USER_ID,
      bookingId: bookingRow().id,
    });
    expect(client.query).toHaveBeenCalledWith("BEGIN");
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });

  it("updates booking status for a restaurant manager", async () => {
    const client = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };

    mockPool.query.mockResolvedValueOnce({ rows: [{ id: USER_ID }] });
    mockPool.connect.mockResolvedValueOnce(client);
    updateBookingStatus.mockResolvedValueOnce(
      bookingRow({
        status: "completed",
      })
    );

    const res = await request(app)
      .patch(`/api/v1/bookings/${bookingRow().id}/status`)
      .set("X-User-Id", USER_ID)
      .send({ status: "completed" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: bookingRow().id,
      status: "completed",
    });
    expect(updateBookingStatus).toHaveBeenCalledWith(client, {
      managerUserId: USER_ID,
      bookingId: bookingRow().id,
      status: "completed",
    });
    expect(client.query).toHaveBeenCalledWith("BEGIN");
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });
});

describe("offer routes", () => {
  it("accepts a pending offer and returns the generated booking", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // expire overdue campaigns
        .mockResolvedValueOnce({
          rows: [
            {
              id: OFFER_ID,
              status: "pending",
              expires_at: new Date("2099-01-01T00:00:00.000Z"),
              restaurant_id: RESTAURANT_ID,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ last_lat: "40.73", last_lng: "-73.99" }] })
        .mockResolvedValueOnce({ rows: [] }), // COMMIT
      release: jest.fn(),
    };

    mockPool.query.mockResolvedValueOnce({ rows: [{ id: USER_ID }] });
    mockPool.connect.mockResolvedValueOnce(client);
    createBooking.mockResolvedValueOnce(
      bookingRow({
        offer_id: OFFER_ID,
        campaign_id: CAMPAIGN_ID,
      })
    );

    const res = await request(app)
      .post(`/api/v1/offers/${OFFER_ID}/accept`)
      .set("X-User-Id", USER_ID)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      offerId: OFFER_ID,
      status: "accepted",
      booking: {
        offerId: OFFER_ID,
        campaignId: CAMPAIGN_ID,
      },
    });
  });
});

describe("campaign routes", () => {
  it("creates a campaign and generates matched offers", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // expire overdue
        .mockResolvedValueOnce({ rows: [restaurantRow()] })
        .mockResolvedValueOnce({ rows: [] }) // no active campaign
        .mockResolvedValueOnce({ rows: [campaignRow()] })
        .mockResolvedValueOnce({ rows: [] }), // COMMIT
      release: jest.fn(),
    };

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [{ id: RESTAURANT_ID, manager_user_id: USER_ID }] });
    mockPool.connect.mockResolvedValueOnce(client);
    createCampaignOffers.mockResolvedValueOnce(["offer-1"]);

    const res = await request(app)
      .post(`/api/v1/restaurants/${RESTAURANT_ID}/campaigns`)
      .set("X-User-Id", USER_ID)
      .send({ tableQuota: 3, discountPercent: 20 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      restaurantId: RESTAURANT_ID,
      tableQuota: 3,
      discountPercent: 20,
      status: "active",
    });
    expect(res.body.expiresAt).toBeTruthy();
    expect(createCampaignOffers).toHaveBeenCalledWith(client, {
      campaignId: CAMPAIGN_ID,
      restaurant: expect.objectContaining({ id: RESTAURANT_ID }),
      tableQuota: 3,
      ttlSeconds: 900,
    });
  });

  it("creates a campaign with a manager-selected shared TTL", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [restaurantRow()] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [campaignRow({ expires_at: new Date("2099-01-01T00:30:00.000Z") })],
        })
        .mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [{ id: RESTAURANT_ID, manager_user_id: USER_ID }] });
    mockPool.connect.mockResolvedValueOnce(client);
    createCampaignOffers.mockResolvedValueOnce(["offer-1"]);

    const res = await request(app)
      .post(`/api/v1/restaurants/${RESTAURANT_ID}/campaigns`)
      .set("X-User-Id", USER_ID)
      .send({ tableQuota: 3, discountPercent: 20, ttlMinutes: 30 });

    expect(res.status).toBe(201);
    expect(createCampaignOffers).toHaveBeenCalledWith(client, {
      campaignId: CAMPAIGN_ID,
      restaurant: expect.objectContaining({ id: RESTAURANT_ID }),
      tableQuota: 3,
      ttlSeconds: 1800,
    });
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO campaigns"),
      [RESTAURANT_ID, 3, 20, 1800]
    );
  });

  it("lists offers for a campaign", async () => {
    const expiresAt = new Date("2026-06-30T12:10:00.000Z");
    const acceptedAt = new Date("2026-06-30T12:05:00.000Z");

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [{ id: RESTAURANT_ID, manager_user_id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [] }) // expire overdue campaigns
      .mockResolvedValueOnce({ rows: [{ id: CAMPAIGN_ID }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: OFFER_ID,
            campaign_id: CAMPAIGN_ID,
            status: "pending",
            expires_at: expiresAt,
            accepted_at: null,
            user_display_name: "Ava",
          },
          {
            id: "66666666-6666-4666-8666-666666666666",
            campaign_id: CAMPAIGN_ID,
            status: "accepted",
            expires_at: expiresAt,
            accepted_at: acceptedAt,
            user_display_name: "Ben",
          },
        ],
      });

    const res = await request(app)
      .get(`/api/v1/restaurants/${RESTAURANT_ID}/campaigns/${CAMPAIGN_ID}/offers`)
      .set("X-User-Id", USER_ID);

    expect(res.status).toBe(200);
    expect(res.body.offers).toHaveLength(2);
    expect(res.body.offers[0]).toMatchObject({
      id: OFFER_ID,
      campaignId: CAMPAIGN_ID,
      userDisplayName: "Ava",
      status: "pending",
      acceptedAt: null,
    });
    expect(res.body.offers[1]).toMatchObject({
      userDisplayName: "Ben",
      status: "accepted",
      acceptedAt: acceptedAt.toISOString(),
    });
  });

  it("returns 404 when listing offers for an unknown campaign", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [{ id: RESTAURANT_ID, manager_user_id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [] }) // expire overdue
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get(`/api/v1/restaurants/${RESTAURANT_ID}/campaigns/${CAMPAIGN_ID}/offers`)
      .set("X-User-Id", USER_ID);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatchObject({
      code: "NOT_FOUND",
      message: "Campaign not found",
    });
  });

  it("returns RevPASH lift for a campaign", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [{ id: RESTAURANT_ID, manager_user_id: USER_ID }] });
    getCampaignRevpashLift.mockResolvedValueOnce({
      campaignId: CAMPAIGN_ID,
      organicRevpash: 2.5,
      dealRevpash: 12.5,
      liftPercent: 400,
      offPeak: true,
    });

    const res = await request(app)
      .get(`/api/v1/restaurants/${RESTAURANT_ID}/campaigns/${CAMPAIGN_ID}/revpash-lift`)
      .set("X-User-Id", USER_ID);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      campaignId: CAMPAIGN_ID,
      organicRevpash: 2.5,
      dealRevpash: 12.5,
      liftPercent: 400,
      offPeak: true,
    });
    expect(getCampaignRevpashLift).toHaveBeenCalledWith(mockPool, {
      restaurantId: RESTAURANT_ID,
      campaignId: CAMPAIGN_ID,
    });
  });

  it("rejects tableQuota above restaurant capacity", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // expire
        .mockResolvedValueOnce({ rows: [restaurantRow({ capacity: 8 })] }),
      release: jest.fn(),
    };

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [{ id: RESTAURANT_ID, manager_user_id: USER_ID }] });
    mockPool.connect.mockResolvedValueOnce(client);

    const res = await request(app)
      .post(`/api/v1/restaurants/${RESTAURANT_ID}/campaigns`)
      .set("X-User-Id", USER_ID)
      .send({ tableQuota: 9, discountPercent: 20 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "tableQuota cannot exceed restaurant capacity (8)",
    });
    expect(createCampaignOffers).not.toHaveBeenCalled();
  });

  it("cancels an active campaign and revokes pending offers", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // expire
        .mockResolvedValueOnce({
          rows: [campaignRow({ status: "active" })],
        })
        .mockResolvedValueOnce({
          rows: [campaignRow({ status: "cancelled" })],
        })
        .mockResolvedValueOnce({ rows: [] }) // revoke offers
        .mockResolvedValueOnce({ rows: [] }), // COMMIT
      release: jest.fn(),
    };

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [{ id: RESTAURANT_ID, manager_user_id: USER_ID }] });
    mockPool.connect.mockResolvedValueOnce(client);

    const res = await request(app)
      .post(`/api/v1/restaurants/${RESTAURANT_ID}/campaigns/${CAMPAIGN_ID}/cancel`)
      .set("X-User-Id", USER_ID)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: CAMPAIGN_ID,
      restaurantId: RESTAURANT_ID,
      status: "cancelled",
    });
    expect(client.query).toHaveBeenCalledWith("BEGIN");
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("status = 'revoked'"),
      [CAMPAIGN_ID]
    );
    expect(client.query).toHaveBeenCalledWith("COMMIT");
  });
});
