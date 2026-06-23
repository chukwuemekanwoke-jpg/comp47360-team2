const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const { AppError } = require("../../errors");

const router = Router();

router.post(
  "/:offerId/accept",
  asyncHandler(async (_req, _res) => {
    throw new AppError(501, "NOT_IMPLEMENTED", "Accepting flash deals is not implemented yet");
  })
);

module.exports = router;
