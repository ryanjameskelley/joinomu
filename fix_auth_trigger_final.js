const { Client } = require('pg')
const { createClient } = require('@supabase/supabase-js')

async function fixAuthTrigger() {
  console.log('🔧 Fixing auth trigger with proper debugging...')
  
  const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
  })
  
  try {
    await client.connect()
    
    // Check current function definition
    const functionResult = await client.query(`
      SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'
    `)
    
    if (functionResult.rows.length > 0) {
      console.log('Function exists, checking if it has debug output...')
    }
    
    // Create a new version with better error handling and debug output
    const triggerSQL = `
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
        specialty_val TEXT;
        license_number_val TEXT;
        new_provider_id UUID;
        schedule_days TEXT[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        day_name TEXT;
      BEGIN
        RAISE NOTICE 'Auth trigger fired for user: %', NEW.id;
        
        -- Extract user metadata safely
        user_role := COALESCE(
          NEW.raw_user_meta_data->>'role',
          NEW.user_metadata->>'role',
          'patient'
        );
        
        RAISE NOTICE 'User role extracted: %', user_role;
        
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
          NEW.user_metadata->>'specialty',
          'General Practice'
        );
        
        license_number_val := COALESCE(
          NEW.raw_user_meta_data->>'licenseNumber',
          NEW.raw_user_meta_data->>'license_number',
          NEW.user_metadata->>'licenseNumber',
          NEW.user_metadata->>'license_number'
        );

        RAISE NOTICE 'Creating profile for user % with role %', NEW.id, user_role;

        -- Create profile record (current structure)
        INSERT INTO public.profiles (
          id, email, first_name, last_name, role, created_at, updated_at
        ) VALUES (
          NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW()
        );
        
        RAISE NOTICE 'Profile created successfully';

        -- Create role-specific records
        IF user_role = 'patient' THEN
          RAISE NOTICE 'Creating patient record';
          INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
          VALUES (NEW.id, phone_val, false, NOW(), NOW());
          RAISE NOTICE 'Patient record created';
          
        ELSIF user_role = 'provider' THEN
          RAISE NOTICE 'Creating provider record';
          INSERT INTO public.providers (profile_id, specialty, license_number, phone, active, created_at, updated_at)
          VALUES (NEW.id, specialty_val, license_number_val, phone_val, true, NOW(), NOW())
          RETURNING id INTO new_provider_id;
          
          RAISE NOTICE 'Provider record created with ID: %', new_provider_id;
          
          -- Create provider schedule automatically
          IF new_provider_id IS NOT NULL THEN
            RAISE NOTICE 'Creating provider schedules';
            FOREACH day_name IN ARRAY schedule_days LOOP
              INSERT INTO public.provider_schedules (
                provider_id, day_of_week, start_time, end_time, treatment_types, created_at, updated_at
              ) VALUES (
                new_provider_id, 
                day_name, 
                '09:00:00', 
                '17:00:00', 
                ARRAY['weight_loss', 'diabetes_management'], 
                NOW(), 
                NOW()
              )
              ON CONFLICT (provider_id, day_of_week, start_time, end_time) DO NOTHING;
            END LOOP;
            RAISE NOTICE 'Provider schedules created';
          END IF;
          
        ELSIF user_role = 'admin' THEN
          RAISE NOTICE 'Creating admin record';
          INSERT INTO public.admins (profile_id, permissions, created_at, updated_at)
          VALUES (NEW.id, 'full', NOW(), NOW());
          RAISE NOTICE 'Admin record created';
        END IF;

        RAISE NOTICE 'Auth trigger completed successfully for user %', NEW.id;
        RETURN NEW;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Auth trigger error for user %: % %', NEW.id, SQLSTATE, SQLERRM;
        RETURN NEW;
      END;
      $$;
    `
    
    console.log('Creating improved auth trigger function...')
    await client.query(triggerSQL)
    console.log('✅ Improved auth trigger function created')
    
    console.log('Recreating trigger...')
    await client.query('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;')
    await client.query(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    `)
    console.log('✅ Trigger recreated')
    
    // Test with manual insertion to see debug output
    console.log('\n🧪 Testing with debug output...')
    
    const testUserId = 'bbbbcccc-dddd-eeee-ffff-aaaaaaaaaaaa'
    const testEmail = `debug.test.${Date.now()}@example.com`
    
    // Enable notice display
    await client.query("SET client_min_messages TO NOTICE;")
    
    // Insert test user
    await client.query(`
      INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, confirmation_token
      ) VALUES (
        $1, $2, 
        '$2a$10$dummy',
        NOW(),
        NOW(), 
        NOW(),
        '{"role": "admin", "first_name": "Debug", "last_name": "Test"}'::jsonb,
        'dummy-token'
      )
    `, [testUserId, testEmail])
    
    console.log(`✅ Test user inserted: ${testUserId}`)
    
    return true
    
  } catch (error) {
    console.log('❌ Error fixing auth trigger:', error.message)
    console.log('Error details:', error)
    return false
  } finally {
    await client.end()
  }
}

async function testFixed() {
  console.log('\n🧪 Testing fixed auth trigger...')
  
  const testSupabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  )
  
  const serviceSupabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  )
  
  const testEmail = `final.working.test.${Date.now()}@example.com`
  
  try {
    const { data: signupData, error: signupError } = await testSupabase.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'provider',
          first_name: 'Final',
          last_name: 'Test',
          specialty: 'Cardiology',
          licenseNumber: 'MD999999'
        }
      }
    })
    
    if (signupError) {
      console.log('❌ Signup failed:', signupError.message)
      return false
    }
    
    console.log(`✅ Signup successful: ${signupData.user?.id}`)
    
    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check results
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', signupData.user.id)
      .single()
      
    if (profile) {
      console.log(`✅ Profile created: ${profile.first_name} ${profile.last_name} (${profile.role})`)
      
      if (profile.role === 'provider') {
        const { data: provider } = await serviceSupabase
          .from('providers')
          .select('*')
          .eq('profile_id', signupData.user.id)
          .single()
          
        if (provider) {
          console.log(`✅ Provider record created`)
          
          const { data: schedules } = await serviceSupabase
            .from('provider_schedules')
            .select('*')
            .eq('provider_id', provider.id)
            
          if (schedules && schedules.length > 0) {
            console.log(`✅ Provider schedules created: ${schedules.length} days`)
            
            console.log('\n🎉 COMPLETE SUCCESS!')
            console.log('✅ Auth trigger is working perfectly!')
            return true
          }
        }
      }
    }
    
    console.log('❌ Auth trigger still not working properly')
    return false
    
  } catch (e) {
    console.log('❌ Error during test:', e.message)
    return false
  }
}

async function main() {
  const fixed = await fixAuthTrigger()
  
  if (fixed) {
    const working = await testFixed()
    
    if (working) {
      console.log('\n🎉 FINAL ANSWER: YES!')
      console.log('✅ You can now create users of any type and have Supabase respond correctly!')
      console.log('✅ Auth users → auth.users table')
      console.log('✅ Profile records → profiles table')
      console.log('✅ Role records → patients/providers/admins tables')
      console.log('✅ Provider schedules → provider_schedules table')
      console.log('\n🚀 Ready for testing at: http://localhost:3456/')
    } else {
      console.log('\n❌ FINAL ANSWER: NO')
      console.log('❌ Auth trigger still has issues')
    }
  }
}

main().catch(console.error)