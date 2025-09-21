import { supabase } from './utils/supabase/client'

async function simpleTriggerFix() {
  try {
    console.log('🔧 Creating simple trigger fix RPC function...')
    
    // Create a simple RPC function that fixes the trigger
    const { data, error } = await supabase.rpc('create_trigger_fix', {})
    
    if (error) {
      console.log('❌ RPC call failed, trying direct SQL approach...')
      
      // If RPC fails, let's create the trigger fix function directly
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION create_trigger_fix()
        RETURNS TEXT
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          -- Create the trigger function
          EXECUTE 'CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $func$ BEGIN IF NEW.raw_user_meta_data->>''role'' = ''patient'' THEN INSERT INTO patients (id, user_id, email, first_name, last_name, has_completed_intake, created_at, updated_at) VALUES (gen_random_uuid(), NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>''first_name'', ''Patient''), COALESCE(NEW.raw_user_meta_data->>''last_name'', ''User''), false, NOW(), NOW()); ELSIF NEW.raw_user_meta_data->>''role'' = ''admin'' THEN INSERT INTO admins (id, user_id, email, first_name, last_name, role, permissions, active, created_at, updated_at) VALUES (gen_random_uuid(), NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>''first_name'', ''Admin''), COALESCE(NEW.raw_user_meta_data->>''last_name'', ''User''), ''admin'', ARRAY[''messages'', ''patients'', ''dashboard''], true, NOW(), NOW()); ELSE INSERT INTO patients (id, user_id, email, first_name, last_name, has_completed_intake, created_at, updated_at) VALUES (gen_random_uuid(), NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>''first_name'', ''Patient''), COALESCE(NEW.raw_user_meta_data->>''last_name'', ''User''), false, NOW(), NOW()); END IF; RETURN NEW; EXCEPTION WHEN OTHERS THEN RETURN NEW; END; $func$;';
          
          -- Create the trigger
          EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;';
          EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();';
          
          RETURN 'Trigger created successfully';
        END;
        $$;
      `
      
      console.log('⚠️ Manual approach needed. Please run this SQL in Supabase dashboard:')
      console.log(createFunctionSql)
      console.log('Then run: SELECT create_trigger_fix();')
      
    } else {
      console.log('✅ Trigger fix completed:', data)
    }
  } catch (err) {
    console.error('💥 Exception:', err)
    console.log('ℹ️  You may need to manually create the trigger in Supabase dashboard')
  }
}

// Alternative: Check if patients are being created properly
async function checkPatientCreation() {
  try {
    console.log('🔍 Checking recent patient creations...')
    
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, user_id, email, first_name, last_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('❌ Error fetching patients:', error)
    } else {
      console.log('📋 Recent patients:', patients)
      console.log(`Found ${patients?.length || 0} patients in database`)
    }
    
    // Also check auth users
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      console.log('👤 Current user:', user.id, user.email)
    }
    
  } catch (err) {
    console.error('💥 Exception checking patients:', err)
  }
}

// Simpler approach: manually create missing patient records
async function createMissingPatientRecords() {
  try {
    console.log('🔧 Creating missing patient records for auth users...')
    
    // This will use our existing RPC function that we know works
    const { data, error } = await supabase.rpc('get_user_roles_secure', { 
      user_id_param: 'dummy-id-to-test-function-exists' 
    })
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('❌ RPC functions not available. Trigger needs manual database setup.')
      console.log('ℹ️  Please contact admin to run database migration.')
    } else {
      console.log('✅ Database functions are available')
      console.log('ℹ️  Try creating a new patient signup to test if trigger is working')
    }
    
  } catch (err) {
    console.error('💥 Exception:', err)
  }
}

// Export functions for console use
(window as any).simpleTriggerFix = simpleTriggerFix;
(window as any).checkPatientCreation = checkPatientCreation;
(window as any).createMissingPatientRecords = createMissingPatientRecords;

console.log('🔧 Simple trigger fix functions loaded:');
console.log('- simpleTriggerFix() - attempt to fix trigger');
console.log('- checkPatientCreation() - check current patients');
console.log('- createMissingPatientRecords() - check RPC availability');

export { simpleTriggerFix, checkPatientCreation, createMissingPatientRecords }