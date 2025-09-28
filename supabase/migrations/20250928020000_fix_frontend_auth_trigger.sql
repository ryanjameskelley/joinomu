-- Fix auth trigger to work with frontend signups
-- The issue is that frontend signUp() puts metadata in raw_user_meta_data
-- while admin createUser() puts it in user_metadata

-- Drop and recreate the trigger function to handle both cases
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  first_name TEXT;
  last_name TEXT;
  phone_val TEXT;
  date_of_birth_val DATE;
  specialty_val TEXT;
  license_number_val TEXT;
  new_provider_id UUID;
  new_patient_id UUID;
BEGIN
  -- Log the trigger start
  INSERT INTO auth_trigger_logs (event, status, message, metadata)
  VALUES ('TRIGGER_START', 'SUCCESS', 'Processing new user signup', 
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'user_metadata', NEW.user_metadata
    ));

  -- Extract data from BOTH raw_user_meta_data AND user_metadata for compatibility
  -- Frontend signup uses raw_user_meta_data, admin API uses user_metadata
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.user_metadata->>'role',
    'patient'  -- default to patient
  );
  
  first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'firstName',
    NEW.user_metadata->>'first_name', 
    NEW.user_metadata->>'firstName',
    'User'
  );
  
  last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'lastName',
    NEW.user_metadata->>'last_name',
    NEW.user_metadata->>'lastName', 
    'Unknown'
  );
  
  phone_val := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.user_metadata->>'phone'
  );
  
  specialty_val := COALESCE(
    NEW.raw_user_meta_data->>'specialty',
    NEW.user_metadata->>'specialty'
  );
  
  license_number_val := COALESCE(
    NEW.raw_user_meta_data->>'license_number',
    NEW.raw_user_meta_data->>'licenseNumber',
    NEW.user_metadata->>'license_number',
    NEW.user_metadata->>'licenseNumber'
  );

  -- Log extracted data
  INSERT INTO auth_trigger_logs (event, status, message, metadata)
  VALUES ('DATA_EXTRACTED', 'SUCCESS', 'Extracted user data', 
    jsonb_build_object(
      'role', user_role,
      'first_name', first_name,
      'last_name', last_name,
      'phone', phone_val,
      'specialty', specialty_val
    ));

  -- Create profile first
  INSERT INTO profiles (
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

  -- Log profile creation
  INSERT INTO auth_trigger_logs (event, status, message, metadata)
  VALUES ('PROFILE_CREATED', 'SUCCESS', 'Profile created successfully', 
    jsonb_build_object('role', user_role, 'profile_id', NEW.id));

  -- Create role-specific records
  IF user_role = 'patient' THEN
    INSERT INTO patients (
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
    
    INSERT INTO auth_trigger_logs (event, status, message, metadata)
    VALUES ('PATIENT_CREATED', 'SUCCESS', 'Patient record created', 
      jsonb_build_object('patient_profile_id', NEW.id));
      
  ELSIF user_role = 'provider' THEN
    INSERT INTO providers (
      profile_id,
      specialty,
      license_number,
      phone,
      active,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      specialty_val,
      license_number_val,
      phone_val,
      true,
      NOW(),
      NOW()
    ) RETURNING id INTO new_provider_id;
    
    INSERT INTO auth_trigger_logs (event, status, message, metadata)
    VALUES ('PROVIDER_CREATED', 'SUCCESS', 'Provider record created', 
      jsonb_build_object('provider_id', new_provider_id));
      
  ELSIF user_role = 'admin' THEN
    INSERT INTO admins (
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
    
    INSERT INTO auth_trigger_logs (event, status, message, metadata)
    VALUES ('ADMIN_CREATED', 'SUCCESS', 'Admin record created', 
      jsonb_build_object('admin_profile_id', NEW.id));
  END IF;

  -- Log successful completion
  INSERT INTO auth_trigger_logs (event, status, message, metadata)
  VALUES ('TRIGGER_COMPLETE', 'SUCCESS', 'User signup processed successfully', 
    jsonb_build_object(
      'final_role', user_role,
      'profile_created', true,
      'role_record_created', true
    ));

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors
    INSERT INTO auth_trigger_logs (event, status, message, metadata)
    VALUES ('TRIGGER_ERROR', 'FAILED', SQLERRM, 
      jsonb_build_object(
        'sql_state', SQLSTATE,
        'user_id', NEW.id,
        'email', NEW.email
      ));
    
    -- Re-raise the error
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;