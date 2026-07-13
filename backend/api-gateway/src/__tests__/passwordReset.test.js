const {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_TTL_MINUTES,
} = require("../utils/passwordReset");

describe("passwordReset utils", () => {
  it("generates a raw token and matching SHA-256 hash", () => {
    const { rawToken, tokenHash } = generateResetToken();

    expect(rawToken).toHaveLength(64);
    expect(tokenHash).toBe(hashResetToken(rawToken));
    expect(tokenHash).toHaveLength(64);
  });

  it("uses a 30-minute TTL constant", () => {
    expect(RESET_TOKEN_TTL_MINUTES).toBe(30);
  });
});
