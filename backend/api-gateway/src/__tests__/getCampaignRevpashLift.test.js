const { getCampaignRevpashLift } = require("../services/getCampaignRevpashLift");

describe("getCampaignRevpashLift", () => {
  it("compares organic and deal revpash for a campaign", async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            campaign_id: "campaign-1",
            campaign_hour: 15,
            capacity: 10,
            organic_revenue: "120.00",
            organic_day_count: 4,
            deal_revenue: "180.00",
            campaign_hours: 2,
          },
        ],
      }),
    };

    const lift = await getCampaignRevpashLift(pool, {
      restaurantId: "restaurant-1",
      campaignId: "campaign-1",
    });

    expect(lift).toEqual({
      campaignId: "campaign-1",
      organicRevpash: 3,
      dealRevpash: 9,
      liftPercent: 200,
      offPeak: true,
    });
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WITH campaign AS"),
      ["restaurant-1", "campaign-1"]
    );
  });

  it("throws 404 when the campaign does not belong to the restaurant", async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };

    await expect(
      getCampaignRevpashLift(pool, {
        restaurantId: "restaurant-1",
        campaignId: "campaign-1",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Campaign not found",
    });
  });
});
