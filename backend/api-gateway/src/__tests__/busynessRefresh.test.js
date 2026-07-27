jest.mock("../services/mlBusynessClient", () => ({
  callMlBusyness: jest.fn(),
}));

const { callMlBusyness } = require("../services/mlBusynessClient");
const {
  refreshStaleBusyness,
  selectStaleRestaurants,
  resetBusynessRefreshState,
  FAILURE_COOLDOWN_MS,
} = require("../services/busynessService");

const TTL_MS = 60 * 60 * 1000;
const NOW = new Date("2026-07-27T12:00:00.000Z").getTime();

function restaurantRow(id, minutesSinceRefresh) {
  return {
    id,
    latitude: 40.73,
    longitude: -73.99,
    available_table_count: 4,
    busyness_updated_at:
      minutesSinceRefresh === null
        ? null
        : new Date(NOW - minutesSinceRefresh * 60 * 1000).toISOString(),
  };
}

function mockPool() {
  return { query: jest.fn().mockResolvedValue({ rows: [] }) };
}

describe("background busyness refresh", () => {
  beforeEach(() => {
    resetBusynessRefreshState();
    callMlBusyness.mockReset();
    callMlBusyness.mockResolvedValue({
      busynessScore: 0.61,
      availableTableCount: 3,
      confidence: 0.9,
    });
  });

  describe("staleness selection", () => {
    const options = { now: NOW, ttlMs: TTL_MS, limit: 10 };

    it("treats a never-scored venue as stale", () => {
      const due = selectStaleRestaurants([restaurantRow("never", null)], options);
      expect(due.map((r) => r.id)).toEqual(["never"]);
    });

    it("skips venues refreshed inside the TTL", () => {
      const due = selectStaleRestaurants([restaurantRow("fresh", 59)], options);
      expect(due).toEqual([]);
    });

    it("refreshes venues at or past the TTL boundary", () => {
      const due = selectStaleRestaurants([restaurantRow("stale", 60)], options);
      expect(due.map((r) => r.id)).toEqual(["stale"]);
    });

    it("orders never-scored first, then stalest, and applies the cap", () => {
      const due = selectStaleRestaurants(
        [
          restaurantRow("older", 180),
          restaurantRow("never", null),
          restaurantRow("oldest", 600),
          restaurantRow("fresh", 5),
        ],
        { ...options, limit: 2 }
      );
      expect(due.map((r) => r.id)).toEqual(["never", "oldest"]);
    });
  });

  it("caps how many ml-service calls a single request triggers", async () => {
    const pool = mockPool();
    const rows = Array.from({ length: 25 }, (_, i) => restaurantRow(`r${i}`, null));

    const refreshed = await refreshStaleBusyness(pool, rows, {
      now: NOW,
      ttlMs: TTL_MS,
      limit: 5,
    });

    expect(refreshed).toHaveLength(5);
    expect(callMlBusyness).toHaveBeenCalledTimes(5);
  });

  it("persists the refreshed score and stamps busyness_updated_at", async () => {
    const pool = mockPool();

    await refreshStaleBusyness(pool, [restaurantRow("r1", null)], {
      now: NOW,
      ttlMs: TTL_MS,
    });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("busyness_updated_at = NOW()"),
      [0.61, "r1"]
    );
  });

  it("does not refresh a venue that is already being refreshed", async () => {
    const pool = mockPool();
    const rows = [restaurantRow("r1", null)];

    // Both batches are started before either awaits, mimicking two concurrent
    // /nearby requests hitting the same stale venue.
    const [first, second] = await Promise.all([
      refreshStaleBusyness(pool, rows, { now: NOW, ttlMs: TTL_MS }),
      refreshStaleBusyness(pool, rows, { now: NOW, ttlMs: TTL_MS }),
    ]);

    expect([...first, ...second]).toEqual(["r1"]);
    expect(callMlBusyness).toHaveBeenCalledTimes(1);
  });

  it("backs off a venue whose refresh failed, then retries after the cooldown", async () => {
    const pool = mockPool();
    const rows = [restaurantRow("r1", null)];
    callMlBusyness.mockRejectedValueOnce(new Error("connection refused"));

    const failed = await refreshStaleBusyness(pool, rows, { now: NOW, ttlMs: TTL_MS });
    expect(failed).toEqual([]);

    // Still inside the cooldown — no second call.
    await refreshStaleBusyness(pool, rows, { now: NOW, ttlMs: TTL_MS });
    expect(callMlBusyness).toHaveBeenCalledTimes(1);

    // Past it, the venue becomes eligible again.
    const retried = await refreshStaleBusyness(pool, rows, {
      now: NOW + FAILURE_COOLDOWN_MS + 1,
      ttlMs: TTL_MS,
    });
    expect(retried).toEqual(["r1"]);
    expect(callMlBusyness).toHaveBeenCalledTimes(2);
  });

  it("resolves without throwing when the ml-service is down", async () => {
    const pool = mockPool();
    callMlBusyness.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(
      refreshStaleBusyness(pool, [restaurantRow("r1", null)], { now: NOW, ttlMs: TTL_MS })
    ).resolves.toEqual([]);
  });
});
