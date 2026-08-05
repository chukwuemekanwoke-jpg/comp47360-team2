async function releaseConfirmedBooking(client, booking) {
  await client.query(
    `UPDATE restaurants
     SET available_table_count = LEAST(available_table_count + 1, capacity)
     WHERE id = $1`,
    [booking.restaurant_id]
  );

  if (booking.offer_id) {
    await client.query(
      `UPDATE offers
       SET status = CASE
             WHEN expires_at > NOW() THEN 'pending'::offer_status
             ELSE 'expired'::offer_status
           END,
           accepted_at = NULL
       WHERE id = $1`,
      [booking.offer_id]
    );
  }

  if (booking.campaign_id) {
    const { rows: campaignRows } = await client.query(
      `UPDATE campaigns
       SET tables_claimed = GREATEST(tables_claimed - 1, 0)
       WHERE id = $1
       RETURNING table_quota, tables_claimed, status, expires_at`,
      [booking.campaign_id]
    );

    const campaign = campaignRows[0];
    if (
      campaign &&
      campaign.status === "completed" &&
      campaign.tables_claimed < campaign.table_quota &&
      new Date(campaign.expires_at) > new Date()
    ) {
      await client.query(
        `UPDATE campaigns
         SET status = 'active',
             completed_at = NULL
         WHERE id = $1`,
        [booking.campaign_id]
      );
    }
  }
}

async function claimConfirmedBooking(client, booking) {
  const { rows } = await client.query(
    `SELECT available_table_count
     FROM restaurants
     WHERE id = $1
     FOR UPDATE`,
    [booking.restaurant_id]
  );

  if (rows.length === 0 || rows[0].available_table_count <= 0) {
    const { AppError } = require("../errors");
    throw new AppError(409, "CONFLICT", "No tables available at this restaurant");
  }

  await client.query(
    `UPDATE restaurants
     SET available_table_count = available_table_count - 1
     WHERE id = $1`,
    [booking.restaurant_id]
  );
}

module.exports = {
  releaseConfirmedBooking,
  claimConfirmedBooking,
};
