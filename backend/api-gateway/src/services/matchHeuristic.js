const FLASH_DEAL_TTL_SECONDS = 900;
const MATCH_RADIUS_M = 1500;

const HAVERSINE_SQL = `
  (
    6371000 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians($1)) * cos(radians(u.last_lat))
          * cos(radians(u.last_lng) - radians($2))
        + sin(radians($1)) * sin(radians(u.last_lat))
      ))
    )
  )
`;

async function createHeuristicOffers(client, { campaignId, restaurant, tableQuota }) {
  const { rows: candidates } = await client.query(
    `WITH nearby_users AS (
       SELECT
         u.id,
         ${HAVERSINE_SQL} AS distance_meters
       FROM users u
       WHERE u.last_lat IS NOT NULL
         AND u.last_lng IS NOT NULL
         AND u.id IS DISTINCT FROM $4
     )
     SELECT id
     FROM nearby_users
     WHERE distance_meters <= $3
     ORDER BY distance_meters ASC
     LIMIT $5`,
    [
      restaurant.latitude,
      restaurant.longitude,
      MATCH_RADIUS_M,
      restaurant.manager_user_id,
      tableQuota,
    ]
  );

  const offerIds = [];

  for (const candidate of candidates) {
    const { rows } = await client.query(
      `INSERT INTO offers (campaign_id, user_id, expires_at)
       VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 second'))
       ON CONFLICT (campaign_id, user_id) DO NOTHING
       RETURNING id`,
      [campaignId, candidate.id, FLASH_DEAL_TTL_SECONDS]
    );

    if (rows.length > 0) {
      offerIds.push(rows[0].id);
    }
  }

  return offerIds;
}

module.exports = { createHeuristicOffers, FLASH_DEAL_TTL_SECONDS, MATCH_RADIUS_M };
