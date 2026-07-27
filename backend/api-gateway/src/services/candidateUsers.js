/** Default / bounds for the single manager-set flash-deal TTL (minutes). */
const DEFAULT_FLASH_DEAL_TTL_MINUTES = 15;
const MIN_FLASH_DEAL_TTL_MINUTES = 10;
const MAX_FLASH_DEAL_TTL_MINUTES = 60;

/** Shared TTL used when callers omit an explicit value (seconds). */
const FLASH_DEAL_TTL_SECONDS = DEFAULT_FLASH_DEAL_TTL_MINUTES * 60;
const CAMPAIGN_TTL_SECONDS = FLASH_DEAL_TTL_SECONDS;
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
         p.budget_tier,
         p.dietary_restrictions AS dietary_tags,
         p.preferred_cuisines,
         p.dining_styles,
         p.requires_wheelchair_access,
         p.requires_sensory_friendly,
         ${HAVERSINE_SQL} AS distance_meters
       FROM users u
       JOIN user_preferences p ON p.user_id = u.id
       WHERE u.last_lat IS NOT NULL
         AND u.last_lng IS NOT NULL
         AND u.id IS DISTINCT FROM $4
     )
     SELECT id, budget_tier, dietary_tags, preferred_cuisines, dining_styles,
            requires_wheelchair_access, requires_sensory_friendly, distance_meters
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
    preferredCuisines: row.preferred_cuisines ?? [],
    diningStyles: row.dining_styles ?? [],
    requiresWheelchairAccess: row.requires_wheelchair_access ?? false,
    requiresSensoryFriendly: row.requires_sensory_friendly ?? false,
    distanceMeters: Math.round(Number(row.distance_meters)),
  }));
}

/**
 * Venue-side attributes the matcher scores candidate preferences against.
 * Raw values only — tier/threshold decisions belong to the scoring heuristic.
 */
function toMlRestaurant(row) {
  return {
    id: row.id,
    cuisine: row.cuisine ?? null,
    neighborhood: row.neighborhood ?? null,
    avgCheckPerCover:
      row.avg_check_per_cover != null ? Number(row.avg_check_per_cover) : null,
    isWheelchairAccessible: row.is_wheelchair_accessible ?? false,
    sensoryFriendly: row.sensory_friendly ?? false,
  };
}

module.exports = {
  DEFAULT_FLASH_DEAL_TTL_MINUTES,
  MIN_FLASH_DEAL_TTL_MINUTES,
  MAX_FLASH_DEAL_TTL_MINUTES,
  FLASH_DEAL_TTL_SECONDS,
  CAMPAIGN_TTL_SECONDS,
  MATCH_RADIUS_M,
  findNearbyCandidates,
  toMlCandidates,
  toMlRestaurant,
};
