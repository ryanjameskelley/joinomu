-- Restore simple auth trigger for patient signup

-- Create a simple, reliable auth trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
  first_name TEXT;
  last_name TEXT;
  phone TEXT;
BEGIN
  -- Extract user data
  user_email := NEW.email;
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  first_name := COALESCE(NEW.raw_user_meta_data->>'firstName', split_part(user_email, '@', 1));
  last_name := COALESCE(NEW.raw_user_meta_data->>'lastName', '');
  phone := NEW.raw_user_meta_data->>'phone';

  -- Create profile first
  INSERT INTO public.profiles (id, role, email, first_name, last_name, phone)
  VALUES (NEW.id, user_role, user_email, first_name, last_name, phone);

  -- Create role-specific record
  IF user_role = 'patient' THEN
    INSERT INTO public.patients (
      id,
      profile_id,
      date_of_birth,
      phone,
      address,
      active
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'dateOfBirth')::DATE, '1990-01-01'::DATE),
      phone,
      NEW.raw_user_meta_data->>'address',
      true
    );
    
  ELSIF user_role = 'provider' THEN
    INSERT INTO public.providers (
      id,
      profile_id,
      specialty,
      license_number,
      phone,
      active
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'specialty', 'General'),
      NEW.raw_user_meta_data->>'licenseNumber',
      phone,
      true
    );
    
  ELSIF user_role = 'admin' THEN
    INSERT INTO public.admins (
      id,
      profile_id,
      phone,
      active
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      phone,
      true
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth signup
  RAISE WARNING 'Auth trigger error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;

COMMENT ON FUNCTION public.handle_new_user() IS 'Simple auth trigger for creating user profiles and role-specific records';