const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const DEFAULT_CORS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8081",
  "http://127.0.0.1:8081",
];

function parseCorsOrigins(value) {
  if (!value || value.trim() === "") {
    return DEFAULT_CORS;
  }
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

const config = {
  port: Number(process.env.PORT) || 3001,
  databaseUrl: process.env.DATABASE_URL || null,
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  nodeEnv: process.env.NODE_ENV || "development",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
  mlMatchTimeoutMs: Number(process.env.ML_MATCH_TIMEOUT_MS) || 5000,
  mlBusynessTimeoutMs: Number(process.env.ML_BUSYNESS_TIMEOUT_MS) || 5000,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || null,
  // Separate from googleMapsApiKey above: that one is called server-to-server
  // (Routes API) and must stay unrestricted-by-referrer. This one is handed
  // to the browser via GET /config/maps-key, so it needs its own key with an
  // HTTP-referrer restriction — the two can't safely share one key.
  mapsJsApiKey: process.env.MAPS_JS_API_KEY || null,
  googleRoutesUrl:
    process.env.GOOGLE_ROUTES_URL
    || "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
  etaTimeoutMs: Number(process.env.ETA_TIMEOUT_MS) || 3000,
  jwtSecret:
    process.env.JWT_SECRET
    || (process.env.NODE_ENV === "production" ? null : "dev-jwt-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  webAppUrl: process.env.WEB_APP_URL || "http://localhost:5173",
  // Rate limiting (sensitive routes). Off by default in test so suites stay stable;
  // set RATE_LIMIT_ENABLED=true/false to override.
  rateLimitEnabled: (() => {
    if (process.env.RATE_LIMIT_ENABLED === "true") return true;
    if (process.env.RATE_LIMIT_ENABLED === "false") return false;
    return (process.env.NODE_ENV || "development") !== "test";
  })(),
  rateLimitAuthWindowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitAuthMax: Number(process.env.RATE_LIMIT_AUTH_MAX) || 20,
  rateLimitWriteWindowMs: Number(process.env.RATE_LIMIT_WRITE_WINDOW_MS) || 15 * 60 * 1000,
  rateLimitWriteMax: Number(process.env.RATE_LIMIT_WRITE_MAX) || 60,
};

if (!config.jwtSecret) {
  throw new Error("JWT_SECRET is required when NODE_ENV=production");
}

module.exports = config;
