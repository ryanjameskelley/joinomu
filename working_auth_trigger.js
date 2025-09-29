const { createClient } = require('@supabase/supabase-js')

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function createWorkingAuthTrigger() {
  console.log('🔧 Creating working auth trigger for current database structure...')
  
  // First check current table structure
  console.log('\n📋 Checking current table structure...')
  
  try {
    const { data: profilesCheck } = await serviceSupabase
      .from('profiles')
      .select('*')
      .limit(1)
    console.log('✅ Profiles table exists')
    
    const { data: patientsCheck } = await serviceSupabase
      .from('patients')
      .select('*')
      .limit(1)
    console.log('✅ Patients table exists')
    
    const { data: providersCheck } = await serviceSupabase
      .from('providers')
      .select('*')
      .limit(1)
    console.log('✅ Providers table exists')
    
    const { data: adminsCheck } = await serviceSupabase
      .from('admins')
      .select('*')
      .limit(1)
    console.log('✅ Admins table exists')
    
  } catch (e) {
    console.log('❌ Error checking tables:', e.message)
    return false
  }
  
  // Create the auth trigger function adapted for current structure
  const triggerSQL = `
    -- Create working auth trigger for current database structure
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
      -- Extract user metadata safely
      user_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        NEW.user_metadata->>'role',
        'patient'
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
        NEW.user_metadata->>'specialty',
        'General Practice'
      );
      
      license_number_val := COALESCE(
        NEW.raw_user_meta_data->>'licenseNumber',
        NEW.raw_user_meta_data->>'license_number',
        NEW.user_metadata->>'licenseNumber',
        NEW.user_metadata->>'license_number'
      );

      -- Create profile record (current structure)
      INSERT INTO public.profiles (
        id, email, first_name, last_name, role, created_at, updated_at
      ) VALUES (
        NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW()
      );

      -- Create role-specific records
      IF user_role = 'patient' THEN
        INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
        VALUES (NEW.id, phone_val, false, NOW(), NOW());
        
      ELSIF user_role = 'provider' THEN
        INSERT INTO public.providers (profile_id, specialty, license_number, phone, active, created_at, updated_at)
        VALUES (NEW.id, specialty_val, license_number_val, phone_val, true, NOW(), NOW())
        RETURNING id INTO new_provider_id;
        
        -- Create provider schedule automatically
        IF new_provider_id IS NOT NULL THEN
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
        END IF;
        
      ELSIF user_role = 'admin' THEN
        INSERT INTO public.admins (profile_id, permissions, created_at, updated_at)
        VALUES (NEW.id, 'full', NOW(), NOW());
      END IF;

      RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Auth trigger error: %', SQLERRM;
      RETURN NEW;
    END;
    $$;

    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    -- Create the trigger
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();

    -- Grant permissions
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
  `
  
  console.log('\n🔧 Creating auth trigger function and trigger...')
  
  try {
    // Execute the SQL using the admin API
    const response = await fetch('http://127.0.0.1:54321/rest/v1/rpc/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
      },
      body: JSON.stringify({ query: triggerSQL })
    })
    
    if (!response.ok) {
      console.log('❌ Direct SQL execution failed, trying supabase client...')
      
      // Alternative: Try creating via Supabase client
      // Split the SQL into parts and execute separately
      const statements = triggerSQL.split(';').filter(s => s.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            console.log('Executing:', statement.substring(0, 50) + '...')
            // This won't work directly but let's see
          } catch (e) {
            console.log('Statement failed:', e.message)
          }
        }
      }
      
      console.log('❌ Could not execute SQL directly')
      return false
    }
    
    console.log('✅ Auth trigger created successfully!')
    return true
    
  } catch (error) {
    console.log('❌ Error creating auth trigger:', error.message)
    return false
  }
}

