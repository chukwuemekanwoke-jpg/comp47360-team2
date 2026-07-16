const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { checkConnection } = require("../../db/pool");
const { AppError } = require("../../errors");
const config = require("../../config");
const authRouter = require("./auth");
const usersRouter = require("./users");
const restaurantsRouter = require("./restaurants");
const bookingsRouter = require("./bookings");
const offersRouter = require("./offers");

const router = Router();

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/restaurants", restaurantsRouter);
router.use("/bookings", bookingsRouter);
router.use("/offers", offersRouter);

router.get(
  "/status",
  asyncHandler(async (_req, res) => {
    const db = await checkConnection();
    res.status(200).json({
      status: "ok",
      apiVersion: "v1",
      database: db.configured
        ? db.ok
          ? "connected"
          : "error"
        : "not_configured",
      ...(db.message ? { databaseMessage: db.message } : {}),
    });
  })
);

// Serves the Google Maps browser key from Secret Manager at runtime (see
// RestaurantLocationPicker.jsx) so it never sits in the frontend build/source
// control and can be rotated without a redeploy. Deliberately a separate key
// from config.googleMapsApiKey (server-side Routes API) — that one must stay
// unrestricted-by-referrer for server-to-server calls, while this one should
// carry an HTTP-referrer restriction, which the two can't share safely.
router.get(
  "/config/maps-key",
  asyncHandler(async (_req, res) => {
    if (!config.mapsJsApiKey) {
      throw new AppError(404, "NOT_FOUND", "Maps API key not configured");
    }
    res.status(200).json({ apiKey: config.mapsJsApiKey });
  })
);

module.exports = router;
