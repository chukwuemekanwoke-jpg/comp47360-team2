const { FLASH_DEAL_TTL_SECONDS } = require("./candidateUsers");

async function insertOffersForUsers(client, { campaignId, userIds }) {
  const offerIds = [];

  for (const userId of userIds) {
    const { rows } = await client.query(
      `INSERT INTO offers (campaign_id, user_id, expires_at)
       VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 second'))
       ON CONFLICT (campaign_id, user_id) DO NOTHING
       RETURNING id`,
      [campaignId, userId, FLASH_DEAL_TTL_SECONDS]
    );

    if (rows.length > 0) {
      offerIds.push(rows[0].id);
    }
  }

  return offerIds;
}

module.exports = { insertOffersForUsers };
