jest.mock("../services/bookingSideEffects", () => ({
  releaseConfirmedBooking: jest.fn().mockResolvedValue(undefined),
}));

const {
  lapseExpiredBookings,
  assertNoActiveBooking,
  pruneUserBookings,
  MAX_BOOKINGS_PER_USER,
} = require("../services/bookingLifecycle");
const { releaseConfirmedBooking } = require("../services/bookingSideEffects");
const { AppError } = require("../errors");

const USER_ID = "11111111-1111-4111-8111-111111111111";
const RESTAURANT_ID = "22222222-2222-4222-8222-222222222222";
const BOOKING_ID = "55555555-5555-4555-8555-555555555555";

function createClient(handlers) {
  return {
    query: jest.fn().mockImplementation((sql, params) => {
      const handler = handlers.shift();
      if (!handler) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      return Promise.resolve(handler(sql, params));
    }),
  };
}

describe("bookingLifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("lapseExpiredBookings", () => {
    it("cancels expired confirmed bookings and releases inventory", async () => {
      const expired = {
        id: BOOKING_ID,
        user_id: USER_ID,
        restaurant_id: RESTAURANT_ID,
        offer_id: null,
        campaign_id: null,
        status: "confirmed",
        transport_mode: "walking",
        eta_minutes: 8,
        hold_expires_at: new Date("2020-01-01T00:00:00.000Z"),
        confirmed_at: new Date("2020-01-01T00:00:00.000Z"),
      };

      const client = createClient([
        () => ({ rows: [expired] }),
        () => ({ rows: [] }),
      ]);

      const count = await lapseExpiredBookings(client, { userId: USER_ID });

      expect(count).toBe(1);
      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = 'cancelled'"),
        [BOOKING_ID]
      );
      expect(releaseConfirmedBooking).toHaveBeenCalledWith(client, expired);
    });

    it("cancels expired pending bookings without releasing inventory", async () => {
      const expired = {
        id: BOOKING_ID,
        user_id: USER_ID,
        restaurant_id: RESTAURANT_ID,
        offer_id: null,
        campaign_id: null,
        status: "pending",
        transport_mode: "walking",
        eta_minutes: 8,
        hold_expires_at: new Date("2020-01-01T00:00:00.000Z"),
        confirmed_at: null,
      };

      const client = createClient([
        () => ({ rows: [expired] }),
        () => ({ rows: [] }),
      ]);

      await lapseExpiredBookings(client, { userId: USER_ID });

      expect(releaseConfirmedBooking).not.toHaveBeenCalled();
    });
  });

  describe("assertNoActiveBooking", () => {
    it("throws CONFLICT when an active booking exists", async () => {
      const client = createClient([() => ({ rows: [{ id: BOOKING_ID }] })]);

      await expect(assertNoActiveBooking(client, USER_ID)).rejects.toMatchObject({
        statusCode: 409,
        code: "CONFLICT",
        message: "User already has an active booking",
        details: { bookingId: BOOKING_ID },
      });
      expect(AppError).toBeDefined();
    });

    it("resolves when the user has no active booking", async () => {
      const client = createClient([() => ({ rows: [] })]);
      await expect(assertNoActiveBooking(client, USER_ID)).resolves.toBeUndefined();
    });
  });

  describe("pruneUserBookings", () => {
    it(`deletes bookings beyond the newest ${MAX_BOOKINGS_PER_USER}`, async () => {
      const client = createClient([() => ({ rows: [], rowCount: 2 })]);

      const deleted = await pruneUserBookings(client, USER_ID);

      expect(deleted).toBe(2);
      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining("OFFSET $2"),
        [USER_ID, MAX_BOOKINGS_PER_USER]
      );
    });
  });
});
