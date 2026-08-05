const crypto = require("crypto");
const { rateLimit, MemoryStore, ipKeyGenerator } = require("express-rate-limit");
const { AppError } = require("../errors");
const config = require("../config");

function hashRateLimitIdentity(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return "anonymous";
  }
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

/**
 * Keep auth budgets separate by endpoint and account/token identity while
 * retaining the client IP as one component. Users behind the same carrier
 * NAT no longer consume one shared login/register/forgot-password budget.
 * Raw emails and reset tokens are hashed before becoming store keys.
 */
function authRateLimitKey(req) {
  const routeKey = `${req.method}:${req.baseUrl}${req.path}`;
  const identity = req.body?.email ?? req.body?.token;
  return `${routeKey}:${ipKeyGenerator(req.ip)}:${hashRateLimitIdentity(identity)}`;
}

/**
 * Build a limiter that returns the gateway's standard error envelope
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
  keyGenerator,
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
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (_req, _res, next) => {
      next(new AppError(429, "RATE_LIMITED", message));
    },
  });
}

/** Auth routes: login/register/forgot/reset brute-force and email spam protection. */
const authRateLimiter = createRateLimiter({
  windowMs: config.rateLimitAuthWindowMs,
  max: config.rateLimitAuthMax,
  keyGenerator: authRateLimitKey,
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
  authRateLimitKey,
  hashRateLimitIdentity,
  MemoryStore,
};
