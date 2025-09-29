const { createClient } = require('@supabase/supabase-js')

const serviceSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

const testSupabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function activateAuthTrigger() {
  console.log('🔧 Activating auth trigger directly...')
  
  try {
    // Check if the function exists
    const { data: functions } = await serviceSupabase
      .from('pg_proc')
      .select('proname')
      .like('proname', '%handle%user%')
      
    console.log('Available functions:', functions)
    
    // Let's try to create a simple version using direct client execution
    const authTriggerSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      SECURITY DEFINER
      SET search_path = public
      LANGUAGE plpgsql
      AS $$
      BEGIN
        -- Create profile record
        INSERT INTO public.profiles (
          id, email, first_name, last_name, role, created_at, updated_at
        ) VALUES (
          NEW.id, 
          NEW.email, 
          COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
          COALESCE(NEW.raw_user_meta_data->>'last_name', 'Unknown'),
          COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
          NOW(), 
          NOW()
        );

        -- Create role-specific records based on role
        IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'patient' THEN
          INSERT INTO public.patients (profile_id, has_completed_intake, created_at, updated_at)
          VALUES (NEW.id, false, NOW(), NOW());
          
        ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'admin' THEN
          INSERT INTO public.admins (profile_id, permissions, created_at, updated_at)
          VALUES (NEW.id, 'full', NOW(), NOW());
          
        ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'provider' THEN
          INSERT INTO public.providers (profile_id, specialty, active, created_at, updated_at)
          VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Practice'), true, NOW(), NOW());
        END IF;

        RETURN NEW;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Auth trigger error: %', SQLERRM;
        RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    `
    
    // Execute via direct database connection
    const result = await fetch('http://127.0.0.1:54321/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
      },
      body: JSON.stringify({ sql: authTriggerSQL })
    })
    
    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${await result.text()}`)
    }
    
    console.log('✅ Auth trigger created successfully')
    
    // Test the trigger
    console.log('\n🧪 Testing auth trigger with new user...')
    
    const testEmail = `auth.test.${Date.now()}@example.com`
    
    const { data: signupData, error: signupError } = await testSupabase.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'admin',
          first_name: 'Test',
          last_name: 'Admin'
        }
      }
    })
    
    if (signupError) {
      console.log('❌ Test signup failed:', signupError.message)
      return false
    }
    
    console.log(`✅ User signup successful: ${signupData.user?.email}`)
    
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
      
      // Check admin record
      const { data: admin } = await serviceSupabase
        .from('admins')
        .select('*')
        .eq('profile_id', signupData.user.id)
        .single()
        
      if (admin) {
        console.log(`✅ Admin record auto-created with permissions: ${admin.permissions}`)
        return true
      }
    }
    
    console.log('❌ Profile or admin record not created')
    return false
    
  } catch (error) {
    console.log('❌ Error activating auth trigger:', error.message)
    return false
  }
}

async function main() {
  const success = await activateAuthTrigger()
  
  if (success) {
    console.log('\n🎉 AUTH TRIGGER IS NOW WORKING!')
    console.log('\n✅ ANSWER: YES, you can now create users of any type and have Supabase respond correctly!')
    console.log('✅ Auth users will be created in auth.users')
    console.log('✅ Profile records will be auto-created')
    console.log('✅ Role-specific records will be auto-created')
    console.log('\n🚀 Try signup at: http://localhost:3456/')
    console.log('📝 Use role: "patient", "provider", or "admin" in signup metadata')
  } else {
    console.log('\n❌ Auth trigger activation failed')
    console.log('❌ ANSWER: No, user creation with auto table population is not working yet')
  }
}

main().catch(console.error)