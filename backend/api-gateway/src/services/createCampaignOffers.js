const {
  findNearbyCandidates,
  filterEligibleCandidates,
  toMlCandidates,
  toMlRestaurant,
  FLASH_DEAL_TTL_SECONDS,
} = require("./candidateUsers");
const { insertOffersForUsers } = require("./offerInsert");
const { callMlMatch } = require("./mlMatchClient");

async function createCampaignOffers(client, {
  campaignId,
  restaurant,
  tableQuota,
  ttlSeconds = FLASH_DEAL_TTL_SECONDS,
}) {
  const candidateLimit = Math.max(tableQuota, 1);
  const fetchLimit = Math.max(candidateLimit, 10);

  const candidateRows = await findNearbyCandidates(client, {
    restaurant,
    limit: fetchLimit,
  });

  const eligibleCandidateRows = filterEligibleCandidates(candidateRows, restaurant);

  if (eligibleCandidateRows.length === 0) {
    return [];
  }

  const candidates = toMlCandidates(eligibleCandidateRows);

  try {
    const match = await callMlMatch({
      campaignId,
      restaurantId: restaurant.id,
      restaurant: toMlRestaurant(restaurant),
      candidateLimit,
      candidates,
    });

    const eligibleUserIds = new Set(eligibleCandidateRows.map((row) => row.id));
    const matchedUserIds = [...new Set(match.matchedUserIds)]
      .filter((userId) => eligibleUserIds.has(userId))
      .slice(0, candidateLimit);

    if (matchedUserIds.length === 0) {
      return [];
    }

    return insertOffersForUsers(client, {
      campaignId,
      userIds: matchedUserIds,
      ttlSeconds,
    });
  } catch (err) {
    console.warn(`[BE-14] ML match unavailable, using distance fallback: ${err.message}`);

    const fallbackUserIds = eligibleCandidateRows
      .slice(0, candidateLimit)
      .map((row) => row.id);

    return insertOffersForUsers(client, {
      campaignId,
      userIds: fallbackUserIds,
      ttlSeconds,
    });
  }
}

module.exports = { createCampaignOffers };
