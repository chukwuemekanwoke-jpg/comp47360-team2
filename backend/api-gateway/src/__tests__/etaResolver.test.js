jest.mock("../config", () => ({
  googleMapsApiKey: "test-key",
  googleRoutesUrl: "https://routes.example.test/distanceMatrix/v2:computeRouteMatrix",
  etaTimeoutMs: 1000,
}));

jest.mock("../services/googleDistanceMatrix", () => ({
  getDistanceMatrixDurationMinutes: jest.fn(),
}));

const { getDistanceMatrixDurationMinutes } = require("../services/googleDistanceMatrix");
const { resolveEtaResult } = require("../services/etaResolver");

const restaurant = {
  latitude: 40.7614,
  longitude: -73.9857,
  hold_window_minutes: 15,
};

const baseArgs = {
  restaurantId: "550e8400-e29b-41d4-a716-446655441001",
  transportMode: "walking",
  userLat: 40.7589,
  userLng: -73.9851,
  restaurant,
};

beforeEach(() => {
  getDistanceMatrixDurationMinutes.mockReset();
});

describe("resolveEtaResult", () => {
  it("uses the Google duration and tags source=google", async () => {
    getDistanceMatrixDurationMinutes.mockResolvedValue(8);

    const result = await resolveEtaResult(baseArgs);

    expect(getDistanceMatrixDurationMinutes).toHaveBeenCalledTimes(1);
    expect(result.source).toBe("google");
    expect(result.etaMinutes).toBe(8);
    expect(result.canBook).toBe(true); // 8 <= 15 hold window
  });

  it("marks canBook false when Google ETA exceeds the hold window", async () => {
    getDistanceMatrixDurationMinutes.mockResolvedValue(40);

    const result = await resolveEtaResult(baseArgs);

    expect(result.source).toBe("google");
    expect(result.canBook).toBe(false);
  });

  it("falls back to the haversine estimate when Google fails", async () => {
    getDistanceMatrixDurationMinutes.mockRejectedValue(new Error("timeout"));

    const result = await resolveEtaResult(baseArgs);

    expect(result.source).toBe("estimate");
    expect(result.etaMinutes).toBeGreaterThan(0);
    expect(typeof result.canBook).toBe("boolean");
  });
});
