async function expirePendingOffers(pool, userId) {
  await pool.query(
    `UPDATE offers
     SET status = 'expired'
     WHERE user_id = $1
       AND status = 'pending'
       AND expires_at <= NOW()`,
    [userId]
  );
}

module.exports = { expirePendingOffers };
