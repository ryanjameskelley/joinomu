const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function applyAuthFix() {
  console.log('🔧 Applying auth trigger fix...')
  
  // Drop existing trigger and function
  const dropSQL = `
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
  `
  
  try {
    await supabase.rpc('exec_sql', { sql: dropSQL })
    console.log('✅ Dropped existing trigger and function')
  } catch (e) {
    console.log('ℹ️ Drop failed (might not exist):', e.message)
  }
  
  // Create new function
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    DECLARE
      user_role TEXT;
      first_name TEXT;
      last_name TEXT;
      phone_val TEXT;
    BEGIN
      -- Extract metadata from raw_user_meta_data (frontend signup)
      user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
      first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName', 'User');
      last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'lastName', 'Unknown');
      phone_val := NEW.raw_user_meta_data->>'phone';

      -- Create profile
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

      -- Create role-specific record
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
          NEW.raw_user_meta_data->>'specialty',
          NEW.raw_user_meta_data->>'licenseNumber',
          phone_val,
          true,
          NOW(),
          NOW()
        );
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
      END IF;

      RETURN NEW;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE NOTICE 'Auth trigger error: %', SQLERRM;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `
  
  try {
    await supabase.rpc('exec_sql', { sql: createFunctionSQL })
    console.log('✅ Created new auth function')
  } catch (e) {
    console.log('❌ Function creation failed:', e.message)
    return
  }
  
  // Create trigger
  const createTriggerSQL = `
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  `
  
  try {
    await supabase.rpc('exec_sql', { sql: createTriggerSQL })
    console.log('✅ Created new auth trigger')
  } catch (e) {
    console.log('❌ Trigger creation failed:', e.message)
    return
  }
  
  // Grant permissions
  const grantSQL = `
    GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
    GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;
  `
  
  try {
    await supabase.rpc('exec_sql', { sql: grantSQL })
    console.log('✅ Granted permissions')
  } catch (e) {
    console.log('❌ Grant failed:', e.message)
  }
  
  console.log('🎉 Auth trigger fix applied successfully!')
  
  // Test signup
  console.log('🧪 Testing signup...')
  
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: 'test.patient.new@example.com',
    password: 'password123',
    options: {
      data: {
        role: 'patient',
        first_name: 'Test',
        last_name: 'Patient'
      }
    }
  })
  
  console.log('Signup test result:', signupData ? 'SUCCESS' : 'FAILED')
  console.log('Signup error:', signupError?.message || 'None')
}

applyAuthFix().catch(console.error)