const express = require("express");
const cors = require("cors");
const config = require("./config");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const healthRouter = require("./routes/health");
const apiV1Router = require("./routes/apiV1");

function createApp() {
  const app = express();

  // Cloud Run / reverse proxies set X-Forwarded-For; needed so rate limits key
  // on the client IP rather than the shared load-balancer address.
  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-User-Id", "Authorization"],
      credentials: true,
    })
  );

  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/api/v1", apiV1Router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;