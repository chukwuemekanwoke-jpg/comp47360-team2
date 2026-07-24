const { expireOverdueCampaigns } = require("../services/expireCampaigns");

describe("expireOverdueCampaigns", () => {
  it("marks overdue active campaigns expired and revokes pending offers", async () => {
    const executor = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ id: "camp-1" }, { id: "camp-2" }],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const ids = await expireOverdueCampaigns(executor, { restaurantId: "rest-1" });

    expect(ids).toEqual(["camp-1", "camp-2"]);
    expect(executor.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("status = 'expired'"),
      ["rest-1"]
    );
    expect(executor.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("status = 'revoked'"),
      [["camp-1", "camp-2"]]
    );
  });

  it("skips offer revocation when nothing expired", async () => {
    const executor = {
      query: jest.fn().mockResolvedValueOnce({ rows: [] }),
    };

    const ids = await expireOverdueCampaigns(executor);

    expect(ids).toEqual([]);
    expect(executor.query).toHaveBeenCalledTimes(1);
    expect(executor.query).toHaveBeenCalledWith(
      expect.stringContaining("status = 'expired'"),
      []
    );
  });
});
