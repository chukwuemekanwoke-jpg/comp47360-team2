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

async function findNearbyCandidates(client, { restaurant, limit }) {
  const { rows } = await client.query(
    `WITH nearby_users AS (
       SELECT
         u.id,
         u.budget_tier,
         u.dietary_tags,
         ${HAVERSINE_SQL} AS distance_meters
       FROM users u
       WHERE u.last_lat IS NOT NULL
         AND u.last_lng IS NOT NULL
         AND u.id IS DISTINCT FROM $4
     )
     SELECT id, budget_tier, dietary_tags, distance_meters
     FROM nearby_users
     WHERE distance_meters <= $3
     ORDER BY distance_meters ASC
     LIMIT $5`,
    [
      restaurant.latitude,
      restaurant.longitude,
      MATCH_RADIUS_M,
      restaurant.manager_user_id,
      limit,
    ]
  );

  return rows;
}

function toMlCandidates(rows) {
  return rows.map((row) => ({
    userId: row.id,
    budgetTier: row.budget_tier,
    dietaryTags: row.dietary_tags ?? [],
    distanceMeters: Math.round(Number(row.distance_meters)),
  }));
}

module.exports = {
  FLASH_DEAL_TTL_SECONDS,
  MATCH_RADIUS_M,
  findNearbyCandidates,
  toMlCandidates,
};
