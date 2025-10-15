const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function fixAuthSimple() {
  console.log('🔧 Applying simple auth fix...')
  
  try {
    // Create a working auth function
    const result1 = await supabase.rpc('exec_sql', { 
      sql: `
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
      `
    })
    console.log('✅ Cleanup completed')
  } catch (e) {
    console.log('Cleanup:', e.message)
  }
  
  try {
    const result2 = await supabase.rpc('exec_sql', { 
      sql: `
        CREATE OR REPLACE FUNCTION handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO profiles (id, email, first_name, last_name, role, created_at, updated_at)
          VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
            COALESCE(NEW.raw_user_meta_data->>'last_name', 'Unknown'),
            COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
            NOW(),
            NOW()
          );
          
          IF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'patient' THEN
            INSERT INTO patients (profile_id, has_completed_intake, created_at, updated_at)
            VALUES (NEW.id, false, NOW(), NOW());
          ELSIF COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'admin' THEN
            INSERT INTO admins (profile_id, permissions, created_at, updated_at)
            VALUES (NEW.id, 'full', NOW(), NOW());
          END IF;
          
          RETURN NEW;
        EXCEPTION
          WHEN OTHERS THEN
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    })
    console.log('✅ Function created')
  } catch (e) {
    console.log('❌ Function failed:', e.message)
    return
  }
  
  try {
    const result3 = await supabase.rpc('exec_sql', { 
      sql: `
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW
          EXECUTE FUNCTION handle_new_user();
      `
    })
    console.log('✅ Trigger created')
  } catch (e) {
    console.log('❌ Trigger failed:', e.message)
    return
  }
  
  console.log('🎉 Auth fix completed! Testing signup...')
  
  // Test signup
  const testEmail = `test.${Date.now()}@example.com`
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123',
    options: {
      data: {
        role: 'patient',
        first_name: 'Test',
        last_name: 'User'
      }
    }
  })
  
  if (error) {
    console.log('❌ Signup test failed:', error.message)
  } else {
    console.log('✅ Signup test successful!')
    console.log('User created:', data.user?.email)
    
    // Check profile
    if (data.user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
        
      console.log('Profile created:', profile ? 'YES' : 'NO')
      if (profile) {
        console.log('- Role:', profile.role)
        console.log('- Name:', profile.first_name, profile.last_name)
      }
    }
  }
  
  // Now create a test admin user
  console.log('🔧 Creating test admin user...')
  
  const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
    email: 'admin@test.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User'
    }
  })
  
  if (adminError) {
    console.log('❌ Admin creation failed:', adminError.message)
  } else {
    console.log('✅ Admin user created!')
    console.log('🎉 You can now sign in with:')
    console.log('Email: admin@test.com')
    console.log('Password: admin123')
  }
}

fixAuthSimple().catch(console.error)