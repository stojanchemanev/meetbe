-- ============================================================
-- SEED  (runs automatically after `supabase db reset`)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Fixed UUIDs ──────────────────────────────────────────────
-- Users
DO $$ BEGIN
  -- nothing here; we use literals below
END $$;

-- ── 1. AUTH USERS ────────────────────────────────────────────
INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_user_meta_data,
  is_super_admin, is_sso_user, deleted_at,
  confirmation_token, recovery_token,
  email_change_token_new, email_change,
  email_change_token_current, email_change_confirm_status,
  phone_change, phone_change_token,
  reauthentication_token, is_anonymous
) VALUES
  ('00000001-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'owner1@test.com', crypt('P@ssw0rd', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"name":"Salon Owner","role":"BUSINESS"}', false, false, NULL,
   '', '', '', '', '', 0, '', '', '', false),

  ('00000001-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'owner2@test.com', crypt('P@ssw0rd', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"name":"Gym Owner","role":"BUSINESS"}', false, false, NULL,
   '', '', '', '', '', 0, '', '', '', false),

  ('00000001-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'owner3@test.com', crypt('P@ssw0rd', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"name":"Yoga Owner","role":"BUSINESS"}', false, false, NULL,
   '', '', '', '', '', 0, '', '', '', false),

  ('00000002-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'client1@test.com', crypt('P@ssw0rd', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"name":"John Client","role":"CLIENT"}', false, false, NULL,
   '', '', '', '', '', 0, '', '', '', false),

  ('00000002-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'client2@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"name":"Jane Client","role":"CLIENT"}', false, false, NULL,
   '', '', '', '', '', 0, '', '', '', false),

  ('00000003-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'emp1@test.com', crypt('P@ssw0rd', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"name":"Sarah Johnson","role":"CLIENT"}', false, false, NULL,
   '', '', '', '', '', 0, '', '', '', false),

  ('00000003-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
   'emp2@test.com', crypt('P@ssw0rd', gen_salt('bf')), NOW(), NOW(), NOW(),
   '{"name":"Mike Chen","role":"CLIENT"}', false, false, NULL,
   '', '', '', '', '', 0, '', '', '', false);

