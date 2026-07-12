-- Demo bookings for RevPASH view / merchant dashboard (migration 007)
-- Fixed UUIDs; seated_at uses local operating hours on the current NY calendar day.

BEGIN;

INSERT INTO bookings (
  id,
  user_id,
  restaurant_id,
  status,
  transport_mode,
  eta_minutes,
  hold_expires_at,
  confirmed_at,
  party_size,
  seated_at,
  check_amount,
  duration_minutes
)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655442001',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655441001',
    'completed',
    'walking',
    8,
    (date_trunc('day', timezone('America/New_York', NOW())) + TIME '14:30')
      AT TIME ZONE 'America/New_York' + INTERVAL '10 minutes',
    (date_trunc('day', timezone('America/New_York', NOW())) + TIME '14:00')
      AT TIME ZONE 'America/New_York',
    2,
    (date_trunc('day', timezone('America/New_York', NOW())) + TIME '14:00')
      AT TIME ZONE 'America/New_York',
    104.72,
    90
  ),
  (
    '550e8400-e29b-41d4-a716-446655442002',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655441001',
    'confirmed',
    'walking',
    6,
    (date_trunc('day', timezone('America/New_York', NOW())) + TIME '16:30')
      AT TIME ZONE 'America/New_York' + INTERVAL '12 minutes',
    (date_trunc('day', timezone('America/New_York', NOW())) + TIME '16:00')
      AT TIME ZONE 'America/New_York',
    4,
    (date_trunc('day', timezone('America/New_York', NOW())) + TIME '16:00')
      AT TIME ZONE 'America/New_York',
    209.44,
    90
  ),
  (
    '550e8400-e29b-41d4-a716-446655442003',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655441015',
    'completed',
    'walking',
    10,
    (date_trunc('day', timezone('America/New_York', NOW())) + TIME '18:30')
      AT TIME ZONE 'America/New_York' + INTERVAL '8 minutes',
    (date_trunc('day', timezone('America/New_York', NOW())) + TIME '18:00')
      AT TIME ZONE 'America/New_York',
    2,
    (date_trunc('day', timezone('America/New_York', NOW())) + TIME '18:00')
      AT TIME ZONE 'America/New_York',
    149.60,
    90
  )
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  restaurant_id = EXCLUDED.restaurant_id,
  status = EXCLUDED.status,
  transport_mode = EXCLUDED.transport_mode,
  eta_minutes = EXCLUDED.eta_minutes,
  hold_expires_at = EXCLUDED.hold_expires_at,
  confirmed_at = EXCLUDED.confirmed_at,
  party_size = EXCLUDED.party_size,
  seated_at = EXCLUDED.seated_at,
  check_amount = EXCLUDED.check_amount,
  duration_minutes = EXCLUDED.duration_minutes;

COMMIT;
