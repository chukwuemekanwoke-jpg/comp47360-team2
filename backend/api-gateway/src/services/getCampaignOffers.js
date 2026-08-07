const { AppError } = require("../errors");
const { toManagerOfferItem } = require("../utils/serialize");

async function getCampaignOffers(pool, { restaurantId, campaignId }) {
  const { rows: campaignRows } = await pool.query(
    `SELECT id
     FROM campaigns
     WHERE id = $1 AND restaurant_id = $2`,
    [campaignId, restaurantId]
  );

  if (campaignRows.length === 0) {
    throw new AppError(404, "NOT_FOUND", "Campaign not found");
  }

  await pool.query(
    `UPDATE offers
     SET status = 'expired'
     WHERE campaign_id = $1
       AND status = 'pending'
       AND expires_at <= NOW()`,
    [campaignId]
  );

  // Diner identity is deliberately not selected here: managers see offer
  // status only, so accepting a flash deal stays anonymous.
  const { rows } = await pool.query(
    `SELECT
       o.id,
       o.campaign_id,
       o.status,
       o.expires_at,
       o.accepted_at
     FROM offers o
     WHERE o.campaign_id = $1
     ORDER BY o.created_at DESC`,
    [campaignId]
  );

  const now = new Date();
  return rows.map((row) => toManagerOfferItem(row, now));
}

module.exports = { getCampaignOffers };
