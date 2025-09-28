// Check auth.users table to see if users are being created
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hwl7L9UNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthUsers() {
  console.log('🔍 Checking auth.users table:\n');

  try {
    // Use RPC to query auth.users since it's protected
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            id, 
            email, 
            created_at,
            email_confirmed_at,
            raw_user_meta_data->>'role' as role,
            raw_user_meta_data->>'first_name' as first_name,
            raw_user_meta_data->>'last_name' as last_name
          FROM auth.users 
          ORDER BY created_at DESC 
          LIMIT 10
        ` 
      });

    if (error) {
      console.error('Error querying auth users:', error);
      return;
    }

    console.log(`Found ${data?.length || 0} auth users:`);
    if (data && data.length > 0) {
      data.forEach((user, i) => {
        console.log(`  ${i+1}. ${user.email} (${user.role || 'no role'}) - Confirmed: ${!!user.email_confirmed_at} - Created: ${user.created_at}`);
      });
    }

    // Check triggers
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            tgname as trigger_name,
            tgenabled as enabled,
            tgrelid::regclass as table_name
          FROM pg_trigger 
          WHERE tgname IN ('on_auth_user_created', 'on_provider_created')
        ` 
      });

    if (!triggerError && triggers) {
      console.log('\nTriggers status:');
      triggers.forEach(trigger => {
        console.log(`  ${trigger.trigger_name} on ${trigger.table_name}: ${trigger.enabled ? 'ENABLED' : 'DISABLED'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAuthUsers();