const { rateLimit, MemoryStore } = require("express-rate-limit");
const { AppError } = require("../errors");
const config = require("../config");

/**
 * Build an IP-based limiter that returns the gateway's standard error envelope
 * via AppError → errorHandler (429 RATE_LIMITED).
 *
 * When disabled (default in NODE_ENV=test), returns a no-op middleware so Jest
 * does not retain MemoryStore cleanup timers. Pass `force: true` for dedicated
 * limiter tests.
 */
function createRateLimiter({
  windowMs,
  max,
  message = "Too many requests, please try again later",
  force = false,
  store,
} = {}) {
  if (!force && !config.rateLimitEnabled) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    ...(store ? { store } : {}),
    handler: (_req, _res, next) => {
      next(new AppError(429, "RATE_LIMITED", message));
    },
  });
}

/** Auth routes: login/register/forgot/reset brute-force and email spam protection. */
const authRateLimiter = createRateLimiter({
  windowMs: config.rateLimitAuthWindowMs,
  max: config.rateLimitAuthMax,
  message: "Too many authentication attempts, please try again later",
});

/** Sensitive writes: booking create + campaign create. */
const writeRateLimiter = createRateLimiter({
  windowMs: config.rateLimitWriteWindowMs,
  max: config.rateLimitWriteMax,
  message: "Too many requests, please try again later",
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
  writeRateLimiter,
  MemoryStore,
};
