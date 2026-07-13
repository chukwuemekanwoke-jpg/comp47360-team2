const crypto = require("crypto");

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MINUTES = 30;

function generateResetToken() {
  const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  return { rawToken, tokenHash };
}

function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

module.exports = {
  RESET_TOKEN_TTL_MINUTES,
  generateResetToken,
  hashResetToken,
};
