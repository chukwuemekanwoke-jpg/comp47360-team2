const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const DEFAULT_CORS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
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
};

module.exports = config;
