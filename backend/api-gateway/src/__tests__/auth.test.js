const request = require("supertest");

const mockPool = {
  query: jest.fn(),
};

jest.mock("../db/pool", () => ({
  getPool: jest.fn(() => mockPool),
  checkConnection: jest.fn(async () => ({ configured: true, ok: true })),
  closePool: jest.fn(),
}));

const createApp = require("../app");
const { hashPassword } = require("../utils/password");
const { signAccessToken } = require("../utils/jwt");

const app = createApp();

const USER_ID = "11111111-1111-4111-8111-111111111111";
const RESTAURANT_ID = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-06-30T12:00:00.000Z");

function authUserRow(overrides = {}) {
  return {
    id: USER_ID,
    display_name: "Demo Manager",
    budget_tier: null,
    dietary_tags: [],
    last_lat: null,
    last_lng: null,
    created_at: NOW,
    email: "manager@demo.com",
    token_version: 0,
    password_hash: "$2b$10$d6x4wB2hGK7ox5OQioj7VeJ9EYNJCoG.mKCvwFAB1I/Jewo7coF0K",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPool.query.mockReset();
});

describe("POST /api/v1/auth/register", () => {
  it("creates an account and returns a JWT session", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [authUserRow({ email: "new@example.com" })] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "new@example.com",
        password: "password123",
        displayName: "New User",
      });

    expect(res.status).toBe(201);
    expect(res.body.userId).toBe(USER_ID);
    expect(res.body.user.displayName).toBe("Demo Manager");
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.restaurantId).toBeNull();
  });

  it("returns 409 when email already exists", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [authUserRow()] });

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: "manager@demo.com",
        password: "password123",
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("returns a JWT session for valid credentials", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [authUserRow()] })
      .mockResolvedValueOnce({ rows: [{ id: RESTAURANT_ID }] });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "manager@demo.com",
        password: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(USER_ID);
    expect(res.body.restaurantId).toBe(RESTAURANT_ID);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("returns 401 for invalid password", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [authUserRow()] });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "manager@demo.com",
        password: "wrong-password",
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("POST /api/v1/auth/forgot-password", () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("returns the same acknowledgement for unknown emails", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "missing@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reset link has been sent/i);
    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("stores a reset token and logs the link for password accounts", async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [authUserRow()] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "manager@demo.com" });

    expect(res.status).toBe(200);
    expect(mockPool.query).toHaveBeenLastCalledWith(
      expect.stringContaining("password_reset_token_hash"),
      expect.arrayContaining([USER_ID])
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[password-reset\].*reset-password\?token=/)
    );
  });
});

describe("POST /api/v1/auth/reset-password", () => {
  it("updates the password and clears the reset token", async () => {
    const { generateResetToken } = require("../utils/passwordReset");
    const { rawToken, tokenHash } = generateResetToken();

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: rawToken, newPassword: "newpassword123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated successfully/i);
    expect(mockPool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("password_reset_token_hash = $1"),
      [tokenHash]
    );
    expect(mockPool.query).toHaveBeenLastCalledWith(
      expect.stringContaining("token_version = token_version + 1"),
      expect.arrayContaining([USER_ID])
    );
  });

  it("returns 400 for an invalid reset token", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/v1/auth/reset-password")
      .send({ token: "not-a-real-token", newPassword: "newpassword123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toMatch(/Invalid or expired/i);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("revokes the JWT by incrementing token_version", async () => {
    const token = signAccessToken({ userId: USER_ID, tokenVersion: 0 });

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, token_version: 0 }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "logged_out" });
    expect(mockPool.query).toHaveBeenLastCalledWith(
      expect.stringContaining("token_version = token_version + 1"),
      [USER_ID]
    );
  });

  it("rejects revoked tokens on protected routes", async () => {
    const token = signAccessToken({ userId: USER_ID, tokenVersion: 0 });

    mockPool.query.mockResolvedValueOnce({ rows: [{ id: USER_ID, token_version: 1 }] });

    const res = await request(app)
      .get("/api/v1/users/me/bookings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/revoked/i);
  });
});

describe("password utils", () => {
  it("hashes passwords", async () => {
    const hash = await hashPassword("password123");
    expect(hash).not.toBe("password123");
  });
});
