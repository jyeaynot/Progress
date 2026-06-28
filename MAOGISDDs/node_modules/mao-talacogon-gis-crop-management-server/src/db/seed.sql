-- Seed data for local testing
-- Load after schema.sql:
--   psql "$DATABASE_URL" -f server/src/db/schema.sql
--   psql "$DATABASE_URL" -f server/src/db/seed.sql

BEGIN;

TRUNCATE TABLE input_allocations RESTART IDENTITY CASCADE;
TRUNCATE TABLE farmers RESTART IDENTITY CASCADE;

INSERT INTO farmers (
  id,
  rsbsa_id,
  first_name,
  middle_name,
  last_name,
  barangay,
  contact_number,
  civil_status,
  ethnicity,
  birth_date,
  crop_type,
  season,
  gis_location
)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'RSBSA-2026-0001',
    'Juan',
    'Dela',
    'Cruz',
    'Poblacion',
    '09171234567',
    'Married',
    'Manobo',
    '1985-04-12',
    'Rice',
    'Wet Season 2026',
    ST_SetSRID(ST_MakePoint(125.3962, 8.1297), 4326)
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'RSBSA-2026-0002',
    'Maria',
    NULL,
    'Santos',
    'Sto. Nino',
    '09181234567',
    'Single',
    'Higaonon',
    '1992-09-21',
    'Corn',
    'Dry Season 2026',
    ST_SetSRID(ST_MakePoint(125.4088, 8.1451), 4326)
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'RSBSA-2026-0003',
    'Pedro',
    'Garcia',
    'Reyes',
    'Buhisan',
    '09991234567',
    'Married',
    'Manobo',
    '1978-01-05',
    'Coconut',
    'Year Round 2026',
    ST_SetSRID(ST_MakePoint(125.3821, 8.1104), 4326)
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'RSBSA-2026-0004',
    'Luz',
    'M.',
    'Velasco',
    'Poblacion',
    '09351234567',
    'Widowed',
    'Cebuano',
    '1968-11-02',
    'Vegetables',
    'Wet Season 2026',
    ST_SetSRID(ST_MakePoint(125.4012, 8.1339), 4326)
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'RSBSA-2026-0005',
    'Ramon',
    NULL,
    'Alvarez',
    'San Isidro',
    '09271234567',
    'Married',
    'Manobo',
    '1989-06-17',
    'Rice',
    'Wet Season 2026',
    ST_SetSRID(ST_MakePoint(125.4174, 8.1218), 4326)
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'RSBSA-2026-0006',
    'Ana',
    'R.',
    'Mendoza',
    'Poblacion',
    '09163456789',
    'Married',
    'Manobo',
    '1987-03-28',
    'Rice',
    'Wet Season 2026',
    ST_SetSRID(ST_MakePoint(125.3948, 8.1274), 4326)
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'RSBSA-2026-0007',
    'Jose',
    NULL,
    'Villanueva',
    'San Jose',
    '09174561234',
    'Single',
    'Cebuano',
    '1995-12-09',
    'Corn',
    'Dry Season 2026',
    ST_SetSRID(ST_MakePoint(125.4211, 8.1182), 4326)
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    'RSBSA-2026-0008',
    'Teresa',
    'L.',
    'Dizon',
    'Sto. Nino',
    '09155678901',
    'Widowed',
    'Manobo',
    '1969-07-14',
    'Vegetables',
    'Wet Season 2026',
    ST_SetSRID(ST_MakePoint(125.4099, 8.1417), 4326)
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    'RSBSA-2026-0009',
    'Ricardo',
    'P.',
    'Lopez',
    'Buhisan',
    '09189990001',
    'Married',
    'Higaonon',
    '1980-10-30',
    'Coconut',
    'Year Round 2026',
    ST_SetSRID(ST_MakePoint(125.3784, 8.1088), 4326)
  ),
  (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'RSBSA-2026-0010',
    'Delia',
    NULL,
    'Fortuna',
    'San Vicente',
    '09192223344',
    'Separated',
    'Manobo',
    '1990-05-03',
    'Rice',
    'Wet Season 2026',
    ST_SetSRID(ST_MakePoint(125.4305, 8.1246), 4326)
  );

INSERT INTO input_allocations (
  id,
  farmer_id,
  fertilizer,
  seeds,
  farm_tools,
  pesticides,
  irrigation_subsidy,
  allocated_at,
  notes
)
VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    '2 sacks',
    '10 kg certified seeds',
    '1 hand sprayer',
    '2 bottles',
    'PHP 1,500',
    '2026-05-08T09:00:00Z',
    'Initial distribution'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    '1 sack',
    '5 kg certified seeds',
    '1 hoe',
    '1 bottle',
    'PHP 750',
    '2026-05-15T09:00:00Z',
    'Follow-up support'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '22222222-2222-2222-2222-222222222222',
    '3 sacks',
    '15 kg hybrid seeds',
    '1 shovel',
    '3 bottles',
    'PHP 2,000',
    '2026-05-10T10:00:00Z',
    'Barangay-level release'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    '1 sack',
    '8 kg vegetable seeds',
    '1 watering can',
    '1 bottle',
    'PHP 1,000',
    '2026-05-11T13:30:00Z',
    'High-value crop assistance'
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '66666666-6666-6666-6666-666666666666',
    '2 sacks',
    '10 kg certified seeds',
    '1 hand cultivator',
    '2 bottles',
    'PHP 1,200',
    '2026-05-12T08:15:00Z',
    'Replacement allocation'
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '77777777-7777-7777-7777-777777777777',
    '3 sacks',
    '12 kg hybrid seeds',
    '1 bolo',
    '2 bottles',
    'PHP 1,800',
    '2026-05-13T10:20:00Z',
    'Youth farmer support'
  ),
  (
    '12121212-3434-5656-7878-909090909090',
    '88888888-8888-8888-8888-888888888888',
    '1 sack',
    '6 kg vegetable seeds',
    '1 knapsack sprayer',
    '1 bottle',
    'PHP 900',
    '2026-05-14T11:45:00Z',
    'Vegetable production support'
  ),
  (
    '13131313-4545-6767-8989-010101010101',
    '99999999-9999-9999-9999-999999999999',
    '4 sacks',
    '20 kg coconut seedlings',
    '1 chainsaw voucher',
    '3 bottles',
    'PHP 2,500',
    '2026-05-16T14:30:00Z',
    'Perennial crop package'
  ),
  (
    '14141414-5656-7878-9090-121212121212',
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    '2 sacks',
    '8 kg certified seeds',
    '1 hoe',
    '1 bottle',
    'PHP 1,000',
    '2026-05-17T09:25:00Z',
    'New entrant farmer'
  );

COMMIT;

