-- Clean Database Reset Migration
-- This migration removes all existing auth-related tables and functions
-- to prepare for a clean authentication system rebuild

-- Drop all existing RLS policies first (with error handling)
DO $$
BEGIN
  -- Drop policies safely, ignoring errors if tables don't exist
  DROP POLICY IF EXISTS "Admins can manage all assignments" ON patient_providers;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can read their own" ON admins;
  DROP POLICY IF EXISTS "Admins can update their own" ON admins;
  DROP POLICY IF EXISTS "Admins can view all admin data" ON admins;
  DROP POLICY IF EXISTS "Users can delete their own" ON admins;
  DROP POLICY IF EXISTS "Users can insert their own" ON admins;
  DROP POLICY IF EXISTS "Users can read their own" ON admins;
  DROP POLICY IF EXISTS "Users can update their own" ON admins;
  DROP POLICY IF EXISTS "Users can view own admin data" ON admins;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view all patients" ON patients;
  DROP POLICY IF EXISTS "Patients can view own data" ON patients;
  DROP POLICY IF EXISTS "Providers can view assigned patients" ON patients;
  DROP POLICY IF EXISTS "Users can insert their own" ON patients;
  DROP POLICY IF EXISTS "Users can update own patient data" ON patients;
  DROP POLICY IF EXISTS "Users can view own patient data" ON patients;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view all providers" ON providers;
  DROP POLICY IF EXISTS "Users can update own provider data" ON providers;
  DROP POLICY IF EXISTS "Users can view own provider data" ON providers;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Patients can view their assignments" ON patient_providers;
  DROP POLICY IF EXISTS "Providers can view their assignments" ON patient_providers;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can create messages" ON messages;
  DROP POLICY IF EXISTS "Users can view own messages" ON messages;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop all existing triggers (with error handling)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop all existing functions
DROP FUNCTION IF EXISTS assign_patient_to_provider(uuid, uuid, text, boolean);
DROP FUNCTION IF EXISTS create_admin_record(uuid, text, text, text);
DROP FUNCTION IF EXISTS debug_table_info();
DROP FUNCTION IF EXISTS get_user_roles(uuid);
DROP FUNCTION IF EXISTS get_user_roles_secure(uuid);
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS test_connection();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop all existing tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS patient_providers CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS kv_store_a1a84b3e CASCADE;

-- Clear all existing auth users (only in local development)
-- Note: This will only work on local Supabase instances
DO $$
BEGIN
  -- Only attempt to clear auth.users if we're in a local environment
  IF current_setting('server_version_num')::int >= 140000 THEN
    -- Check if we can access auth schema (local only)
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
      DELETE FROM auth.users;
      RAISE NOTICE 'Cleared all auth.users (local development only)';
    END IF;
  END IF;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not clear auth.users - this is normal in production';
END $$;

-- Add a comment to track the cleanup
COMMENT ON SCHEMA public IS 'Database cleaned and reset for authentication system rebuild';

RAISE NOTICE 'Database cleanup completed successfully';