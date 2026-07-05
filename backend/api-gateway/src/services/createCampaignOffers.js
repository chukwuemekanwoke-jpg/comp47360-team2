const { findNearbyCandidates, toMlCandidates } = require("./candidateUsers");
const { insertOffersForUsers } = require("./offerInsert");
const { callMlMatch } = require("./mlMatchClient");

async function createCampaignOffers(client, { campaignId, restaurant, tableQuota }) {
  const candidateLimit = Math.max(tableQuota, 1);
  const fetchLimit = Math.max(candidateLimit, 10);

  const candidateRows = await findNearbyCandidates(client, {
    restaurant,
    limit: fetchLimit,
  });

  if (candidateRows.length === 0) {
    return [];
  }

  const candidates = toMlCandidates(candidateRows);

  try {
    const match = await callMlMatch({
      campaignId,
      restaurantId: restaurant.id,
      candidateLimit,
      candidates,
    });

    if (match.matchedUserIds.length === 0) {
      return [];
    }

    return insertOffersForUsers(client, {
      campaignId,
      userIds: match.matchedUserIds,
    });
  } catch (err) {
    console.warn(`[BE-14] ML match unavailable, using distance fallback: ${err.message}`);

    const fallbackUserIds = candidateRows
      .slice(0, candidateLimit)
      .map((row) => row.id);

    return insertOffersForUsers(client, {
      campaignId,
      userIds: fallbackUserIds,
    });
  }
}

module.exports = { createCampaignOffers };