async function testAuthTrigger() {
  console.log('\n🧪 Testing auth trigger with all user types...')
  
  const testSupabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  )
  
  const testUsers = [
    {
      email: `working.patient.${Date.now()}@test.com`,
      password: 'password123',
      role: 'patient',
      first_name: 'Working',
      last_name: 'Patient',
      phone: '555-0001'
    },
    {
      email: `working.provider.${Date.now()}@test.com`,
      password: 'password123',
      role: 'provider', 
      first_name: 'Dr. Working',
      last_name: 'Provider',
      specialty: 'Endocrinology',
      licenseNumber: 'MD999888',
      phone: '555-0002'
    },
    {
      email: `working.admin.${Date.now()}@test.com`,
      password: 'password123',
      role: 'admin',
      first_name: 'Working',
      last_name: 'Admin'
    }
  ]
  
  let successCount = 0
  
  for (const user of testUsers) {
    console.log(`\n📝 Testing ${user.role} creation: ${user.email}`)
    
    try {
      const { data: signupData, error: signupError } = await testSupabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            specialty: user.specialty,
            licenseNumber: user.licenseNumber,
            phone: user.phone
          }
        }
      })
      
      if (signupError) {
        console.log(`❌ Signup failed: ${signupError.message}`)
        continue
      }
      
      console.log(`✅ Auth user created: ${signupData.user?.id}`)
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if profile was created
      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('*')
        .eq('id', signupData.user.id)
        .single()
        
      if (profile) {
        console.log(`✅ Profile auto-created: ${profile.first_name} ${profile.last_name} (${profile.role})`)
        
        // Check role-specific record
        if (user.role === 'patient') {
          const { data: patient } = await serviceSupabase
            .from('patients')
            .select('*')
            .eq('profile_id', signupData.user.id)
            .single()
            
          if (patient) {
            console.log(`✅ Patient record auto-created`)
            successCount++
          }
          
        } else if (user.role === 'provider') {
          const { data: provider } = await serviceSupabase
            .from('providers')
            .select('*')
            .eq('profile_id', signupData.user.id)
            .single()
            
          if (provider) {
            console.log(`✅ Provider record auto-created`)
            
            // Check provider schedules
            const { data: schedules } = await serviceSupabase
              .from('provider_schedules')
              .select('*')
              .eq('provider_id', provider.id)
              
            if (schedules && schedules.length > 0) {
              console.log(`✅ Provider schedules auto-created: ${schedules.length} days (${schedules[0].start_time}-${schedules[0].end_time})`)
              successCount++
            } else {
              console.log(`❌ Provider schedules missing`)
            }
          }
          
        } else if (user.role === 'admin') {
          const { data: admin } = await serviceSupabase
            .from('admins')
            .select('*')
            .eq('profile_id', signupData.user.id)
            .single()
            
          if (admin) {
            console.log(`✅ Admin record auto-created with permissions: ${admin.permissions}`)
            successCount++
          }
        }
        
      } else {
        console.log(`❌ Profile creation failed`)
      }
      
    } catch (e) {
      console.log(`❌ Error testing ${user.role}:`, e.message)
    }
  }
  
  return successCount === 3
}

async function main() {
  const created = await createWorkingAuthTrigger()
  
  if (created) {
    const working = await testAuthTrigger()
    
    if (working) {
      console.log('\n🎉 WORKING AUTH TRIGGER SUCCESSFULLY CREATED!')
      console.log('\n✅ FINAL ANSWER TO YOUR QUESTION:')
      console.log('✅ YES! You can now create users of any type and have Supabase respond correctly!')
      console.log('✅ Auth users are created in auth.users')
      console.log('✅ Profile records are auto-created in profiles table')
      console.log('✅ Role-specific records are auto-created (patients, providers, admins)')
      console.log('✅ Provider schedules are automatically generated (Mon-Fri, 9-5)')
      console.log('\n🚀 Ready for testing at: http://localhost:3456/')
      console.log('📝 Use role metadata: "patient", "provider", or "admin"')
    } else {
      console.log('\n❌ Auth trigger created but not working properly')
    }
  } else {
    console.log('\n❌ Failed to create auth trigger')
  }
}

main().catch(console.error)