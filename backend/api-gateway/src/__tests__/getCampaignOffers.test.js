const { getCampaignOffers } = require("../services/getCampaignOffers");

describe("getCampaignOffers", () => {
  it("returns manager offer items and expires stale pending rows first", async () => {
    const expiresAt = new Date("2026-06-30T12:10:00.000Z");
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: "campaign-1" }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "offer-1",
              campaign_id: "campaign-1",
              status: "pending",
              expires_at: expiresAt,
              accepted_at: null,
            },
          ],
        }),
    };

    const offers = await getCampaignOffers(pool, {
      restaurantId: "restaurant-1",
      campaignId: "campaign-1",
    });

    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      id: "offer-1",
      campaignId: "campaign-1",
      status: "pending",
      acceptedAt: null,
    });
    expect(offers[0]).not.toHaveProperty("userDisplayName");
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("SET status = 'expired'"),
      ["campaign-1"]
    );
  });

  it("throws 404 when the campaign does not belong to the restaurant", async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({ rows: [] }),
    };

    await expect(
      getCampaignOffers(pool, {
        restaurantId: "restaurant-1",
        campaignId: "campaign-1",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Campaign not found",
    });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});
