const jwt = require("jsonwebtoken");
const config = require("../config");
const { AppError } = require("../errors");

function signAccessToken({ userId, tokenVersion }) {
  return jwt.sign(
    { sub: userId, tv: tokenVersion },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (!payload?.sub) {
      throw new AppError(401, "UNAUTHORIZED", "Invalid token");
    }
    return {
      userId: payload.sub,
      tokenVersion: Number(payload.tv ?? 0),
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(401, "UNAUTHORIZED", "Invalid or expired token");
  }
}

module.exports = { signAccessToken, verifyAccessToken };
