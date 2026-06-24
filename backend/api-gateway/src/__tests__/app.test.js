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

describe("unknown route", () => {
  it("returns 404", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    expect(res.status).toBe(404);
  });
});
