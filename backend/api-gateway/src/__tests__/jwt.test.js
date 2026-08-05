const { signAccessToken, verifyAccessToken } = require("../utils/jwt");
const { AppError } = require("../errors");

describe("jwt utils", () => {
  const userId = "11111111-1111-4111-8111-111111111111";

  it("signs and verifies a token with sub and tv claims", () => {
    const token = signAccessToken({ userId, tokenVersion: 2 });
    const payload = verifyAccessToken(token);
    expect(payload).toEqual({ userId, tokenVersion: 2 });
  });

  it("rejects tampered tokens", () => {
    const token = signAccessToken({ userId, tokenVersion: 0 });
    expect(() => verifyAccessToken(`${token}x`)).toThrow(AppError);
    try {
      verifyAccessToken(`${token}x`);
    } catch (err) {
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe("UNAUTHORIZED");
    }
  });
});
