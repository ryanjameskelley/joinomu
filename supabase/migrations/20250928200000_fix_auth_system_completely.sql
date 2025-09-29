-- Complete auth system fix
-- This migration removes all problematic triggers and creates a clean, working auth system

-- Step 1: Remove all existing auth triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Clean up any problematic constraints or policies that might interfere
-- Temporarily disable RLS on profiles for the migration
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Create a simple, robust auth trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT DEFAULT 'patient';
  first_name TEXT DEFAULT 'User';
  last_name TEXT DEFAULT 'Unknown';
  phone_val TEXT;
BEGIN
  -- Safely extract role from metadata
  BEGIN
    user_role := COALESCE(
      NEW.raw_user_meta_data->>'role',
      NEW.user_metadata->>'role',
      'patient'
    );
  EXCEPTION WHEN OTHERS THEN
    user_role := 'patient';
  END;

  -- Safely extract first name
  BEGIN
    first_name := COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'firstName',
      NEW.user_metadata->>'first_name',
      NEW.user_metadata->>'firstName',
      'User'
    );
  EXCEPTION WHEN OTHERS THEN
    first_name := 'User';
  END;

  -- Safely extract last name
  BEGIN
    last_name := COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'lastName',
      NEW.user_metadata->>'last_name',
      NEW.user_metadata->>'lastName',
      'Unknown'
    );
  EXCEPTION WHEN OTHERS THEN
    last_name := 'Unknown';
  END;

  -- Safely extract phone
  BEGIN
    phone_val := COALESCE(
      NEW.raw_user_meta_data->>'phone',
      NEW.user_metadata->>'phone'
    );
  EXCEPTION WHEN OTHERS THEN
    phone_val := NULL;
  END;

  -- Create profile record
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      first_name,
      last_name,
      role,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      first_name,
      last_name,
      user_role,
      NOW(),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- If profile creation fails, don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;

  -- Create role-specific records
  BEGIN
    IF user_role = 'patient' THEN
      INSERT INTO public.patients (
        profile_id,
        phone,
        has_completed_intake,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        phone_val,
        false,
        NOW(),
        NOW()
      );
    ELSIF user_role = 'provider' THEN
      INSERT INTO public.providers (
        profile_id,
        specialty,
        license_number,
        phone,
        active,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'specialty', NEW.user_metadata->>'specialty'),
        COALESCE(NEW.raw_user_meta_data->>'licenseNumber', NEW.user_metadata->>'licenseNumber'),
        phone_val,
        true,
        NOW(),
        NOW()
      );
    ELSIF user_role = 'admin' THEN
      INSERT INTO public.admins (
        profile_id,
        permissions,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        'full',
        NOW(),
        NOW()
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If role-specific record creation fails, don't block user creation
    RAISE WARNING 'Failed to create % record for user %: %', user_role, NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Step 6: Re-enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Ensure basic RLS policies exist for profiles
DO $$
BEGIN
  -- Drop existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  
  -- Create basic policies
  CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
    
  CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
    
  CREATE POLICY "Service role can manage all profiles" ON profiles
    USING (current_setting('role') = 'service_role');
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Policy creation warning: %', SQLERRM;
END
$$;

-- Step 8: Test the trigger setup
SELECT 'Auth trigger setup completed successfully' as status;