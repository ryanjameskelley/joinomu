-- Create admin user manually
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at) 
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@test.com', crypt('admin123', gen_salt('bf')), now(), now(), now()) 
ON CONFLICT (id) DO NOTHING;

-- Update profile with admin role
INSERT INTO profiles (id, email, first_name, last_name, role) 
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@test.com', 'Admin', 'User', 'admin') 
ON CONFLICT (id) DO UPDATE SET 
  email = 'admin@test.com',
  first_name = 'Admin', 
  last_name = 'User',
  role = 'admin';

-- Create admin record
INSERT INTO admins (profile_id, permissions) 
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', ARRAY['all']) 
ON CONFLICT (profile_id) DO NOTHING;

SELECT 'Admin user created successfully' as status;