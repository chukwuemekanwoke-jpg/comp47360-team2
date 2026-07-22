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

jest.mock("../services/etaResolver", () => ({
  resolveEtaResult: jest.fn(),
}));

jest.mock("../services/mlMatchClient", () => ({
  callMlMatch: jest.fn(),
}));

const createApp = require("../app");
const { resolveEtaResult } = require("../services/etaResolver");
const { callMlMatch } = require("../services/mlMatchClient");

const app = createApp();

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const MANAGER_ID = "22222222-2222-4222-8222-222222222222";
const RESTAURANT_ID = "33333333-3333-4333-8333-333333333333";
const DIRECT_BOOKING_ID = "44444444-4444-4444-8444-444444444444";
const CAMPAIGN_ID = "55555555-5555-4555-8555-555555555555";
const OFFER_ID = "66666666-6666-4666-8666-666666666666";
const OFFER_BOOKING_ID = "77777777-7777-4777-8777-777777777777";
const NOW = new Date("2026-07-07T10:00:00.000Z");
const OFFER_EXPIRY = new Date("2099-01-01T00:15:00.000Z");

function userRow(overrides = {}) {
  return {
    id: CUSTOMER_ID,
    display_name: "Ava Diner",
    budget_tier: null,
    dietary_tags: [],
    last_lat: null,
    last_lng: null,
    created_at: NOW,
    email: "ava@example.com",
    token_version: 0,
    password_hash: "hashed-password",
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
    available_table_count: 5,
    capacity: 24,
    cuisine: "Omakase",
    busyness_score: 0.35,
    is_wheelchair_accessible: true,
    sensory_friendly: false,
    address_line: "12 Mercer Street",
    hold_window_minutes: 15,
    manager_user_id: MANAGER_ID,
    distance_meters: 450,
    ...overrides,
  };
}

function campaignRow(overrides = {}) {
  return {
    id: CAMPAIGN_ID,
    restaurant_id: RESTAURANT_ID,
    status: "active",
    table_quota: 2,
    tables_claimed: 0,
    discount_percent: 20,
    created_at: NOW,
    ...overrides,
  };
}

class JourneyDatabase {
  constructor() {
    this.users = new Map([
      [
        MANAGER_ID,
        userRow({
          id: MANAGER_ID,
          display_name: "Demo Manager",
          email: "manager@table.test",
        }),
      ],
    ]);
    this.restaurants = new Map([[RESTAURANT_ID, restaurantRow()]]);
    this.campaigns = new Map();
    this.offers = new Map();
    this.bookings = [];
  }

  poolQuery(sql, params = []) {
    return this.query(sql, params);
  }

  connect() {
    const client = {
      query: jest.fn((sql, params = []) => this.query(sql, params)),
      release: jest.fn(),
    };
    return client;
  }

