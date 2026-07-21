jest.mock("../config", () => ({
  port: 3001,
  databaseUrl: null,
  corsOrigins: ["http://localhost:5173"],
  nodeEnv: "test",
  mlServiceUrl: "http://localhost:8000",
  mlMatchTimeoutMs: 5000,
  mlBusynessTimeoutMs: 5000,
  googleMapsApiKey: null,
  googleRoutesUrl: "https://routes.example.test/distanceMatrix/v2:computeRouteMatrix",
  etaTimeoutMs: 3000,
  mapsJsApiKey: "test-browser-key",
  jwtSecret: "test-jwt-secret",
  jwtExpiresIn: "7d",
  webAppUrl: "http://localhost:5173",
}));

const request = require("supertest");
const createApp = require("../app");

const app = createApp();

describe("GET /api/v1/config/maps-key (configured)", () => {
  it("returns 200 with the browser key when MAPS_JS_API_KEY is set", async () => {
    const res = await request(app).get("/api/v1/config/maps-key");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ apiKey: "test-browser-key" });
  });
});
