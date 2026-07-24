/**
 * Lazily expire active campaigns past expires_at (no cron in MVP).
 * Mirrors offer expiry: mark campaign expired and revoke still-pending offers.
 * Returns the list of campaign ids that were expired in this call.
 */
async function expireOverdueCampaigns(executor, { restaurantId = null } = {}) {
  const params = [];
  let restaurantClause = "";

  if (restaurantId) {
    params.push(restaurantId);
    restaurantClause = `AND restaurant_id = $${params.length}`;
  }

  const { rows } = await executor.query(
    `UPDATE campaigns
     SET status = 'expired'
     WHERE status = 'active'
       AND expires_at <= NOW()
       ${restaurantClause}
     RETURNING id`,
    params
  );

  if (rows.length === 0) {
    return [];
  }

  const campaignIds = rows.map((row) => row.id);

  await executor.query(
    `UPDATE offers
     SET status = 'revoked'
     WHERE campaign_id = ANY($1::uuid[])
       AND status = 'pending'`,
    [campaignIds]
  );

  return campaignIds;
}

module.exports = { expireOverdueCampaigns };
