// Simple test to check database connectivity and tables
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey);

async function simpleTest() {
  console.log('🔍 Simple database connectivity test...\n');

  try {
    // 1. Test basic table access
    console.log('📊 Testing table access...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError);
    } else {
      console.log(`✅ Profiles table: ${profiles.count} records`);
    }

    // 2. Test auth_trigger_logs table
    const { data: logs, error: logsError } = await supabase
      .from('auth_trigger_logs')
      .select('count', { count: 'exact', head: true });
    
    if (logsError) {
      console.log('❌ Auth logs table error:', logsError);
    } else {
      console.log(`✅ Auth logs table: ${logs.count} records`);
    }

    // 3. Test auth.users table access via direct query
    console.log('\n🔍 Testing auth.users access...');
    try {
      // Try to access via postgres connection
      const { data: authCheck } = await supabase
        .from('profiles')  // Use profiles as a proxy test
        .select('*')
        .limit(1);
      
      console.log(`✅ Database connection works, got ${authCheck?.length || 0} profiles`);
      
      if (authCheck && authCheck.length > 0) {
        console.log(`  Sample profile: ${authCheck[0].email} (${authCheck[0].role})`);
      }
      
    } catch (error) {
      console.log('❌ Database connection error:', error.message);
    }

    // 4. Test a simple signup
    console.log('\n🔐 Testing simple signup...');
    const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
    
    const testEmail = `simple.${Date.now()}@example.com`;
    const { data: signup, error: signupError } = await anonClient.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'provider',
          firstName: 'Simple',
          lastName: 'Test'
        }
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
    } else {
      console.log(`✅ Signup successful: ${signup.user?.id}`);
      
      // Wait and check if anything was created
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signup.user?.id)
        .single();
      
      console.log(`  Profile created: ${newProfile ? '✅ Yes' : '❌ No'}`);
      if (newProfile) {
        console.log(`    Role: ${newProfile.role}, Name: ${newProfile.first_name} ${newProfile.last_name}`);
      }

      // Check logs
      const { data: signupLogs } = await supabase
        .from('auth_trigger_logs')
        .select('*')
        .eq('user_id', signup.user?.id);
      
      console.log(`  Trigger logs: ${signupLogs?.length || 0} entries`);
      if (signupLogs && signupLogs.length > 0) {
        signupLogs.forEach(log => {
          console.log(`    - ${log.trigger_stage}: ${log.success ? 'SUCCESS' : 'FAILED'}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Error in simple test:', error);
  }
}

simpleTest();