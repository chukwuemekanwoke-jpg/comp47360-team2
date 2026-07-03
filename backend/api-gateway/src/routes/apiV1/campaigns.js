const { Router } = require("express");
const asyncHandler = require("../../middleware/asyncHandler");
const requireUser = require("../../middleware/requireUser");
const requireRestaurantManager = require("../../middleware/requireRestaurantManager");
const { AppError } = require("../../errors");
const { getPool } = require("../../db/pool");
const { toCampaignJson } = require("../../utils/serialize");
const { validateCampaignBody } = require("../../utils/validate");
const { createCampaignOffers } = require("../../services/createCampaignOffers");

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
        `SELECT id, latitude, longitude, manager_user_id
         FROM restaurants
         WHERE id = $1
         FOR UPDATE`,
        [req.restaurantId]
      );

      if (restaurantRows.length === 0) {
        throw new AppError(404, "NOT_FOUND", "Restaurant not found");
      }

      const restaurant = restaurantRows[0];

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

module.exports = router;
