const { AppError } = require("../errors");
const {
  FLASH_DEAL_TTL_SECONDS,
  MATCH_RADIUS_M,
  findNearbyCandidates,
  toMlCandidates,
  toMlRestaurant,
} = require("../services/candidateUsers");
const { insertOffersForUsers } = require("../services/offerInsert");
const { expirePendingOffers } = require("../services/offers");
const { getCachedEta, setCachedEta, CACHE_TTL_MS } = require("../utils/etaCache");
const {
  haversineMeters,
  computeEtaMinutes,
  buildEtaMessage,
  buildEtaResult,
  finalizeEtaResult,
} = require("../utils/geo");
const {
  toRestaurantSummary,
  toRestaurantDetail,
  toOfferInboxItem,
  toBookingJson,
} = require("../utils/serialize");
const {
  DEFAULT_RADIUS_M,
  DEFAULT_TRANSPORT_MODE,
  parseLatLng,
  parseRadiusM,
  parseTransportMode,
  parseBodyLatLng,
  validateCampaignBody,
  validateBudgetTier,
  validateDietaryTags,
  requireNonEmptyString,
} = require("../utils/validate");

const RESTAURANT_ID = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-06-30T12:00:00.000Z");

describe("geo utilities", () => {
  it("calculates distance, ETA, and bookability messages", () => {
    const distance = haversineMeters(40.73, -73.99, 40.731, -73.991);

    expect(distance).toBeGreaterThan(100);
    expect(computeEtaMinutes(1000, "walking")).toBe(12);
    expect(computeEtaMinutes(1000, "unknown")).toBe(12);
    expect(buildEtaMessage(8, 15, true)).toContain("Within 15 min");
    expect(buildEtaMessage(25, 15, false)).toBe("You are too far to guarantee this table.");
  });

  it("builds ETA results from estimates and finalized live durations", () => {
    const estimated = buildEtaResult({
      restaurantId: RESTAURANT_ID,
      transportMode: "walking",
      userLat: 40.73,
      userLng: -73.99,
      restaurant: {
        latitude: 40.731,
        longitude: -73.991,
        hold_window_minutes: 15,
      },
    });

    expect(estimated).toMatchObject({
      restaurantId: RESTAURANT_ID,
      transportMode: "walking",
      holdWindowMinutes: 15,
      canBook: true,
      source: "estimate",
    });

    expect(
      finalizeEtaResult({
        restaurantId: RESTAURANT_ID,
        transportMode: "driving",
        etaMinutes: 12,
        holdWindowMinutes: 15,
        source: "google",
      })
    ).toMatchObject({
      etaMinutes: 12,
      canBook: true,
      source: "google",
    });
  });
});

describe("validation utilities", () => {
  it("parses valid query/body values and applies defaults", () => {
    expect(parseLatLng("40.73", "-73.99")).toEqual({ lat: 40.73, lng: -73.99 });
    expect(parseRadiusM(undefined)).toBe(DEFAULT_RADIUS_M);
    expect(parseRadiusM("500")).toBe(500);
    expect(parseTransportMode(undefined)).toBe(DEFAULT_TRANSPORT_MODE);
    expect(parseBodyLatLng(40.73, -73.99)).toEqual({ lat: 40.73, lng: -73.99 });
    expect(validateCampaignBody({ tableQuota: 2, discountPercent: 20 })).toEqual({
      tableQuota: 2,
      discountPercent: 20,
      ttlMinutes: 15,
      ttlSeconds: 900,
    });
    expect(validateCampaignBody({ tableQuota: 2, discountPercent: 20, ttlMinutes: 30 })).toEqual({
      tableQuota: 2,
      discountPercent: 20,
      ttlMinutes: 30,
      ttlSeconds: 1800,
    });
    expect(requireNonEmptyString(" Tablé ", "name")).toBe("Tablé");
  });

  it("throws typed AppErrors for invalid inputs", () => {
    expect(() => parseLatLng(undefined, -73.99)).toThrow(AppError);
    expect(() => parseLatLng("not-a-number", -73.99)).toThrow("Invalid lat");
    expect(() => parseLatLng(40.73, -199)).toThrow("lng must be between");
    expect(() => parseRadiusM("0")).toThrow("radiusM must be a positive integer");
    expect(() => validateBudgetTier("VIP")).toThrow("budgetTier must be one of");
    expect(() => validateDietaryTags("vegetarian")).toThrow("dietaryTags must be an array");
    expect(() => parseTransportMode("scooter")).toThrow("mode must be one of");
    expect(() => parseBodyLatLng(40.73, undefined)).toThrow("userLat and userLng are required");
    expect(() => validateCampaignBody({ tableQuota: 0, discountPercent: 20 })).toThrow(
      "tableQuota must be a positive integer"
    );
    expect(() => validateCampaignBody({ tableQuota: 1, discountPercent: 99 })).toThrow(
      "discountPercent must be an integer"
    );
    expect(() => validateCampaignBody({ tableQuota: 1, discountPercent: 20, ttlMinutes: 5 })).toThrow(
      "ttlMinutes must be an integer between 10 and 60"
    );
    expect(() => requireNonEmptyString("", "displayName")).toThrow("displayName is required");
  });
});

