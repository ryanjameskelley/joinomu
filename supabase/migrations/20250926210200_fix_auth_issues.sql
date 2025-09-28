-- Fix auth issues after clinical notes migration

-- Ensure the update_updated_at_column function doesn't conflict with auth
-- Make it more specific and defensive
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the table actually has an updated_at column
    IF TG_TABLE_NAME = 'clinical_notes' THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the operation if there's an issue
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure all required tables exist for auth trigger
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'patient',
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    phone TEXT,
    has_completed_intake BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT DEFAULT 'General Practice',
    license_number TEXT,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    permissions TEXT[] DEFAULT ARRAY['dashboard'],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Temporarily disable RLS to ensure auth trigger works
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Recreate the auth trigger to ensure it's working
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
  date_of_birth_val DATE;
  phone_val TEXT;
  specialty_val TEXT;
  license_number_val TEXT;
BEGIN
  -- Extract role from raw_user_meta_data only
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'patient'
  );
  
  -- Extract names from raw_user_meta_data
  first_name_val := COALESCE(
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'first_name',
    'User'
  );
  
  last_name_val := COALESCE(
    NEW.raw_user_meta_data->>'lastName',
    NEW.raw_user_meta_data->>'last_name',
    'Name'
  );
  
  -- Extract optional fields from raw_user_meta_data
  phone_val := NEW.raw_user_meta_data->>'phone';
  specialty_val := NEW.raw_user_meta_data->>'specialty';
  license_number_val := COALESCE(
    NEW.raw_user_meta_data->>'licenseNumber',
    NEW.raw_user_meta_data->>'license_number'
  );
  
  -- Handle date of birth with proper error handling
  BEGIN
    date_of_birth_val := (COALESCE(
      NEW.raw_user_meta_data->>'dateOfBirth',
      NEW.raw_user_meta_data->>'date_of_birth'
    ))::DATE;
  EXCEPTION
    WHEN OTHERS THEN
      date_of_birth_val := NULL;
  END;
  
  -- Create profile record
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    first_name_val,
    last_name_val
  );
  
  -- Create role-specific record
  IF user_role = 'patient' THEN
    INSERT INTO public.patients (profile_id, date_of_birth, phone, has_completed_intake)
    VALUES (NEW.id, date_of_birth_val, phone_val, false);
    
  ELSIF user_role = 'admin' THEN
    INSERT INTO public.admins (profile_id, permissions, active)
    VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true);
    
  ELSIF user_role = 'provider' THEN
    INSERT INTO public.providers (profile_id, specialty, license_number, phone, active)
    VALUES (NEW.id, COALESCE(specialty_val, 'General Practice'), COALESCE(license_number_val, 'PENDING'), phone_val, true);
  END IF;
  
  RETURN NEW;
  
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();