  query(sql, params = []) {
    const text = sql.replace(/\s+/g, " ").trim();

    if (["BEGIN", "COMMIT", "ROLLBACK"].includes(text)) {
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("FROM users WHERE LOWER(email) = LOWER($1)")) {
      const email = String(params[0]).toLowerCase();
      return Promise.resolve({
        rows: [...this.users.values()].filter((user) => user.email?.toLowerCase() === email),
      });
    }

    if (text.includes("INSERT INTO users (display_name, email, password_hash)")) {
      const [displayName, email, passwordHash] = params;
      const row = userRow({
        id: CUSTOMER_ID,
        display_name: displayName,
        email,
        password_hash: passwordHash,
      });
      this.users.set(CUSTOMER_ID, row);
      return Promise.resolve({ rows: [row] });
    }

    if (text.includes("SELECT id FROM restaurants WHERE manager_user_id = $1")) {
      const restaurant = [...this.restaurants.values()].find(
        (row) => row.manager_user_id === params[0]
      );
      return Promise.resolve({ rows: restaurant ? [{ id: restaurant.id }] : [] });
    }

    if (text.includes("SELECT id, token_version FROM users WHERE id = $1")) {
      const user = this.users.get(params[0]);
      return Promise.resolve({
        rows: user ? [{ id: user.id, token_version: user.token_version }] : [],
      });
    }

    if (text.includes("UPDATE users SET") && text.includes("budget_tier")) {
      const userId = params[params.length - 1];
      const user = this.users.get(userId);
      user.budget_tier = params[0];
      user.dietary_tags = params[1];
      user.last_lat = params[2];
      user.last_lng = params[3];
      return Promise.resolve({ rows: [user] });
    }

    if (text.includes("UPDATE users SET last_lat = $1, last_lng = $2 WHERE id = $3")) {
      const user = this.users.get(params[2]);
      if (user) {
        user.last_lat = params[0];
        user.last_lng = params[1];
      }
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("WITH nearby AS")) {
      return Promise.resolve({ rows: [restaurantRow(this.restaurants.get(RESTAURANT_ID))] });
    }

    if (text.includes("SELECT id, manager_user_id FROM restaurants WHERE id = $1")) {
      const restaurant = this.restaurants.get(params[0]);
      return Promise.resolve({ rows: restaurant ? [restaurant] : [] });
    }

    if (text.includes("FROM restaurants WHERE id = $1 FOR UPDATE")) {
      const restaurant = this.restaurants.get(params[0]);
      return Promise.resolve({ rows: restaurant ? [restaurant] : [] });
    }

    if (text.includes("hold_expires_at <= NOW()") && text.includes("FOR UPDATE")) {
      const expired = this.bookings.filter((booking) => {
        if (booking.status !== "pending" && booking.status !== "confirmed") return false;
        if (new Date(booking.hold_expires_at) > NOW) return false;
        if (text.includes("user_id = $1") && booking.user_id !== params[0]) return false;
        if (
          text.includes("restaurant_id = $1")
          && !text.includes("user_id")
          && booking.restaurant_id !== params[0]
        ) {
          return false;
        }
        if (
          text.includes("user_id = $1")
          && text.includes("restaurant_id = $2")
          && (booking.user_id !== params[0] || booking.restaurant_id !== params[1])
        ) {
          return false;
        }
        return true;
      });
      return Promise.resolve({ rows: expired });
    }

    if (
      text.includes("SELECT id FROM bookings")
      && text.includes("status IN ('pending', 'confirmed')")
    ) {
      const active = this.bookings.find(
        (booking) =>
          booking.user_id === params[0]
          && (booking.status === "pending" || booking.status === "confirmed")
      );
      return Promise.resolve({ rows: active ? [{ id: active.id }] : [] });
    }

    if (text.includes("DELETE FROM bookings") && text.includes("OFFSET $2")) {
      const keep = Number(params[1]);
      const userBookings = this.bookings
        .filter((booking) => booking.user_id === params[0])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const dropIds = new Set(userBookings.slice(keep).map((booking) => booking.id));
      const before = this.bookings.length;
      this.bookings = this.bookings.filter((booking) => !dropIds.has(booking.id));
      return Promise.resolve({ rows: [], rowCount: before - this.bookings.length });
    }

    if (
      text.includes("FROM bookings")
      && text.includes("WHERE id = $1 AND user_id = $2")
      && text.includes("FOR UPDATE")
    ) {
      const booking = this.bookings.find(
        (row) => row.id === params[0] && row.user_id === params[1]
      );
      return Promise.resolve({ rows: booking ? [booking] : [] });
    }

    if (
      text.includes("UPDATE bookings")
      && text.includes("status = 'cancelled'")
      && text.includes("RETURNING")
    ) {
      const booking = this.bookings.find((row) => row.id === params[0]);
      if (booking) {
        booking.status = "cancelled";
        booking.cancelled_at = NOW;
      }
      return Promise.resolve({ rows: booking ? [booking] : [] });
    }

    if (
      text.includes("UPDATE bookings")
      && text.includes("status = 'cancelled'")
      && !text.includes("RETURNING")
    ) {
      const booking = this.bookings.find((row) => row.id === params[0]);
      if (booking) {
        booking.status = "cancelled";
        booking.cancelled_at = NOW;
      }
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("SET available_table_count = LEAST(available_table_count + 1, capacity)")) {
      const restaurant = this.restaurants.get(params[0]);
      if (restaurant) {
        restaurant.available_table_count = Math.min(
          restaurant.available_table_count + 1,
          restaurant.capacity ?? restaurant.available_table_count + 1
        );
      }
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("INSERT INTO bookings")) {
      const [
        userId,
        restaurantId,
        offerId,
        campaignId,
        transportMode,
        etaMinutes,
        holdWindowMinutes,
      ] = params;
      const row = {
        id: offerId ? OFFER_BOOKING_ID : DIRECT_BOOKING_ID,
        user_id: userId,
        restaurant_id: restaurantId,
        offer_id: offerId,
        campaign_id: campaignId,
        status: "confirmed",
        transport_mode: transportMode,
        eta_minutes: etaMinutes,
        eta_source: "estimate",
        hold_expires_at: new Date(NOW.getTime() + holdWindowMinutes * 60 * 1000),
        confirmed_at: NOW,
        created_at: NOW,
      };
      this.bookings.push(row);
      return Promise.resolve({ rows: [row] });
    }

    if (text.includes("UPDATE restaurants SET available_table_count = available_table_count - 1")) {
      const restaurant = this.restaurants.get(params[0]);
      restaurant.available_table_count -= 1;
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("UPDATE offers SET status = 'accepted'")) {
      const offer = this.offers.get(params[0]);
      offer.status = "accepted";
      offer.accepted_at = NOW;
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("SELECT last_lat, last_lng FROM users WHERE id = $1")) {
      const user = this.users.get(params[0]);
      return Promise.resolve({
        rows: [{ last_lat: user?.last_lat ?? null, last_lng: user?.last_lng ?? null }],
      });
    }

    if (text.includes("SELECT o.id, o.status, o.expires_at")) {
      const offer = this.offers.get(params[0]);
      if (!offer || offer.user_id !== params[1]) {
        return Promise.resolve({ rows: [] });
      }
      const campaign = this.campaigns.get(offer.campaign_id);
      return Promise.resolve({
        rows: [
          {
            id: offer.id,
            status: offer.status,
            expires_at: offer.expires_at,
            campaign_id: offer.campaign_id,
            restaurant_id: campaign.restaurant_id,
          },
        ],
      });
    }

    if (text.includes("INSERT INTO campaigns")) {
      const [restaurantId, tableQuota, discountPercent] = params;
      const row = campaignRow({
        restaurant_id: restaurantId,
        table_quota: tableQuota,
        discount_percent: discountPercent,
      });
      this.campaigns.set(CAMPAIGN_ID, row);
      return Promise.resolve({ rows: [row] });
    }

    if (text.includes("WITH nearby_users")) {
      const restaurantManagerId = params[3];
      const rows = [...this.users.values()]
        .filter((user) => user.id !== restaurantManagerId && user.last_lat != null)
        .map((user) => ({
          id: user.id,
          budget_tier: user.budget_tier,
          dietary_tags: user.dietary_tags,
          distance_meters: 420,
        }));
      return Promise.resolve({ rows });
    }

    if (text.includes("INSERT INTO offers")) {
      const [campaignId, userId] = params;
      const row = {
        id: OFFER_ID,
        campaign_id: campaignId,
        user_id: userId,
        status: "pending",
        expires_at: OFFER_EXPIRY,
        created_at: NOW,
      };
      this.offers.set(OFFER_ID, row);
      return Promise.resolve({ rows: [{ id: OFFER_ID }] });
    }

    if (text.includes("UPDATE offers SET status = 'expired'")) {
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("FROM offers o JOIN campaigns c ON c.id = o.campaign_id JOIN restaurants r")) {
      const rows = [...this.offers.values()]
        .filter((offer) => offer.user_id === params[0])
        .map((offer) => {
          const campaign = this.campaigns.get(offer.campaign_id);
          const restaurant = this.restaurants.get(campaign.restaurant_id);
          return {
            id: offer.id,
            campaign_id: offer.campaign_id,
            status: offer.status,
            expires_at: offer.expires_at,
            discount_percent: campaign.discount_percent,
            restaurant_id: campaign.restaurant_id,
            restaurant_name: restaurant.name,
          };
        });
      return Promise.resolve({ rows });
    }

    if (text.includes("FROM campaigns WHERE restaurant_id = $1 AND status = 'active'")) {
      const campaign = [...this.campaigns.values()].find(
        (row) => row.restaurant_id === params[0] && row.status === "active"
      );
      return Promise.resolve({ rows: campaign ? [campaign] : [] });
    }

    if (text.includes("FROM campaigns WHERE restaurant_id = $1")) {
      return Promise.resolve({
        rows: [...this.campaigns.values()].filter((row) => row.restaurant_id === params[0]),
      });
    }

    if (text.includes("FROM bookings b JOIN users u ON u.id = b.user_id")) {
      return Promise.resolve({
        rows: this.bookings
          .filter((booking) => booking.restaurant_id === params[0])
          .map((booking) => ({
            ...booking,
            user_display_name: this.users.get(booking.user_id)?.display_name,
          })),
      });
    }

    return Promise.reject(new Error(`Unhandled integration test SQL: ${text}`));
  }
}

