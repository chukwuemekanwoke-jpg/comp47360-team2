jest.mock("../services/etaResolver", () => ({
  resolveEtaResult: jest.fn(),
}));

const { createBooking } = require("../services/createBooking");
const { resolveEtaResult } = require("../services/etaResolver");

const USER_ID = "11111111-1111-4111-8111-111111111111";
const RESTAURANT_ID = "22222222-2222-4222-8222-222222222222";
const OFFER_ID = "33333333-3333-4333-8333-333333333333";
const CAMPAIGN_ID = "44444444-4444-4444-8444-444444444444";
const EXISTING_BOOKING_ID = "66666666-6666-4666-8666-666666666666";

function createClientWithRows(rowSets) {
  return {
    query: jest.fn().mockImplementation(() => {
      const rows = rowSets.shift() ?? [];
      return Promise.resolve({ rows, rowCount: rows.length });
    }),
  };
}

function restaurant(overrides = {}) {
  return {
    id: RESTAURANT_ID,
    latitude: 40.735,
    longitude: -73.99,
    hold_window_minutes: 15,
    available_table_count: 2,
    avg_check_per_cover: 52.8,
    cuisine: "american",
    neighborhood: "Midtown",
    ...overrides,
  };
}

function booking(overrides = {}) {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    user_id: USER_ID,
    restaurant_id: RESTAURANT_ID,
    offer_id: null,
    campaign_id: null,
    status: "confirmed",
    transport_mode: "walking",
    eta_minutes: 8,
    hold_expires_at: new Date("2026-06-30T12:15:00.000Z"),
    confirmed_at: new Date("2026-06-30T12:00:00.000Z"),
    ...overrides,
  };
}

/** Empty lapse + empty active-booking check before the restaurant lock. */
function lifecyclePrelude() {
  return [[], []];
}

beforeEach(() => {
  jest.clearAllMocks();
  resolveEtaResult.mockResolvedValue({
    restaurantId: RESTAURANT_ID,
    transportMode: "walking",
    etaMinutes: 8,
    holdWindowMinutes: 15,
    canBook: true,
    source: "estimate",
    message: "ETA: 8 mins (Within 15 min hold window)",
  });
});

describe("createBooking", () => {
  it("creates a booking, decrements inventory, and carries ETA source", async () => {
    const client = createClientWithRows([
      ...lifecyclePrelude(),
      [restaurant()],
      [booking()],
      [],
      [],
    ]);

    const result = await createBooking(client, {
      userId: USER_ID,
      restaurantId: RESTAURANT_ID,
      transportMode: "walking",
      userLat: 40.73,
      userLng: -73.99,
    });

    expect(result).toMatchObject({
      user_id: USER_ID,
      restaurant_id: RESTAURANT_ID,
      status: "confirmed",
      eta_source: "estimate",
    });
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE restaurants"), [
      RESTAURANT_ID,
    ]);
  });

  it("persists party size and simulated check amount for RevPASH", async () => {
    const client = createClientWithRows([
      ...lifecyclePrelude(),
      [restaurant()],
      [booking()],
      [],
      [],
    ]);

    await createBooking(client, {
      userId: USER_ID,
      restaurantId: RESTAURANT_ID,
      transportMode: "walking",
      userLat: 40.73,
      userLng: -73.99,
      partySize: 4,
    });

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("party_size"),
      expect.arrayContaining([4, 211.2, 90])
    );
  });

  it("rejects booking when no tables are available", async () => {
    const client = createClientWithRows([
      ...lifecyclePrelude(),
      [restaurant({ available_table_count: 0 })],
    ]);

    await expect(
      createBooking(client, {
        userId: USER_ID,
        restaurantId: RESTAURANT_ID,
        transportMode: "walking",
        userLat: 40.73,
        userLng: -73.99,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
      message: "No tables available at this restaurant",
    });
  });

  it("rejects booking when ETA exceeds the hold window", async () => {
    resolveEtaResult.mockResolvedValueOnce({
      restaurantId: RESTAURANT_ID,
      transportMode: "walking",
      etaMinutes: 25,
      holdWindowMinutes: 15,
      canBook: false,
      source: "google",
      message: "You are too far to guarantee this table.",
    });
    const client = createClientWithRows([...lifecyclePrelude(), [restaurant()]]);

    await expect(
      createBooking(client, {
        userId: USER_ID,
        restaurantId: RESTAURANT_ID,
        transportMode: "walking",
        userLat: 40.73,
        userLng: -73.99,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
      details: {
        etaMinutes: 25,
        holdWindowMinutes: 15,
      },
    });
  });

  it("rejects booking when the user already has an active booking", async () => {
    const client = createClientWithRows([[], [{ id: EXISTING_BOOKING_ID }]]);

    await expect(
      createBooking(client, {
        userId: USER_ID,
        restaurantId: RESTAURANT_ID,
        transportMode: "walking",
        userLat: 40.73,
        userLng: -73.99,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
      message: "User already has an active booking",
      details: { bookingId: EXISTING_BOOKING_ID },
    });
  });

  it("marks a valid offer as accepted when booking uses a pending offer", async () => {
    const client = createClientWithRows([
      ...lifecyclePrelude(),
      [restaurant()],
      [
        {
          id: OFFER_ID,
          status: "pending",
          expires_at: new Date("2099-01-01T00:00:00.000Z"),
          campaign_id: CAMPAIGN_ID,
          restaurant_id: RESTAURANT_ID,
          discount_percent: 20,
        },
      ],
      [booking({ offer_id: OFFER_ID, campaign_id: CAMPAIGN_ID })],
      [],
      [],
      [],
    ]);

    const result = await createBooking(client, {
      userId: USER_ID,
      restaurantId: RESTAURANT_ID,
      transportMode: "walking",
      userLat: 40.73,
      userLng: -73.99,
      offerId: OFFER_ID,
    });

    expect(result.offer_id).toBe(OFFER_ID);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE offers"), [
      OFFER_ID,
    ]);
  });
});
