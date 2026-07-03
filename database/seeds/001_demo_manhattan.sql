-- BE-9: Demo seed data — Manhattan restaurants + test users
-- Fixed UUIDs for reproducible local dev and API testing (X-User-Id header).
-- Demo map origin: 40.7589, -73.9851 (Times Square area) — see seeds/README.md

BEGIN;

-- ---------------------------------------------------------------------------
-- Demo users
-- ---------------------------------------------------------------------------
INSERT INTO users (id, display_name, budget_tier, dietary_tags, last_lat, last_lng)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Demo Diner',
    'TIER_2',
    ARRAY['vegan'],
    40.7589,
    -73.9851
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Demo Manager',
    NULL,
    '{}',
    NULL,
    NULL
  )
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  budget_tier = EXCLUDED.budget_tier,
  dietary_tags = EXCLUDED.dietary_tags,
  last_lat = EXCLUDED.last_lat,
  last_lng = EXCLUDED.last_lng;

-- ---------------------------------------------------------------------------
-- Demo restaurants (Manhattan — fictional names, realistic coordinates)
-- available_table_count = 0 rows are intentional (Story 2.1 filter test)
-- capacity = total table capacity; cuisine = primary cuisine slug
-- ---------------------------------------------------------------------------
INSERT INTO restaurants (
  id, name, latitude, longitude, address_line, neighborhood,
  hold_window_minutes, available_table_count, busyness_score,
  capacity, cuisine,
  is_wheelchair_accessible, sensory_friendly, manager_user_id
)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655441001',
    'The Maple Room',
    40.7614, -73.9857,
    '125 W 44th St', 'Midtown',
    15, 3, 0.350, 8, 'american',
    FALSE, FALSE,
    '550e8400-e29b-41d4-a716-446655440002'
  ),
  (
    '550e8400-e29b-41d4-a716-446655441002',
    'Harbor & Hearth',
    40.7550, -73.9860,
    '234 W 42nd St', 'Theater District',
    15, 2, 0.420, 6, 'american',
    FALSE, FALSE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441003',
    'East 44th Bistro',
    40.7580, -73.9750,
    '88 E 44th St', 'Midtown East',
    15, 4, 0.280, 10, 'french',
    TRUE, FALSE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441004',
    'Herald Square Grill',
    40.7520, -73.9930,
    '120 W 32nd St', 'Koreatown',
    15, 1, 0.510, 5, 'american',
    FALSE, FALSE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441005',
    'Columbus Table',
    40.7650, -73.9820,
    '10 Columbus Cir', 'Upper West Side',
    15, 2, 0.390, 6, 'italian',
    FALSE, TRUE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441006',
    'Empire Eats (Full)',
    40.7480, -73.9850,
    '350 5th Ave', 'Midtown South',
    15, 0, 0.880, 8, 'american',
    FALSE, FALSE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441007',
    'Lincoln Lane Café',
    40.7700, -73.9900,
    '62nd St & Broadway', 'Upper West Side',
    15, 2, 0.310, 6, 'cafe',
    TRUE, TRUE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441008',
    'Murray Hill Kitchen',
    40.7490, -73.9760,
    '200 E 42nd St', 'Murray Hill',
    15, 3, 0.450, 8, 'american',
    FALSE, FALSE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441009',
    'Grand Central Fare',
    40.7527, -73.9772,
    '89 E 42nd St', 'Midtown East',
    15, 2, 0.370, 6, 'american',
    TRUE, FALSE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441010',
    'Hell''s Kitchen Social',
    40.7620, -73.9910,
    '450 W 46th St', 'Hell''s Kitchen',
    15, 1, 0.550, 4, 'american',
    FALSE, TRUE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441011',
    'Bryant Park Table',
    40.7560, -73.9780,
    '40 W 40th St', 'Midtown',
    15, 3, 0.330, 8, 'american',
    FALSE, FALSE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441012',
    'Koreatown Noodle Bar',
    40.7510, -73.9870,
    '32 W 32nd St', 'Koreatown',
    15, 2, 0.480, 6, 'japanese',
    FALSE, FALSE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441013',
    'Restaurant Row House (Full)',
    40.7640, -73.9880,
    '355 W 46th St', 'Hell''s Kitchen',
    15, 0, 0.720, 6, 'italian',
    FALSE, FALSE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441014',
    'Midtown Mercantile',
    40.7600, -73.9800,
    '200 Park Ave', 'Midtown East',
    15, 4, 0.260, 10, 'american',
    TRUE, FALSE, NULL
  ),
  (
    '550e8400-e29b-41d4-a716-446655441015',
    'Tablé Demo Central',
    40.7570, -73.9820,
    '1 Demo Plaza', 'Midtown',
    15, 2, 0.400, 6, 'italian',
    FALSE, FALSE,
    '550e8400-e29b-41d4-a716-446655440002'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  address_line = EXCLUDED.address_line,
  neighborhood = EXCLUDED.neighborhood,
  hold_window_minutes = EXCLUDED.hold_window_minutes,
  available_table_count = EXCLUDED.available_table_count,
  busyness_score = EXCLUDED.busyness_score,
  capacity = EXCLUDED.capacity,
  cuisine = EXCLUDED.cuisine,
  is_wheelchair_accessible = EXCLUDED.is_wheelchair_accessible,
  sensory_friendly = EXCLUDED.sensory_friendly,
  manager_user_id = EXCLUDED.manager_user_id;

COMMIT;
