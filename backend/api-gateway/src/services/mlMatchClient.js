const config = require("../config");

async function callMlMatch({ campaignId, restaurantId, candidateLimit, candidates }) {
  const url = `${config.mlServiceUrl}/api/v1/match`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.mlMatchTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId,
        restaurantId,
        candidateLimit,
        candidates,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`ML match HTTP ${response.status}: ${detail}`);
    }

    const body = await response.json();

    if (!Array.isArray(body.matchedUserIds)) {
      throw new Error("ML match response missing matchedUserIds array");
    }

    return {
      matchedUserIds: body.matchedUserIds,
      scores: Array.isArray(body.scores) ? body.scores : [],
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { callMlMatch };
