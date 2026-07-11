const config = require("../config");

async function callMlBusyness({ restaurantId, hourOfDay, dayOfWeek, latitude, longitude }) {
  const url = `${config.mlServiceUrl}/predict/busyness?restaurant_id=${encodeURIComponent(restaurantId)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.mlBusynessTimeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hour_of_day: hourOfDay,
        day_of_week: dayOfWeek,
        latitude,
        longitude,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`ML busyness HTTP ${response.status}: ${detail}`);
    }

    const body = await response.json();

    if (typeof body.busyness_score !== "number") {
      throw new Error("ML busyness response missing busyness_score");
    }

    return {
      busynessScore: body.busyness_score,
      availableTableCount: body.available_table_count,
      confidence: body.confidence,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { callMlBusyness };
