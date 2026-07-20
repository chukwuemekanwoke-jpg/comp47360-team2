const request = require("supertest");
const createApp = require("../app");

const app = createApp();

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/v1/status", () => {
  it("returns 200 with apiVersion v1", async () => {
    const res = await request(app).get("/api/v1/status");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.apiVersion).toBe("v1");
  });
});

describe("GET /api/v1/config/maps-key", () => {
  it("returns 404 when MAPS_JS_API_KEY is not configured", async () => {
    const res = await request(app).get("/api/v1/config/maps-key");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("unknown route", () => {
  it("returns 404", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/v1/users/me/bookings", () => {
  it("returns 401 when X-User-Id header is missing", async () => {
    const res = await request(app).get("/api/v1/users/me/bookings");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when X-User-Id is not a UUID", async () => {
    const res = await request(app)
      .get("/api/v1/users/me/bookings")
      .set("X-User-Id", "not-a-uuid");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/v1/restaurants/:restaurantId/bookings", () => {
  it("returns 401 when X-User-Id header is missing", async () => {
    const res = await request(app).get(
      "/api/v1/restaurants/550e8400-e29b-41d4-a716-446655441001/bookings"
    );
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when X-User-Id is not a UUID", async () => {
    const res = await request(app)
      .get("/api/v1/restaurants/550e8400-e29b-41d4-a716-446655441001/bookings")
      .set("X-User-Id", "not-a-uuid");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
