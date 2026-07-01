jest.mock("../config", () => ({
  googleMapsApiKey: "test-key",
  googleRoutesUrl: "https://routes.example.test/distanceMatrix/v2:computeRouteMatrix",
  etaTimeoutMs: 1000,
}));

const {
  getDistanceMatrixDurationMinutes,
  MODE_MAP,
  parseDurationSeconds,
} = require("../services/googleDistanceMatrix");

function mockFetchOnce(jsonBody, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => jsonBody,
    text: async () => JSON.stringify(jsonBody),
  });
}

function lastRequestBody() {
  return JSON.parse(global.fetch.mock.calls[0][1].body);
}

function lastRequestOptions() {
  return global.fetch.mock.calls[0][1];
}

const okElement = (duration) => [
  { originIndex: 0, destinationIndex: 0, condition: "ROUTE_EXISTS", duration },
];

const baseArgs = {
  originLat: 40.7589,
  originLng: -73.9851,
  destLat: 40.7614,
  destLng: -73.9857,
};

describe("getDistanceMatrixDurationMinutes (Routes API)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  it("returns duration rounded up to whole minutes", async () => {
    mockFetchOnce(okElement("610s"));

    const minutes = await getDistanceMatrixDurationMinutes({
      ...baseArgs,
      transportMode: "walking",
    });

    expect(minutes).toBe(11); // ceil(610 / 60)
  });

  it("POSTs with the API key + field mask headers", async () => {
    mockFetchOnce(okElement("120s"));

    await getDistanceMatrixDurationMinutes({ ...baseArgs, transportMode: "walking" });

    const opts = lastRequestOptions();
    expect(opts.method).toBe("POST");
    expect(opts.headers["X-Goog-Api-Key"]).toBe("test-key");
    expect(opts.headers["X-Goog-FieldMask"]).toContain("duration");
  });

  it("maps cycling to BICYCLE and omits routingPreference", async () => {
    mockFetchOnce(okElement("300s"));

    await getDistanceMatrixDurationMinutes({ ...baseArgs, transportMode: "cycling" });

    const body = lastRequestBody();
    expect(body.travelMode).toBe("BICYCLE");
    expect(body.routingPreference).toBeUndefined();
    expect(MODE_MAP.cycling).toBe("BICYCLE");
  });

  it("adds TRAFFIC_AWARE routingPreference only for driving", async () => {
    mockFetchOnce(okElement("480s"));

    await getDistanceMatrixDurationMinutes({ ...baseArgs, transportMode: "driving" });

    const body = lastRequestBody();
    expect(body.travelMode).toBe("DRIVE");
    expect(body.routingPreference).toBe("TRAFFIC_AWARE");
  });

  it("throws when the route is not found", async () => {
    mockFetchOnce([{ originIndex: 0, destinationIndex: 0, condition: "ROUTE_NOT_FOUND" }]);

    await expect(
      getDistanceMatrixDurationMinutes({ ...baseArgs, transportMode: "driving" })
    ).rejects.toThrow("ROUTE_NOT_FOUND");
  });

  it("throws on a non-OK HTTP response", async () => {
    mockFetchOnce({ error: { code: 403, message: "PERMISSION_DENIED" } }, false, 403);

    await expect(
      getDistanceMatrixDurationMinutes({ ...baseArgs, transportMode: "driving" })
    ).rejects.toThrow("Routes API HTTP 403");
  });
});

describe("parseDurationSeconds", () => {
  it("parses protobuf duration strings", () => {
    expect(parseDurationSeconds("244s")).toBe(244);
    expect(parseDurationSeconds("0.5s")).toBe(0.5);
  });

  it("returns NaN for malformed values", () => {
    expect(Number.isNaN(parseDurationSeconds(undefined))).toBe(true);
    expect(Number.isNaN(parseDurationSeconds("244"))).toBe(true);
  });
});
