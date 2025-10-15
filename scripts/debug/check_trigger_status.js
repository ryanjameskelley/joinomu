// Check trigger status and logs
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hwl7L9UNtJ2MWZiUY';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkTriggerStatus() {
  console.log('🔍 Checking auth trigger status...\n');

  try {
    // Check trigger health
    console.log('📊 Running health check...');
    const { data: healthData, error: healthError } = await supabase.rpc('check_auth_trigger_health');
    
    if (healthError) {
      console.error('❌ Health check error:', healthError);
    } else {
      console.log('Health metrics:');
      healthData.forEach(metric => {
        console.log(`  ${metric.metric}: ${metric.value} (${metric.status})`);
      });
    }

    // Check recent logs
    console.log('\n📋 Recent auth trigger logs:');
    const { data: logs, error: logsError } = await supabase
      .from('auth_trigger_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsError) {
      console.error('❌ Logs error:', logsError);
    } else if (logs && logs.length > 0) {
      logs.forEach(log => {
        const status = log.success ? '✅' : '❌';
        console.log(`  ${status} ${log.trigger_stage} for ${log.user_id?.slice(0,8)} at ${log.created_at}`);
        if (log.error_message) {
          console.log(`    Error: ${log.error_message}`);
        }
        if (log.metadata) {
          console.log(`    Metadata: ${JSON.stringify(log.metadata)}`);
        }
      });
    } else {
      console.log('  No logs found');
    }

    // Check current auth users vs profiles
    console.log('\n👥 Current user/profile status:');
    const { data: authUsersCount } = await supabase.rpc('sql', {
      query: 'SELECT COUNT(*) as count FROM auth.users'
    });
    
    const { data: profilesCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    
    console.log(`  Auth users: ${authUsersCount?.[0]?.count || 'unknown'}`);
    console.log(`  Profiles: ${profilesCount?.count || 0}`);
    
    // Check if the trigger exists
    console.log('\n🔧 Checking trigger existence:');
    const { data: triggerExists } = await supabase.rpc('sql', {
      query: `
        SELECT 
          t.tgname, 
          t.tgenabled,
          n.nspname as schema_name,
          c.relname as table_name
        FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE t.tgname = 'on_auth_user_created'
      `
    });
    
    if (triggerExists && triggerExists.length > 0) {
      const trigger = triggerExists[0];
      console.log(`  ✅ Trigger exists: ${trigger.tgname} on ${trigger.schema_name}.${trigger.table_name}`);
      console.log(`  Enabled: ${trigger.tgenabled === 'O' ? 'Yes' : 'No'}`);
    } else {
      console.log('  ❌ Trigger not found');
    }

  } catch (error) {
    console.error('💥 Error checking trigger status:', error);
  }
}

checkTriggerStatus();