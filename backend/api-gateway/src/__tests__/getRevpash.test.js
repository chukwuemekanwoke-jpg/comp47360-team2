const { getRevpashSummary } = require("../services/getRevpash");

describe("getRevpashSummary", () => {
  it("aggregates revenue and seat-hours from the hourly view", async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [{ revenue: "314.16", available_seat_hours: "88.00" }],
      }),
    };

    const summary = await getRevpashSummary(pool, {
      restaurantId: "550e8400-e29b-41d4-a716-446655441001",
      window: "today",
    });

    expect(summary).toMatchObject({
      restaurantId: "550e8400-e29b-41d4-a716-446655441001",
      window: "today",
      revenue: 314.16,
      availableSeatHours: 88,
      revpash: 3.57,
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("restaurant_revpash_hourly"),
      ["550e8400-e29b-41d4-a716-446655441001", "today"]
    );
  });
});
