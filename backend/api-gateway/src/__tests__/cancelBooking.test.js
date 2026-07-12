const { cancelBooking } = require("../services/cancelBooking");

const USER_ID = "11111111-1111-4111-8111-111111111111";
const RESTAURANT_ID = "22222222-2222-4222-8222-222222222222";
const BOOKING_ID = "55555555-5555-4555-8555-555555555555";
const OFFER_ID = "33333333-3333-4333-8333-333333333333";
const CAMPAIGN_ID = "44444444-4444-4444-8444-444444444444";

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
    ...overrides,
  };
}

describe("cancelBooking", () => {
  it("cancels a confirmed booking and restores restaurant inventory", async () => {
    const client = createClientWithRows([
      [booking()],
      [booking({ status: "cancelled", cancelled_at: new Date("2026-06-30T12:05:00.000Z") })],
    ]);

    const result = await cancelBooking(client, {
      userId: USER_ID,
      bookingId: BOOKING_ID,
    });

    expect(result.status).toBe("cancelled");
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("available_table_count = LEAST"),
      [RESTAURANT_ID]
    );
  });

  it("restores offer and campaign state for deal-backed bookings", async () => {
    const client = createClientWithRows([
      [booking({ offer_id: OFFER_ID, campaign_id: CAMPAIGN_ID })],
      [booking({ status: "cancelled", cancelled_at: new Date("2026-06-30T12:05:00.000Z") })],
      [],
      [{ table_quota: 2, tables_claimed: 1, status: "active" }],
    ]);

    await cancelBooking(client, {
      userId: USER_ID,
      bookingId: BOOKING_ID,
    });

    expect(client.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE offers"), [
      OFFER_ID,
    ]);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("tables_claimed = GREATEST"),
      [CAMPAIGN_ID]
    );
  });

  it("returns 404 when the booking does not belong to the user", async () => {
    const client = createClientWithRows([[]]);

    await expect(
      cancelBooking(client, {
        userId: USER_ID,
        bookingId: BOOKING_ID,
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
    });
  });

  it("returns 409 when the booking is already cancelled", async () => {
    const client = createClientWithRows([[booking({ status: "cancelled" })]]);

    await expect(
      cancelBooking(client, {
        userId: USER_ID,
        bookingId: BOOKING_ID,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
      message: "Booking is already cancelled",
    });
  });

  it("returns 409 when the booking is completed", async () => {
    const client = createClientWithRows([[booking({ status: "completed" })]]);

    await expect(
      cancelBooking(client, {
        userId: USER_ID,
        bookingId: BOOKING_ID,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
      message: "Booking cannot be cancelled",
    });
  });
});
