const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const requireRestaurantManager = require("../../middleware/requireRestaurantManager");
const { AppError, isUuid } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toCampaignJson, toCampaignRevpashLiftJson } = require("../../utils/serialize");
const { validateCampaignBody } = require("../../utils/validate");
const { createCampaignOffers } = require("../../services/createCampaignOffers");
const { getCampaignOffers } = require("../../services/getCampaignOffers");
const { getCampaignRevpashLift } = require("../../services/getCampaignRevpashLift");

const router = Router({ mergeParams: true });

const CAMPAIGN_COLUMNS = `
  id, restaurant_id, status, table_quota, tables_claimed, discount_percent, created_at
`;

router.use(requireUser);
router.use(requireRestaurantManager);

router.get(
  "/active",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT ${CAMPAIGN_COLUMNS}
       FROM campaigns
       WHERE restaurant_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.restaurantId]
    );

    res.status(200).json({
      campaign: rows.length > 0 ? toCampaignJson(rows[0]) : null,
    });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT ${CAMPAIGN_COLUMNS}
       FROM campaigns
       WHERE restaurant_id = $1
       ORDER BY created_at DESC`,
      [req.restaurantId]
    );

    res.status(200).json({
      campaigns: rows.map(toCampaignJson),
    });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { tableQuota, discountPercent } = validateCampaignBody(req.body);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows: restaurantRows } = await client.query(
        `SELECT id, latitude, longitude, manager_user_id, capacity
         FROM restaurants
         WHERE id = $1
         FOR UPDATE`,
        [req.restaurantId]
      );

      if (restaurantRows.length === 0) {
        throw new AppError(404, "NOT_FOUND", "Restaurant not found");
      }

      const restaurant = restaurantRows[0];

      if (tableQuota > restaurant.capacity) {
        throw new AppError(
          400,
          "VALIDATION_ERROR",
          `tableQuota cannot exceed restaurant capacity (${restaurant.capacity})`
        );
      }

      const { rows: campaignRows } = await client.query(
        `INSERT INTO campaigns (restaurant_id, table_quota, discount_percent)
         VALUES ($1, $2, $3)
         RETURNING ${CAMPAIGN_COLUMNS}`,
        [req.restaurantId, tableQuota, discountPercent]
      );

      const campaign = campaignRows[0];

      await createCampaignOffers(client, {
        campaignId: campaign.id,
        restaurant,
        tableQuota,
      });

      await client.query("COMMIT");
      res.status(201).json(toCampaignJson(campaign));
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

router.get(
  "/:campaignId/offers",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { campaignId } = req.params;

    if (!campaignId || !isUuid(campaignId)) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid campaignId format");
    }

    const offers = await getCampaignOffers(pool, {
      restaurantId: req.restaurantId,
      campaignId,
    });

    res.status(200).json({ offers });
  })
);

router.get(
  "/:campaignId/revpash-lift",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { campaignId } = req.params;

    if (!campaignId || !isUuid(campaignId)) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid campaignId format");
    }

    const lift = await getCampaignRevpashLift(pool, {
      restaurantId: req.restaurantId,
      campaignId,
    });

    res.status(200).json(toCampaignRevpashLiftJson(lift));
  })
);

router.post(
  "/:campaignId/cancel",
  asyncHandler(async (req, res) => {
    const pool = getPool();
    const { campaignId } = req.params;

    if (!campaignId || !isUuid(campaignId)) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid campaignId format");
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `SELECT ${CAMPAIGN_COLUMNS}
         FROM campaigns
         WHERE id = $1 AND restaurant_id = $2
         FOR UPDATE`,
        [campaignId, req.restaurantId]
      );

      if (rows.length === 0) {
        throw new AppError(404, "NOT_FOUND", "Campaign not found");
      }

      const campaign = rows[0];
      if (campaign.status !== "active") {
        throw new AppError(409, "CONFLICT", "Only active campaigns can be cancelled");
      }

      const { rows: updatedRows } = await client.query(
        `UPDATE campaigns
         SET status = 'cancelled',
             cancelled_at = NOW()
         WHERE id = $1
         RETURNING ${CAMPAIGN_COLUMNS}`,
        [campaignId]
      );

      await client.query(
        `UPDATE offers
         SET status = 'revoked'
         WHERE campaign_id = $1 AND status = 'pending'`,
        [campaignId]
      );

      await client.query("COMMIT");
      res.status(200).json(toCampaignJson(updatedRows[0]));
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
