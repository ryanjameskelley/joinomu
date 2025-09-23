-- Create auth user entries for testing
-- This directly inserts into auth.users table to bypass auth API issues

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin", "first_name": "Admin", "last_name": "User"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@test.com',
  encrypted_password = crypt('admin123', gen_salt('bf')),
  email_confirmed_at = now(),
  raw_user_meta_data = '{"role": "admin", "first_name": "Admin", "last_name": "User"}',
  updated_at = now();

-- Also create a patient test user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'sarah.j@test.com',
  crypt('patient123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "patient", "first_name": "Sarah", "last_name": "Johnson"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  email = 'sarah.j@test.com',
  encrypted_password = crypt('patient123', gen_salt('bf')),
  email_confirmed_at = now(),
  raw_user_meta_data = '{"role": "patient", "first_name": "Sarah", "last_name": "Johnson"}',
  updated_at = now();