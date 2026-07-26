const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
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

jest.mock("../utils/password", () => ({
  hashPassword: jest.fn(async () => "hashed-password"),
  verifyPassword: jest.fn(async () => true),
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
const spec = yaml.load(
  fs.readFileSync(path.join(__dirname, "../../../../docs/openapi-v0.yaml"), "utf8")
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const MANAGER_ID = "22222222-2222-4222-8222-222222222222";
const RESTAURANT_ID = "33333333-3333-4333-8333-333333333333";
const BOOKING_ID = "44444444-4444-4444-8444-444444444444";
const CAMPAIGN_ID = "55555555-5555-4555-8555-555555555555";
const OFFER_ID = "66666666-6666-4666-8666-666666666666";
const NOW = new Date("2026-07-07T10:00:00.000Z");
const OFFER_EXPIRY = new Date("2099-01-01T00:15:00.000Z");

function resolveRef(ref) {
  return ref
    .replace(/^#\//, "")
    .split("/")
    .reduce((node, part) => node[part], spec);
}

function dereference(schema) {
  if (!schema) {
    return schema;
  }
  if (schema.$ref) {
    return { ...dereference(resolveRef(schema.$ref)), ...schema, $ref: undefined };
  }
  if (schema.allOf) {
    const merged = schema.allOf
      .map(dereference)
      .reduce(
        (acc, item) => ({
          ...acc,
          ...item,
          properties: { ...(acc.properties ?? {}), ...(item.properties ?? {}) },
          required: [...(acc.required ?? []), ...(item.required ?? [])],
        }),
        {}
      );
    return { ...merged, ...schema, allOf: undefined };
  }
  return schema;
}

function expectMatchesSchema(schema, value, label = "response") {
  const resolved = dereference(schema);
  if (!resolved) {
    return;
  }
  if (value === null) {
    expect(resolved.nullable).toBe(true);
    return;
  }
  if (resolved.enum) {
    expect(resolved.enum).toContain(value);
  }
  if (resolved.type === "object" || (!resolved.type && resolved.properties)) {
    expect(value).toEqual(expect.any(Object));
    const propertyNames = Object.keys(resolved.properties ?? {});
    if (propertyNames.length > 0) {
      expect(Object.keys(value).sort()).toEqual(
        expect.arrayContaining(propertyNames.filter((key) => key in value).sort())
      );
      for (const key of Object.keys(value)) {
        expect(propertyNames).toContain(key);
      }
    }
    for (const requiredKey of resolved.required ?? []) {
      expect(value).toHaveProperty(requiredKey);
    }
    for (const [key, childSchema] of Object.entries(resolved.properties ?? {})) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        expectMatchesSchema(childSchema, value[key], `${label}.${key}`);
      }
    }
    return;
  }
  if (resolved.type === "array") {
    expect(Array.isArray(value)).toBe(true);
    value.forEach((item, index) => expectMatchesSchema(resolved.items, item, `${label}[${index}]`));
    return;
  }
  if (resolved.type === "integer") {
    expect(Number.isInteger(value)).toBe(true);
    return;
  }
  if (resolved.type === "number") {
    expect(typeof value).toBe("number");
    return;
  }
  if (resolved.type === "boolean") {
    expect(typeof value).toBe("boolean");
    return;
  }
  if (resolved.type === "string") {
    expect(typeof value).toBe("string");
  }
}

function operation(specPath, method) {
  return spec.paths[specPath][method.toLowerCase()];
}

function requestSchema(specPath, method) {
  return operation(specPath, method).requestBody?.content?.["application/json"]?.schema;
}

function responseSchema(specPath, method, status) {
  const response = operation(specPath, method).responses[String(status)];
  const resolved = response?.$ref ? resolveRef(response.$ref) : response;
  return resolved?.content?.["application/json"]?.schema;
}

async function expectContract({ method, path: urlPath, specPath, headers = {}, body, status }) {
  const requestBodySchema = requestSchema(specPath, method);
  if (requestBodySchema && body !== undefined) {
    expectMatchesSchema(requestBodySchema, body, `${method} ${specPath} request`);
  }

  let req = request(app)[method.toLowerCase()](urlPath);
  for (const [key, value] of Object.entries(headers)) {
    req = req.set(key, value);
  }
  if (body !== undefined) {
    req = req.send(body);
  }

  const res = await req;
  expect(res.status).toBe(status);

  const schema = responseSchema(specPath, method, status);
  if (schema) {
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expectMatchesSchema(schema, res.body, `${method} ${specPath} ${status}`);
  }
  return res;
}

function userRow(overrides = {}) {
  return {
    id: CUSTOMER_ID,
    display_name: "Contract Diner",
    budget_tier: null,
    dietary_tags: [],
    preferred_cuisines: [],
    dining_styles: [],
    last_lat: null,
    last_lng: null,
    created_at: NOW,
    email: "contract.diner@example.com",
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

function bookingRow(overrides = {}) {
  return {
    id: BOOKING_ID,
    user_id: CUSTOMER_ID,
    restaurant_id: RESTAURANT_ID,
    offer_id: null,
    campaign_id: null,
    status: "confirmed",
    transport_mode: "walking",
    eta_minutes: 8,
    eta_source: "estimate",
    hold_expires_at: new Date(NOW.getTime() + 15 * 60 * 1000),
    confirmed_at: NOW,
    created_at: NOW,
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
    expires_at: OFFER_EXPIRY,
    ...overrides,
  };
}

class ContractDatabase {
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
    this.campaigns = new Map([[CAMPAIGN_ID, campaignRow()]]);
    this.offers = new Map([
      [
        OFFER_ID,
        {
          id: OFFER_ID,
          campaign_id: CAMPAIGN_ID,
          user_id: CUSTOMER_ID,
          status: "pending",
          expires_at: OFFER_EXPIRY,
          created_at: NOW,
        },
      ],
    ]);
    this.bookings = [bookingRow({ status: "completed" })];
  }

  connect() {
    return {
      query: jest.fn((sql, params = []) => this.query(sql, params)),
      release: jest.fn(),
    };
  }

  query(sql, params = []) {
    const text = sql.replace(/\s+/g, " ").trim();

    if (["BEGIN", "COMMIT", "ROLLBACK"].includes(text)) {
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("FROM users u") && text.includes("LOWER(u.email) = LOWER($1)")) {
      const email = String(params[0]).toLowerCase();
      return Promise.resolve({
        rows: [...this.users.values()].filter((user) => user.email?.toLowerCase() === email),
      });
    }

    if (text.includes("INSERT INTO users (display_name, email, password_hash)")) {
      const [displayName, email, passwordHash] = params;
      const row = userRow({
        display_name: displayName,
        email,
        password_hash: passwordHash,
      });
      this.users.set(CUSTOMER_ID, row);
      return Promise.resolve({ rows: [row] });
    }

    if (text.includes("INSERT INTO users (display_name)")) {
      const row = userRow({
        id: "77777777-7777-4777-8777-777777777777",
        display_name: params[0],
        email: null,
      });
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

    if (
      text.includes("FROM users u")
      && text.includes("JOIN user_preferences p")
      && text.includes("WHERE u.id = $1")
    ) {
      const user = this.users.get(params[0]);
      return Promise.resolve({ rows: user ? [user] : [] });
    }

    if (text.includes("UPDATE users SET") && text.includes("token_version = token_version + 1")) {
      const user = this.users.get(params[0]);
      user.token_version += 1;
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("INSERT INTO user_preferences (user_id)")) {
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("UPDATE user_preferences SET")) {
      const user = this.users.get(params[params.length - 1]);
      user.budget_tier = params[0];
      user.dietary_tags = params[1];
      user.preferred_cuisines = params[2] ?? [];
      user.dining_styles = params[3] ?? [];
      return Promise.resolve({ rows: [] });
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

    if (text.includes("FROM restaurants r WHERE r.id = $1")) {
      const restaurant = this.restaurants.get(params[0]);
      return Promise.resolve({ rows: restaurant ? [restaurant] : [] });
    }

    if (text.includes("SELECT id, latitude, longitude, hold_window_minutes FROM restaurants")) {
      const restaurant = this.restaurants.get(params[0]);
      return Promise.resolve({ rows: restaurant ? [restaurant] : [] });
    }

    if (text.includes("FROM restaurants WHERE id = $1 FOR UPDATE")) {
      const restaurant = this.restaurants.get(params[0]);
      return Promise.resolve({ rows: restaurant ? [restaurant] : [] });
    }

    if (text.includes("hold_expires_at <= NOW()") && text.includes("FOR UPDATE")) {
      return Promise.resolve({ rows: [] });
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
      return Promise.resolve({ rows: [], rowCount: 0 });
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
      const row = bookingRow({
        user_id: userId,
        restaurant_id: restaurantId,
        offer_id: offerId,
        campaign_id: campaignId,
        transport_mode: transportMode,
        eta_minutes: etaMinutes,
        hold_expires_at: new Date(NOW.getTime() + holdWindowMinutes * 60 * 1000),
      });
      this.bookings.unshift(row);
      return Promise.resolve({ rows: [row] });
    }

    if (text.includes("UPDATE restaurants SET available_table_count = available_table_count - 1")) {
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("SELECT id, user_id, restaurant_id")) {
      return Promise.resolve({
        rows: this.bookings.filter((booking) => booking.user_id === params[0]),
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
            discount_percent: campaign.discount_percent,
            campaign_status: campaign.status,
            campaign_expires_at: campaign.expires_at,
          },
        ],
      });
    }

    if (text.includes("UPDATE campaigns") && text.includes("status = 'expired'")) {
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("UPDATE offers") && text.includes("status = 'revoked'")) {
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("FROM campaigns") && text.includes("status = 'active'") && text.includes("FOR UPDATE")) {
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("UPDATE offers SET status = 'accepted'")) {
      const offer = this.offers.get(params[0]);
      offer.status = "accepted";
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("SELECT last_lat, last_lng FROM users WHERE id = $1")) {
      const user = this.users.get(params[0]);
      return Promise.resolve({
        rows: [{ last_lat: user?.last_lat ?? 40.73, last_lng: user?.last_lng ?? -73.99 }],
      });
    }

    if (text.includes("UPDATE offers SET status = 'expired'")) {
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("FROM offers o JOIN campaigns c ON c.id = o.campaign_id JOIN restaurants r")) {
      return Promise.resolve({
        rows: [...this.offers.values()].map((offer) => {
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
        }),
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
      return Promise.resolve({
        rows: [
          {
            id: CUSTOMER_ID,
            budget_tier: "TIER_2",
            dietary_tags: ["vegetarian"],
            distance_meters: 420,
          },
        ],
      });
    }

    if (text.includes("INSERT INTO offers")) {
      return Promise.resolve({ rows: [{ id: OFFER_ID }] });
    }

    if (text.includes("UPDATE offers SET status = 'expired'")) {
      return Promise.resolve({ rows: [] });
    }

    if (text.includes("FROM campaigns WHERE restaurant_id = $1 AND status = 'active'")) {
      const campaign = this.campaigns.get(CAMPAIGN_ID);
      return Promise.resolve({
        rows: campaign && campaign.status === "active" ? [campaign] : [],
      });
    }

    if (text.includes("FROM campaigns WHERE restaurant_id = $1")) {
      return Promise.resolve({ rows: [this.campaigns.get(CAMPAIGN_ID)] });
    }

    return Promise.reject(new Error(`Unhandled contract test SQL: ${text}`));
  }
}

describe("OpenAPI contract validation", () => {
  let db;
  let customerToken;
  let managerToken;

  beforeEach(async () => {
    db = new ContractDatabase();
    mockPool.query.mockImplementation((sql, params) => db.query(sql, params));
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

    const customer = await expectContract({
      method: "POST",
      path: "/api/v1/auth/register",
      specPath: "/api/v1/auth/register",
      status: 201,
      body: {
        email: "contract.diner@example.com",
        password: "password123",
        displayName: "Contract Diner",
      },
    });
    customerToken = customer.body.token;

    const manager = await expectContract({
      method: "POST",
      path: "/api/v1/auth/login",
      specPath: "/api/v1/auth/login",
      status: 200,
      body: {
        email: "manager@table.test",
        password: "password123",
      },
    });
    managerToken = manager.body.token;

    await expectContract({
      method: "PATCH",
      path: "/api/v1/users/me/preferences",
      specPath: "/api/v1/users/me/preferences",
      status: 200,
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        budgetTier: "TIER_2",
        dietaryTags: ["vegetarian"],
        preferredCuisines: ["Japanese"],
        diningStyles: ["casual"],
        lastLat: 40.73,
        lastLng: -73.99,
      },
    });
  });

  it("validates every documented successful API response against OpenAPI", async () => {
    await expectContract({ method: "GET", path: "/health", specPath: "/health", status: 200 });
    await expectContract({
      method: "GET",
      path: "/api/v1/status",
      specPath: "/api/v1/status",
      status: 200,
    });
    await expectContract({
      method: "POST",
      path: "/api/v1/users",
      specPath: "/api/v1/users",
      status: 201,
      body: { displayName: "Legacy User" },
    });
    await expectContract({
      method: "GET",
      path: "/api/v1/users/me",
      specPath: "/api/v1/users/me",
      status: 200,
      headers: { "X-User-Id": CUSTOMER_ID },
    });
    await expectContract({
      method: "GET",
      path: "/api/v1/restaurants/nearby?lat=40.73&lng=-73.99&radiusM=1500",
      specPath: "/api/v1/restaurants/nearby",
      status: 200,
      headers: { "X-User-Id": CUSTOMER_ID },
    });
    await expectContract({
      method: "GET",
      path: `/api/v1/restaurants/${RESTAURANT_ID}`,
      specPath: "/api/v1/restaurants/{restaurantId}",
      status: 200,
    });
    await expectContract({
      method: "GET",
      path: `/api/v1/restaurants/${RESTAURANT_ID}/eta?lat=40.73&lng=-73.99&mode=walking`,
      specPath: "/api/v1/restaurants/{restaurantId}/eta",
      status: 200,
    });
    await expectContract({
      method: "GET",
      path: `/api/v1/restaurants/${RESTAURANT_ID}/bookings`,
      specPath: "/api/v1/restaurants/{restaurantId}/bookings",
      status: 200,
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    await expectContract({
      method: "POST",
      path: "/api/v1/bookings",
      specPath: "/api/v1/bookings",
      status: 201,
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        restaurantId: RESTAURANT_ID,
        transportMode: "walking",
        userLat: 40.73,
        userLng: -73.99,
      },
    });
    await expectContract({
      method: "GET",
      path: "/api/v1/users/me/bookings",
      specPath: "/api/v1/users/me/bookings",
      status: 200,
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    await expectContract({
      method: "POST",
      path: `/api/v1/bookings/${BOOKING_ID}/cancel`,
      specPath: "/api/v1/bookings/{bookingId}/cancel",
      status: 200,
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    await expectContract({
      method: "GET",
      path: "/api/v1/users/me/offers?status=pending",
      specPath: "/api/v1/users/me/offers",
      status: 200,
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    await expectContract({
      method: "POST",
      path: `/api/v1/offers/${OFFER_ID}/accept`,
      specPath: "/api/v1/offers/{offerId}/accept",
      status: 200,
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    await expectContract({
      method: "GET",
      path: `/api/v1/restaurants/${RESTAURANT_ID}/campaigns`,
      specPath: "/api/v1/restaurants/{restaurantId}/campaigns",
      status: 200,
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    await expectContract({
      method: "POST",
      path: `/api/v1/restaurants/${RESTAURANT_ID}/campaigns`,
      specPath: "/api/v1/restaurants/{restaurantId}/campaigns",
      status: 201,
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { tableQuota: 2, discountPercent: 20 },
    });
    await expectContract({
      method: "GET",
      path: `/api/v1/restaurants/${RESTAURANT_ID}/campaigns/active`,
      specPath: "/api/v1/restaurants/{restaurantId}/campaigns/active",
      status: 200,
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    await expectContract({
      method: "POST",
      path: "/api/v1/auth/logout",
      specPath: "/api/v1/auth/logout",
      status: 200,
      headers: { Authorization: `Bearer ${customerToken}` },
    });
  });

  it("validates documented error envelopes and status codes against OpenAPI", async () => {
    await expectContract({
      method: "POST",
      path: "/api/v1/auth/login",
      specPath: "/api/v1/auth/login",
      status: 401,
      body: { email: "missing@example.com", password: "password123" },
    });
    await expectContract({
      method: "GET",
      path: "/api/v1/restaurants/not-a-uuid",
      specPath: "/api/v1/restaurants/{restaurantId}",
      status: 400,
    });
    await expectContract({
      method: "GET",
      path: "/api/v1/users/me/bookings",
      specPath: "/api/v1/users/me/bookings",
      status: 401,
    });
    await expectContract({
      method: "POST",
      path: "/api/v1/bookings",
      specPath: "/api/v1/bookings",
      status: 400,
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        restaurantId: "not-a-uuid",
        transportMode: "walking",
        userLat: 40.73,
        userLng: -73.99,
      },
    });
  });
});
