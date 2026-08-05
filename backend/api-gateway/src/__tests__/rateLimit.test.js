const express = require("express");
const request = require("supertest");
const {
  createRateLimiter,
  authRateLimitKey,
  hashRateLimitIdentity,
  MemoryStore,
} = require("../middleware/rateLimit");
const errorHandler = require("../middleware/errorHandler");

describe("rateLimit middleware", () => {
  let store;

  afterEach(async () => {
    if (store) {
      await store.shutdown();
      store = null;
    }
  });

  it("returns 429 RATE_LIMITED after exceeding max", async () => {
    store = new MemoryStore();
    const app = express();
    app.set("trust proxy", 1);
    app.use(
      createRateLimiter({
        windowMs: 60_000,
        max: 2,
        message: "Too many authentication attempts, please try again later",
        force: true,
        store,
      })
    );
    app.post("/probe", (_req, res) => res.status(200).json({ ok: true }));
    app.use(errorHandler);

    await request(app).post("/probe").expect(200);
    await request(app).post("/probe").expect(200);

    const limited = await request(app).post("/probe");
    expect(limited.status).toBe(429);
    expect(limited.body.error).toMatchObject({
      code: "RATE_LIMITED",
      message: "Too many authentication attempts, please try again later",
    });
    expect(limited.headers["ratelimit-limit"]).toBe("2");
  });

  it("skips limiting when force is false and rateLimitEnabled is off (test default)", async () => {
    const app = express();
    app.use(
      createRateLimiter({
        windowMs: 60_000,
        max: 1,
        force: false,
      })
    );
    app.post("/probe", (_req, res) => res.status(200).json({ ok: true }));
    app.use(errorHandler);

    await request(app).post("/probe").expect(200);
    await request(app).post("/probe").expect(200);
    await request(app).post("/probe").expect(200);
  });

  it("gives different accounts behind the same IP independent auth budgets", async () => {
    store = new MemoryStore();
    const app = express();
    app.set("trust proxy", 1);
    app.use(express.json());
    app.use(
      "/auth",
      createRateLimiter({
        windowMs: 60_000,
        max: 1,
        force: true,
        store,
        keyGenerator: authRateLimitKey,
      })
    );
    app.post("/auth/login", (_req, res) => res.status(200).json({ ok: true }));
    app.use(errorHandler);

    await request(app)
      .post("/auth/login")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({ email: "first@example.com" })
      .expect(200);

    await request(app)
      .post("/auth/login")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({ email: "second@example.com" })
      .expect(200);

    const repeated = await request(app)
      .post("/auth/login")
      .set("X-Forwarded-For", "203.0.113.10")
      .send({ email: " FIRST@example.com " });

    expect(repeated.status).toBe(429);
    expect(repeated.body.error.code).toBe("RATE_LIMITED");
  });

  it("hashes normalized auth identities before using them as store keys", () => {
    expect(hashRateLimitIdentity(" User@Example.com ")).toBe(
      hashRateLimitIdentity("user@example.com")
    );
    expect(hashRateLimitIdentity("user@example.com")).not.toContain("user@example.com");
    expect(hashRateLimitIdentity(undefined)).toBe("anonymous");
  });
});
