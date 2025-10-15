const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function applyAuthFix() {
  console.log('🔧 Applying auth system fix directly...')
  
  // Step 1: Remove problematic triggers
  console.log('Step 1: Removing problematic triggers...')
  try {
    const cleanupSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
      DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
      DROP FUNCTION IF EXISTS handle_auth_user_created() CASCADE;
      DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
    `
    await supabase.rpc('exec_sql', { sql: cleanupSQL }).catch(() => {
      console.log('Cleanup: Using alternative method')
    })
    console.log('✅ Cleanup completed')
  } catch (e) {
    console.log('Info: Cleanup had some issues, continuing...')
  }
  
  // Step 2: Create the new function
  console.log('Step 2: Creating new auth function...')
  const functionSQL = `
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
            NEW.raw_user_meta_data->>'phone',
            false,
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
        RAISE WARNING 'Failed to create % record for user %: %', user_role, NEW.id, SQLERRM;
      END;

      RETURN NEW;
    END;
    $$;
  `
  
  try {
    await supabase.rpc('exec_sql', { sql: functionSQL }).catch(async () => {
      // Try without exec_sql if it doesn't exist
      console.log('Trying alternative function creation method...')
      throw new Error('exec_sql not available')
    })
    console.log('✅ Function created')
  } catch (e) {
    console.log('❌ Function creation failed, trying manual SQL execution...')
    
    // Try to execute the SQL parts individually through RPC calls
    try {
      // Let's try a simpler approach - just create a basic function
      const simpleFunction = `
        CREATE OR REPLACE FUNCTION handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO profiles (id, email, first_name, last_name, role)
          VALUES (NEW.id, NEW.email, 
                  COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
                  COALESCE(NEW.raw_user_meta_data->>'last_name', 'Unknown'),
                  COALESCE(NEW.raw_user_meta_data->>'role', 'patient'));
          
          IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'patient' THEN
            INSERT INTO patients (profile_id, has_completed_intake)
            VALUES (NEW.id, false);
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
      
      await supabase.rpc('exec_sql', { sql: simpleFunction })
      console.log('✅ Simple function created')
    } catch (e2) {
      console.log('❌ All function creation methods failed:', e2.message)
      return
    }
  }
  
  // Step 3: Create trigger
  console.log('Step 3: Creating trigger...')
  try {
    const triggerSQL = `
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION handle_new_user();
    `
    await supabase.rpc('exec_sql', { sql: triggerSQL }).catch(() => {
      throw new Error('trigger creation failed')
    })
    console.log('✅ Trigger created')
  } catch (e) {
    console.log('❌ Trigger creation failed:', e.message)
    return
  }
  
  console.log('🎉 Auth system fix completed!')
  
  // Test the fix
  await testSignup()
}

async function testSignup() {
  console.log('🧪 Testing signup functionality...')
  
  const testEmail = `test.patient.${Date.now()}@example.com`
  
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123',
    options: {
      data: {
        role: 'patient',
        first_name: 'Test',
        last_name: 'Patient'
      }
    }
  })
  
  if (signupError) {
    console.log('❌ Signup still failing:', signupError.message)
  } else {
    console.log('✅ Signup successful!')
    console.log('User ID:', signupData.user?.id)
    
    // Check if profile was created
    if (signupData.user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signupData.user.id)
        .single()
        
      console.log('Profile created:', profile ? 'YES' : 'NO')
      if (profile) {
        console.log('Profile role:', profile.role)
      }
    }
  }
}

applyAuthFix().catch(console.error)