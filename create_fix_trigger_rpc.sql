-- Create an RPC function to fix the trigger
CREATE OR REPLACE FUNCTION fix_patient_trigger()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Recreate the handle_new_user function
  EXECUTE '
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS trigger 
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $func$
  BEGIN
    -- Log the trigger execution
    RAISE LOG ''handle_new_user trigger fired for user: %'', NEW.id;
    RAISE LOG ''User metadata: %'', NEW.raw_user_meta_data;
    
    -- Check what role is specified in metadata
    IF NEW.raw_user_meta_data->>''role'' = ''patient'' THEN
      RAISE LOG ''Creating patient record for user: %'', NEW.id;
      
      -- Insert into patients table
      INSERT INTO patients (
        id,
        user_id,
        email,
        first_name,
        last_name,
        date_of_birth,
        phone,
        has_completed_intake,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>''first_name'', ''Patient''),
        COALESCE(NEW.raw_user_meta_data->>''last_name'', ''User''),
        NEW.raw_user_meta_data->>''date_of_birth'',
        NEW.raw_user_meta_data->>''phone'',
        false,
        NOW(),
        NOW()
      );
      
      RAISE LOG ''Patient record created successfully for user: %'', NEW.id;
      
    ELSIF NEW.raw_user_meta_data->>''role'' = ''admin'' THEN
      RAISE LOG ''Creating admin record for user: %'', NEW.id;
      
      -- Insert into admins table
      INSERT INTO admins (
        id,
        user_id,
        email,
        first_name,
        last_name,
        role,
        permissions,
        active,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>''first_name'', ''Admin''),
        COALESCE(NEW.raw_user_meta_data->>''last_name'', ''User''),
        ''admin'',
        ARRAY[''messages'', ''patients'', ''dashboard''],
        true,
        NOW(),
        NOW()
      );
      
      RAISE LOG ''Admin record created successfully for user: %'', NEW.id;
      
    ELSE
      RAISE LOG ''No specific role found or provider, defaulting to patient for user: %'', NEW.id;
      
      -- Default to patient if no role specified or if provider
      INSERT INTO patients (
        id,
        user_id,
        email,
        first_name,
        last_name,
        has_completed_intake,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>''first_name'', ''Patient''),
        COALESCE(NEW.raw_user_meta_data->>''last_name'', ''User''),
        false,
        NOW(),
        NOW()
      );
      
      RAISE LOG ''Default patient record created for user: %'', NEW.id;
    END IF;
    
    RETURN NEW;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE LOG ''Error in handle_new_user trigger: %'', SQLERRM;
      -- Don''t fail the auth signup if user record creation fails
      RETURN NEW;
  END;
  $func$;
  ';
  
  -- Drop and recreate the trigger
  EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;';
  EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();';
  
  RETURN 'Trigger fixed successfully';
END;
$$;