describe("serialization utilities", () => {
  it("serializes restaurant summary/detail, offers, and bookings", () => {
    const restaurantRow = {
      id: RESTAURANT_ID,
      name: "Mercer Room",
      latitude: "40.73",
      longitude: "-73.99",
      neighborhood: "Manhattan",
      available_table_count: 3,
      capacity: 24,
      cuisine: "Omakase",
      busyness_score: "0.42",
      rating: "4.7",
      reviews: 362,
      is_wheelchair_accessible: true,
      sensory_friendly: false,
      distance_meters: "452.6",
      address_line: "12 Mercer Street",
      hold_window_minutes: 15,
    };

    expect(toRestaurantSummary(restaurantRow)).toMatchObject({
      latitude: 40.73,
      longitude: -73.99,
      busynessScore: 0.42,
      rating: 4.7,
      reviews: 362,
      distanceMeters: 453,
    });
    expect(toRestaurantDetail(restaurantRow)).toMatchObject({
      addressLine: "12 Mercer Street",
      holdWindowMinutes: 15,
    });

    expect(
      toOfferInboxItem(
        {
          id: "offer-1",
          campaign_id: "campaign-1",
          restaurant_id: RESTAURANT_ID,
          restaurant_name: "Mercer Room",
          status: "pending",
          discount_percent: 30,
          expires_at: "2026-06-30T12:10:00.000Z",
        },
        NOW
      )
    ).toMatchObject({
      canAccept: true,
      secondsRemaining: 600,
      expiresAt: "2026-06-30T12:10:00.000Z",
    });

    expect(
      toBookingJson({
        id: "booking-1",
        user_id: "user-1",
        restaurant_id: RESTAURANT_ID,
        offer_id: "offer-1",
        campaign_id: "campaign-1",
        status: "confirmed",
        transport_mode: "walking",
        eta_minutes: 8,
        eta_source: "google",
        hold_expires_at: NOW,
        confirmed_at: NOW,
      })
    ).toMatchObject({
      id: "booking-1",
      offerId: "offer-1",
      confirmedAt: NOW.toISOString(),
    });
  });
});

describe("cache and offer helper services", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns cached ETA values until the TTL expires", () => {
    const value = { etaMinutes: 8 };

    setCachedEta(RESTAURANT_ID, 40.73001, -73.99001, "walking", value);

    expect(getCachedEta(RESTAURANT_ID, 40.73002, -73.99002, "walking")).toEqual(value);

    jest.setSystemTime(new Date(NOW.getTime() + CACHE_TTL_MS + 1));
    expect(getCachedEta(RESTAURANT_ID, 40.73002, -73.99002, "walking")).toBeNull();
  });

  it("expires pending offers for a user", async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };

    await expirePendingOffers(pool, "user-1");

    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE offers"), ["user-1"]);
  });

  it("finds nearby candidates and maps them to ML payload shape", async () => {
    const client = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [
          {
            id: "user-1",
            budget_tier: "TIER_2",
            dietary_tags: ["vegan"],
            preferred_cuisines: ["italian"],
            dining_styles: ["date-night"],
            requires_wheelchair_access: true,
            requires_sensory_friendly: false,
            distance_meters: "425.4",
          },
        ],
      }),
    };

    const rows = await findNearbyCandidates(client, {
      restaurant: {
        latitude: 40.73,
        longitude: -73.99,
        manager_user_id: "manager-1",
      },
      limit: 2,
    });

    expect(client.query).toHaveBeenCalledWith(expect.stringContaining("WITH nearby_users"), [
      40.73,
      -73.99,
      MATCH_RADIUS_M,
      "manager-1",
      2,
    ]);
    expect(client.query.mock.calls[0][0]).toContain(
      "JOIN user_preferences p ON p.user_id = u.id"
    );
    expect(client.query.mock.calls[0][0]).toContain("p.preferred_cuisines");
    expect(client.query.mock.calls[0][0]).toContain("p.dining_styles");
    expect(client.query.mock.calls[0][0]).toContain("p.requires_wheelchair_access");
    expect(client.query.mock.calls[0][0]).toContain("p.requires_sensory_friendly");
    expect(toMlCandidates(rows)).toEqual([
      {
        userId: "user-1",
        budgetTier: "TIER_2",
        dietaryTags: ["vegan"],
        preferredCuisines: ["italian"],
        diningStyles: ["date-night"],
        requiresWheelchairAccess: true,
        requiresSensoryFriendly: false,
        distanceMeters: 425,
      },
    ]);
  });

  it("maps a restaurant row to the ML payload shape", () => {
    expect(
      toMlRestaurant({
        id: "restaurant-1",
        cuisine: "italian",
        neighborhood: "Midtown",
        avg_check_per_cover: "48.50",
        is_wheelchair_accessible: true,
        sensory_friendly: false,
      })
    ).toEqual({
      id: "restaurant-1",
      cuisine: "italian",
      neighborhood: "Midtown",
      avgCheckPerCover: 48.5,
      isWheelchairAccessible: true,
      sensoryFriendly: false,
    });
  });

  it("defaults missing restaurant attributes in the ML payload", () => {
    expect(toMlRestaurant({ id: "restaurant-2" })).toEqual({
      id: "restaurant-2",
      cuisine: null,
      neighborhood: null,
      avgCheckPerCover: null,
      isWheelchairAccessible: false,
      sensoryFriendly: false,
    });
  });

  it("inserts offers for matched users and ignores conflict rows", async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: "offer-1" }] })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const offerIds = await insertOffersForUsers(client, {
      campaignId: "campaign-1",
      userIds: ["user-1", "user-2"],
    });

    expect(offerIds).toEqual(["offer-1"]);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining("INSERT INTO offers"), [
      "campaign-1",
      "user-1",
      FLASH_DEAL_TTL_SECONDS,
    ]);
  });
});
