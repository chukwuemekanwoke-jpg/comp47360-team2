jest.mock("../services/mlMatchClient", () => ({
  callMlMatch: jest.fn(),
}));

const { callMlMatch } = require("../services/mlMatchClient");
const { createCampaignOffers } = require("../services/createCampaignOffers");

describe("createCampaignOffers", () => {
  const restaurant = {
    id: "550e8400-e29b-41d4-a716-446655441001",
    latitude: 40.7614,
    longitude: -73.9857,
    manager_user_id: "550e8400-e29b-41d4-a716-446655440002",
  };

  function mockClient({ candidates = [], insertIds = ["offer-1"] } = {}) {
    const query = jest.fn(async (sql, params) => {
      if (sql.includes("nearby_users")) {
        return { rows: candidates };
      }
      if (sql.includes("INSERT INTO offers")) {
        return { rows: [{ id: insertIds.shift() || "offer-x" }] };
      }
      return { rows: [] };
    });

    return { query };
  }

  beforeEach(() => {
    callMlMatch.mockReset();
  });

  it("uses ML matched user ids when the service responds", async () => {
    const client = mockClient({
      candidates: [
        {
          id: "user-a",
          budget_tier: "TIER_2",
          dietary_tags: ["vegan"],
          distance_meters: 300,
        },
        {
          id: "user-b",
          budget_tier: null,
          dietary_tags: [],
          distance_meters: 800,
        },
      ],
      insertIds: ["offer-1"],
    });

    callMlMatch.mockResolvedValue({
      matchedUserIds: ["user-a"],
      scores: [0.92],
    });

    const offerIds = await createCampaignOffers(client, {
      campaignId: "campaign-1",
      restaurant,
      tableQuota: 1,
    });

    expect(callMlMatch).toHaveBeenCalledTimes(1);
    expect(offerIds).toEqual(["offer-1"]);
  });

  it("falls back to nearest candidates when ML is unavailable", async () => {
    const client = mockClient({
      candidates: [
        {
          id: "user-a",
          budget_tier: "TIER_2",
          dietary_tags: [],
          distance_meters: 200,
        },
        {
          id: "user-b",
          budget_tier: null,
          dietary_tags: [],
          distance_meters: 500,
        },
      ],
      insertIds: ["offer-1"],
    });

    callMlMatch.mockRejectedValue(new Error("connection refused"));

    const offerIds = await createCampaignOffers(client, {
      campaignId: "campaign-1",
      restaurant,
      tableQuota: 1,
    });

    expect(offerIds).toEqual(["offer-1"]);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO offers"),
      ["campaign-1", "user-a", 900]
    );
  });
});
