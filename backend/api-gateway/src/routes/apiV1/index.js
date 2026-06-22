const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { checkConnection } = require("../../db/pool");
const usersRouter = require("./users");
const restaurantsRouter = require("./restaurants");
const bookingsRouter = require("./bookings");

const router = Router();

router.use("/users", usersRouter);
router.use("/restaurants", restaurantsRouter);
router.use("/bookings", bookingsRouter);

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

module.exports = router;