describe("integrated C-side and B-side API journeys", () => {
  let db;
  let customerToken;

  beforeEach(() => {
    db = new JourneyDatabase();
    mockPool.query.mockImplementation((sql, params) => db.poolQuery(sql, params));
    mockPool.connect.mockImplementation(async () => db.connect());
    resolveEtaResult.mockResolvedValue({
      restaurantId: RESTAURANT_ID,
      transportMode: "walking",
      etaMinutes: 8,
      holdWindowMinutes: 15,
      canBook: true,
      source: "estimate",
      message: "ETA: 8 mins (Within 15 min hold window)",
    });
    callMlMatch.mockResolvedValue({
      matchedUserIds: [CUSTOMER_ID],
      scores: [0.96],
    });
  });

  it("runs user signup, preferences, search, direct booking, offer inbox, and offer acceptance", async () => {
    const signup = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "ava@example.com",
        password: "password123",
        displayName: "Ava Diner",
      });

    expect(signup.status).toBe(201);
    expect(signup.body).toMatchObject({
      userId: CUSTOMER_ID,
      restaurantId: null,
      user: {
        displayName: "Ava Diner",
        email: "ava@example.com",
      },
    });
    customerToken = signup.body.token;

    const preferences = await request(app)
      .patch("/api/v1/users/me/preferences")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        budgetTier: "TIER_2",
        dietaryTags: ["vegetarian"],
        lastLat: 40.73,
        lastLng: -73.99,
      });

    expect(preferences.status).toBe(200);
    expect(preferences.body).toMatchObject({
      id: CUSTOMER_ID,
      budgetTier: "TIER_2",
      dietaryTags: ["vegetarian"],
      lastLat: 40.73,
      lastLng: -73.99,
    });

    const search = await request(app)
      .get("/api/v1/restaurants/nearby?lat=40.73&lng=-73.99&radiusM=1500")
      .set("X-User-Id", CUSTOMER_ID);

    expect(search.status).toBe(200);
    expect(search.body.restaurants).toHaveLength(1);
    expect(search.body.restaurants[0]).toMatchObject({
      id: RESTAURANT_ID,
      name: "Mercer Room",
      availableTableCount: 5,
    });

    const directBooking = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        restaurantId: RESTAURANT_ID,
        transportMode: "walking",
        userLat: 40.73,
        userLng: -73.99,
      });

    expect(directBooking.status).toBe(201);
    expect(directBooking.body).toMatchObject({
      id: DIRECT_BOOKING_ID,
      userId: CUSTOMER_ID,
      restaurantId: RESTAURANT_ID,
      status: "confirmed",
      etaMinutes: 8,
    });

    // Rule 1: only one active booking — cancel before accepting a flash-deal offer.
    const cancelled = await request(app)
      .post(`/api/v1/bookings/${DIRECT_BOOKING_ID}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send();

    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe("cancelled");

    await request(app)
      .post(`/api/v1/restaurants/${RESTAURANT_ID}/campaigns`)
      .set("X-User-Id", MANAGER_ID)
      .send({ tableQuota: 2, discountPercent: 20 })
      .expect(201);

    const inbox = await request(app)
      .get("/api/v1/users/me/offers?status=pending")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(inbox.status).toBe(200);
    expect(inbox.body.offers[0]).toMatchObject({
      id: OFFER_ID,
      restaurantId: RESTAURANT_ID,
      restaurantName: "Mercer Room",
      discountPercent: 20,
      canAccept: true,
    });

    const accepted = await request(app)
      .post(`/api/v1/offers/${OFFER_ID}/accept`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send();

    expect(accepted.status).toBe(200);
    expect(accepted.body).toMatchObject({
      offerId: OFFER_ID,
      status: "accepted",
      booking: {
        id: OFFER_BOOKING_ID,
        offerId: OFFER_ID,
        campaignId: CAMPAIGN_ID,
        status: "confirmed",
      },
    });
  });

  it("runs restaurant dashboard bookings, campaign creation, active campaign, and offer generation", async () => {
    db.users.set(CUSTOMER_ID, userRow({
      id: CUSTOMER_ID,
      budget_tier: "TIER_2",
      dietary_tags: ["vegetarian"],
      last_lat: 40.73,
      last_lng: -73.99,
    }));
    db.bookings.push({
      id: DIRECT_BOOKING_ID,
      user_id: CUSTOMER_ID,
      restaurant_id: RESTAURANT_ID,
      offer_id: null,
      campaign_id: null,
      status: "confirmed",
      transport_mode: "walking",
      eta_minutes: 8,
      hold_expires_at: new Date(NOW.getTime() + 15 * 60 * 1000),
      confirmed_at: NOW,
      created_at: NOW,
    });

    const dashboard = await request(app)
      .get(`/api/v1/restaurants/${RESTAURANT_ID}/bookings`)
      .set("X-User-Id", MANAGER_ID);

    expect(dashboard.status).toBe(200);
    expect(dashboard.body.bookings[0]).toMatchObject({
      id: DIRECT_BOOKING_ID,
      userDisplayName: "Ava Diner",
      status: "confirmed",
    });

    const campaign = await request(app)
      .post(`/api/v1/restaurants/${RESTAURANT_ID}/campaigns`)
      .set("X-User-Id", MANAGER_ID)
      .send({ tableQuota: 2, discountPercent: 20 });

    expect(campaign.status).toBe(201);
    expect(campaign.body).toMatchObject({
      id: CAMPAIGN_ID,
      restaurantId: RESTAURANT_ID,
      tableQuota: 2,
      discountPercent: 20,
    });
    expect(callMlMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: CAMPAIGN_ID,
        restaurantId: RESTAURANT_ID,
        candidateLimit: 2,
        candidates: [
          expect.objectContaining({
            userId: CUSTOMER_ID,
            budgetTier: "TIER_2",
          }),
        ],
      })
    );

    const active = await request(app)
      .get(`/api/v1/restaurants/${RESTAURANT_ID}/campaigns/active`)
      .set("X-User-Id", MANAGER_ID);

    expect(active.status).toBe(200);
    expect(active.body.campaign).toMatchObject({
      id: CAMPAIGN_ID,
      status: "active",
      discountPercent: 20,
    });

    const inbox = await request(app)
      .get("/api/v1/users/me/offers")
      .set("X-User-Id", CUSTOMER_ID);

    expect(inbox.status).toBe(200);
    expect(inbox.body.offers[0]).toMatchObject({
      id: OFFER_ID,
      campaignId: CAMPAIGN_ID,
      status: "pending",
      restaurantName: "Mercer Room",
    });
  });
});
