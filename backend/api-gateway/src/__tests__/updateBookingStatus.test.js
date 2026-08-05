const { updateBookingStatus } = require("../services/updateBookingStatus");

const MANAGER_ID = "22222222-2222-4222-8222-222222222222";
const USER_ID = "11111111-1111-4111-8111-111111111111";
const BOOKING_ID = "55555555-5555-4555-8555-555555555555";
const RESTAURANT_ID = "33333333-3333-4333-8333-333333333333";

function createClientWithRows(rowSets) {
  return {
    query: jest.fn().mockImplementation(() => {
      const rows = rowSets.shift() ?? [];
      return Promise.resolve({ rows });
    }),
  };
}

function booking(overrides = {}) {
  return {
    id: BOOKING_ID,
    user_id: USER_ID,
    restaurant_id: RESTAURANT_ID,
    offer_id: null,
    campaign_id: null,
    status: "confirmed",
    transport_mode: "walking",
    eta_minutes: 8,
    hold_expires_at: new Date("2026-06-30T12:15:00.000Z"),
    confirmed_at: new Date("2026-06-30T12:00:00.000Z"),
    manager_user_id: MANAGER_ID,
    ...overrides,
  };
}

describe("updateBookingStatus", () => {
  it("marks a confirmed booking as completed for the manager", async () => {
    const client = createClientWithRows([
      [booking()],
      [booking({ status: "completed" })],
    ]);

    const result = await updateBookingStatus(client, {
      managerUserId: MANAGER_ID,
      bookingId: BOOKING_ID,
      status: "completed",
    });

    expect(result.status).toBe("completed");
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("seated_at = COALESCE"),
      [BOOKING_ID, "completed"]
    );
  });

  it("releases inventory when a confirmed booking is marked no_show", async () => {
    const client = createClientWithRows([
      [booking()],
      [booking({ status: "no_show" })],
      [],
    ]);

    await updateBookingStatus(client, {
      managerUserId: MANAGER_ID,
      bookingId: BOOKING_ID,
      status: "no_show",
    });

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("available_table_count = LEAST"),
      [RESTAURANT_ID]
    );
  });

  it("rejects updates from a non-manager", async () => {
    const client = createClientWithRows([[booking({ manager_user_id: "99999999-9999-4999-8999-999999999999" })]]);

    await expect(
      updateBookingStatus(client, {
        managerUserId: MANAGER_ID,
        bookingId: BOOKING_ID,
        status: "completed",
      })
    ).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("rejects invalid status transitions", async () => {
    const client = createClientWithRows([[booking({ status: "completed" })]]);

    await expect(
      updateBookingStatus(client, {
        managerUserId: MANAGER_ID,
        bookingId: BOOKING_ID,
        status: "confirmed",
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
  });
});
