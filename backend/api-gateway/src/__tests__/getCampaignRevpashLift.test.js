const { getCampaignRevpashLift } = require("../services/getCampaignRevpashLift");

function poolWithResponses(responses) {
  const query = jest.fn();
  responses.forEach((rows) => query.mockResolvedValueOnce({ rows }));
  return { query };
}

const CAMPAIGN_ROW = [
  {
    id: "c1",
    created_at: new Date("2026-07-15T20:00:00.000Z"),
    completed_at: new Date("2026-07-15T21:00:00.000Z"),
    cancelled_at: null,
  },
];

describe("getCampaignRevpashLift", () => {
  it("computes deal vs organic revpash and lift percent", async () => {
    const pool = poolWithResponses([
      CAMPAIGN_ROW,
      [{ deal_hour: 16, revenue: "100.00" }],
      [{ seat_hours: "8.00" }],
      [{ revenue: "40.00" }],
      [{ seat_hours: "16.00", median_revpash: "5.00" }],
    ]);

    const result = await getCampaignRevpashLift(pool, {
      restaurantId: "r1",
      campaignId: "c1",
    });

    expect(result).toEqual({
      campaignId: "c1",
      organicRevpash: 2.5,
      dealRevpash: 12.5,
      liftPercent: 400,
      offPeak: true,
    });
    expect(pool.query).toHaveBeenCalledTimes(5);
  });

  it("throws NOT_FOUND when the campaign doesn't belong to the restaurant", async () => {
    const pool = poolWithResponses([[]]);

    await expect(
      getCampaignRevpashLift(pool, { restaurantId: "r1", campaignId: "missing" })
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  it("reports zero lift instead of dividing by zero when there's no organic baseline", async () => {
    const pool = poolWithResponses([
      CAMPAIGN_ROW,
      [{ deal_hour: 16, revenue: "100.00" }],
      [{ seat_hours: "8.00" }],
      [{ revenue: "0.00" }],
      [{ seat_hours: "0.00", median_revpash: null }],
    ]);

    const result = await getCampaignRevpashLift(pool, {
      restaurantId: "r1",
      campaignId: "c1",
    });

    expect(result).toEqual({
      campaignId: "c1",
      organicRevpash: 0,
      dealRevpash: 12.5,
      liftPercent: 0,
      offPeak: false,
    });
  });
});