-- ── 2. PUBLIC USERS ──────────────────────────────────────────
INSERT INTO users (id, email, name, role, phone, age, sex, address, city, avatar) VALUES
  ('00000001-0000-0000-0000-000000000001', 'owner1@test.com',  'Salon Owner',   'BUSINESS', NULL, NULL, NULL, NULL, NULL, NULL),
  ('00000001-0000-0000-0000-000000000002', 'owner2@test.com',  'Gym Owner',     'BUSINESS', NULL, NULL, NULL, NULL, NULL, NULL),
  ('00000001-0000-0000-0000-000000000003', 'owner3@test.com',  'Yoga Owner',    'BUSINESS', NULL, NULL, NULL, NULL, NULL, NULL),
  ('00000002-0000-0000-0000-000000000001', 'client1@test.com', 'John Client',   'CLIENT',   '+1 555 010 0001', 32, 'MALE',   '10 Oak Avenue',    'New York',   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'),
  ('00000002-0000-0000-0000-000000000002', 'client2@test.com', 'Jane Client',   'CLIENT',   '+1 555 020 0002', 27, 'FEMALE', '22 Maple Street',  'Los Angeles', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300'),
  ('00000003-0000-0000-0000-000000000001', 'emp1@test.com',    'Sarah Johnson', 'CLIENT',   NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300'),
  ('00000003-0000-0000-0000-000000000002', 'emp2@test.com',    'Mike Chen',     'CLIENT',   NULL, NULL, NULL, NULL, NULL, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300');

-- ── 3. BUSINESSES ────────────────────────────────────────────
INSERT INTO businesses (id, owner_id, name, description, category, address, logo, rating) VALUES
  ('00000010-0000-0000-0000-000000000001',
   '00000001-0000-0000-0000-000000000001',
   'Elite Hair Studio', 'Premium hair styling and coloring salon',
   'Beauty & Wellness', '123 Main Street, Downtown',
   'https://images.unsplash.com/photo-1596464716127-f2a82ad5d27f?w=300', 4.8),

  ('00000010-0000-0000-0000-000000000002',
   '00000001-0000-0000-0000-000000000002',
   'Fit Body Gym', 'State-of-the-art fitness center',
   'Fitness', '456 Fitness Ave, Midtown',
   'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300', 4.6),

  ('00000010-0000-0000-0000-000000000003',
   '00000001-0000-0000-0000-000000000003',
   'Zen Yoga Studio', 'Relaxing yoga and meditation classes',
   'Wellness', '789 Peace Road, Uptown',
   'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=300', 4.9);

-- ── 4. EMPLOYEES ─────────────────────────────────────────────
INSERT INTO employees (id, business_id, user_id, name, role, avatar) VALUES
  ('00000020-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000001',
   '00000003-0000-0000-0000-000000000001',
   'Sarah Johnson', 'Senior Stylist',
   'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300'),

  ('00000020-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000002',
   '00000003-0000-0000-0000-000000000002',
   'Mike Chen', 'Head Trainer',
   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'),

  ('00000020-0000-0000-0000-000000000003',
   '00000010-0000-0000-0000-000000000003',
   NULL,
   'Emma Wilson', 'Yoga Instructor',
   'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300');

-- ── 5. SERVICES ──────────────────────────────────────────────
INSERT INTO services (id, business_id, name, duration, price, description) VALUES
  ('00000030-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000001',
   'Hair Cut', 30, '$45', 'Professional haircut with styling'),

  ('00000030-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000001',
   'Hair Coloring', 90, '$120', 'Full hair coloring service'),

  ('00000030-0000-0000-0000-000000000003',
   '00000010-0000-0000-0000-000000000002',
   'Personal Training', 60, '$75', '1-on-1 personal training'),

  ('00000030-0000-0000-0000-000000000004',
   '00000010-0000-0000-0000-000000000002',
   'Group Fitness Class', 45, '$25', 'Group fitness class with trainer'),

  ('00000030-0000-0000-0000-000000000005',
   '00000010-0000-0000-0000-000000000003',
   'Hatha Yoga Class', 60, '$20', 'Traditional Hatha yoga practice'),

  ('00000030-0000-0000-0000-000000000006',
   '00000010-0000-0000-0000-000000000003',
   'Meditation Session', 45, '$15', 'Guided meditation session');

-- ── 6. TIMESLOTS ─────────────────────────────────────────────
-- start_time = CURRENT_DATE + N days offset + hour; end_time = start + duration
-- Sarah (salon) — 30-min slots
INSERT INTO timeslots (id, employee_id, business_id, start_time, end_time, is_booked, booked_by) VALUES
  ('00000040-0000-0000-0000-000000000001',
   '00000020-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000001',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL  '9 hours',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL  '9 hours 30 minutes',
   true, '00000002-0000-0000-0000-000000000001'),

  ('00000040-0000-0000-0000-000000000002',
   '00000020-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000001',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL '10 hours',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL '10 hours 30 minutes',
   false, NULL),

  ('00000040-0000-0000-0000-000000000003',
   '00000020-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000001',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL '11 hours',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL '11 hours 30 minutes',
   false, NULL),

  ('00000040-0000-0000-0000-000000000004',
   '00000020-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000001',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL  '9 hours',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL  '9 hours 30 minutes',
   true, '00000002-0000-0000-0000-000000000002'),

  ('00000040-0000-0000-0000-000000000005',
   '00000020-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000001',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL '10 hours',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL '10 hours 30 minutes',
   false, NULL),

  ('00000040-0000-0000-0000-000000000006',
   '00000020-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000001',
   (CURRENT_DATE + INTERVAL '3 days') + INTERVAL  '9 hours',
   (CURRENT_DATE + INTERVAL '3 days') + INTERVAL  '9 hours 30 minutes',
   false, NULL),

  ('00000040-0000-0000-0000-000000000007',
   '00000020-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000001',
   (CURRENT_DATE + INTERVAL '3 days') + INTERVAL '10 hours',
   (CURRENT_DATE + INTERVAL '3 days') + INTERVAL '10 hours 30 minutes',
   false, NULL),

-- Mike (gym) — 60-min slots
  ('00000040-0000-0000-0000-000000000008',
   '00000020-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000002',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL  '7 hours',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL  '8 hours',
   true, '00000002-0000-0000-0000-000000000001'),

  ('00000040-0000-0000-0000-000000000009',
   '00000020-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000002',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL  '8 hours',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL  '9 hours',
   false, NULL),

  ('00000040-0000-0000-0000-000000000010',
   '00000020-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000002',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL  '7 hours',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL  '8 hours',
   false, NULL),

  ('00000040-0000-0000-0000-000000000011',
   '00000020-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000002',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL  '8 hours',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL  '9 hours',
   true, '00000002-0000-0000-0000-000000000002'),

  ('00000040-0000-0000-0000-000000000012',
   '00000020-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000002',
   (CURRENT_DATE + INTERVAL '3 days') + INTERVAL  '7 hours',
   (CURRENT_DATE + INTERVAL '3 days') + INTERVAL  '8 hours',
   false, NULL),

  ('00000040-0000-0000-0000-000000000013',
   '00000020-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000002',
   (CURRENT_DATE + INTERVAL '3 days') + INTERVAL  '9 hours',
   (CURRENT_DATE + INTERVAL '3 days') + INTERVAL '10 hours',
   false, NULL),

-- Emma (yoga) — 60-min slots
  ('00000040-0000-0000-0000-000000000014',
   '00000020-0000-0000-0000-000000000003',
   '00000010-0000-0000-0000-000000000003',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL  '8 hours',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL  '9 hours',
   true, '00000002-0000-0000-0000-000000000002'),

  ('00000040-0000-0000-0000-000000000015',
   '00000020-0000-0000-0000-000000000003',
   '00000010-0000-0000-0000-000000000003',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL '10 hours',
   (CURRENT_DATE + INTERVAL '1 day')  + INTERVAL '11 hours',
   false, NULL),

  ('00000040-0000-0000-0000-000000000016',
   '00000020-0000-0000-0000-000000000003',
   '00000010-0000-0000-0000-000000000003',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL  '8 hours',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL  '9 hours',
   false, NULL),

  ('00000040-0000-0000-0000-000000000017',
   '00000020-0000-0000-0000-000000000003',
   '00000010-0000-0000-0000-000000000003',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL '10 hours',
   (CURRENT_DATE + INTERVAL '2 days') + INTERVAL '11 hours',
   true, '00000002-0000-0000-0000-000000000001'),

  ('00000040-0000-0000-0000-000000000018',
   '00000020-0000-0000-0000-000000000003',
   '00000010-0000-0000-0000-000000000003',
   (CURRENT_DATE + INTERVAL '3 days') + INTERVAL  '8 hours',
   (CURRENT_DATE + INTERVAL '3 days') + INTERVAL  '9 hours',
   false, NULL),

  ('00000040-0000-0000-0000-000000000019',
   '00000020-0000-0000-0000-000000000003',
   '00000010-0000-0000-0000-000000000003',
   (CURRENT_DATE + INTERVAL '4 days') + INTERVAL  '9 hours',
   (CURRENT_DATE + INTERVAL '4 days') + INTERVAL '10 hours',
   false, NULL);

-- ── 7. APPOINTMENTS (booked slots only) ──────────────────────
INSERT INTO appointments (slot_id, client_id, business_id, employee_id, service_id, status) VALUES
  -- Slot 1: client1 @ salon/sarah → Hair Cut → PENDING
  ('00000040-0000-0000-0000-000000000001',
   '00000002-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000001',
   '00000020-0000-0000-0000-000000000001',
   '00000030-0000-0000-0000-000000000001',
   'PENDING'),

  -- Slot 4: client2 @ salon/sarah → Hair Coloring → CONFIRMED
  ('00000040-0000-0000-0000-000000000004',
   '00000002-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000001',
   '00000020-0000-0000-0000-000000000001',
   '00000030-0000-0000-0000-000000000002',
   'CONFIRMED'),

  -- Slot 8: client1 @ gym/mike → Personal Training → CONFIRMED
  ('00000040-0000-0000-0000-000000000008',
   '00000002-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000002',
   '00000020-0000-0000-0000-000000000002',
   '00000030-0000-0000-0000-000000000003',
   'CONFIRMED'),

  -- Slot 11: client2 @ gym/mike → Group Fitness → PENDING
  ('00000040-0000-0000-0000-000000000011',
   '00000002-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000002',
   '00000020-0000-0000-0000-000000000002',
   '00000030-0000-0000-0000-000000000004',
   'PENDING'),

  -- Slot 14: client2 @ yoga/emma → Hatha Yoga → CONFIRMED
  ('00000040-0000-0000-0000-000000000014',
   '00000002-0000-0000-0000-000000000002',
   '00000010-0000-0000-0000-000000000003',
   '00000020-0000-0000-0000-000000000003',
   '00000030-0000-0000-0000-000000000005',
   'CONFIRMED'),

  -- Slot 17: client1 @ yoga/emma → Meditation → CANCELLED
  ('00000040-0000-0000-0000-000000000017',
   '00000002-0000-0000-0000-000000000001',
   '00000010-0000-0000-0000-000000000003',
   '00000020-0000-0000-0000-000000000003',
   '00000030-0000-0000-0000-000000000006',
   'CANCELLED');

-- ── 8. FAVORITES ─────────────────────────────────────────────
INSERT INTO favorites (client_id, business_id) VALUES
  ('00000002-0000-0000-0000-000000000001', '00000010-0000-0000-0000-000000000001'),
  ('00000002-0000-0000-0000-000000000001', '00000010-0000-0000-0000-000000000002'),
  ('00000002-0000-0000-0000-000000000002', '00000010-0000-0000-0000-000000000003');
