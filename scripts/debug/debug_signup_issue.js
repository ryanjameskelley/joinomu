// Debug why signup via supabase.auth.signUp doesn't trigger the auth trigger
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hwl7L9UNtJ2MWZiUY';

const supabase = createClient(supabaseUrl, anonKey);
const supabaseService = createClient(supabaseUrl, serviceKey);

async function debugSignupIssue() {
  console.log('🔍 Debugging signup trigger issue...\n');

  const testEmail = `debug.${Date.now()}@example.com`;
  
  try {
    // 1. Check initial state
    console.log('📊 Initial state check...');
    const { data: initialUsers } = await supabaseService.rpc('sql', {
      query: 'SELECT COUNT(*) as count FROM auth.users'
    });
    const { data: initialProfiles } = await supabaseService.from('profiles').select('id', { count: 'exact', head: true });
    
    console.log(`  Auth users: ${initialUsers?.[0]?.count || 'unknown'}`);
    console.log(`  Profiles: ${initialProfiles?.count || 0}`);

    // 2. Perform signup
    console.log('\n🔐 Performing signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'provider',
          firstName: 'Debug',
          lastName: 'Test',
          specialty: 'Emergency Medicine'
        }
      }
    });

    if (signupError) {
      console.error('❌ Signup failed:', signupError);
      return;
    }

    console.log(`✅ Signup successful - User ID: ${signupData.user?.id}`);
    const userId = signupData.user?.id;

    // 3. Check if user exists in auth.users
    console.log('\n👤 Checking auth.users...');
    const { data: authUser } = await supabaseService.rpc('sql', {
      query: `SELECT id, email, raw_user_meta_data, created_at FROM auth.users WHERE id = '${userId}'`
    });

    if (authUser && authUser.length > 0) {
      const user = authUser[0];
      console.log(`✅ User found in auth.users`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Metadata: ${JSON.stringify(user.raw_user_meta_data)}`);
      console.log(`  Created: ${user.created_at}`);
    } else {
      console.log('❌ User NOT found in auth.users');
      return;
    }

    // 4. Wait for trigger
    console.log('\n⏳ Waiting 3 seconds for trigger...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Check trigger logs
    console.log('\n📋 Checking trigger logs...');
    const { data: logs } = await supabaseService
      .from('auth_trigger_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (logs && logs.length > 0) {
      console.log(`✅ Found ${logs.length} trigger log entries:`);
      logs.forEach((log, i) => {
        const status = log.success ? '✅' : '❌';
        console.log(`  ${i+1}. ${status} ${log.trigger_stage}`);
        if (log.error_message) {
          console.log(`     Error: ${log.error_message}`);
        }
        if (log.metadata) {
          console.log(`     Data: ${JSON.stringify(log.metadata)}`);
        }
      });
    } else {
      console.log('❌ No trigger logs found - trigger did not fire');
    }

    // 6. Check what was created
    console.log('\n📊 Checking created records...');
    const { data: profile } = await supabaseService.from('profiles').select('*').eq('id', userId).single();
    const { data: provider } = await supabaseService.from('providers').select('*').eq('profile_id', userId).single();
    
    console.log(`  Profile: ${profile ? '✅ Created' : '❌ Missing'}`);
    if (profile) {
      console.log(`    Role: ${profile.role}, Name: ${profile.first_name} ${profile.last_name}`);
    }
    
    console.log(`  Provider: ${provider ? '✅ Created' : '❌ Missing'}`);
    if (provider) {
      const { data: schedules } = await supabaseService
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', provider.id);
      console.log(`    Schedules: ${schedules?.length || 0}`);
    }

    // 7. Check final counts
    console.log('\n📊 Final state check...');
    const { data: finalUsers } = await supabaseService.rpc('sql', {
      query: 'SELECT COUNT(*) as count FROM auth.users'
    });
    const { data: finalProfiles } = await supabaseService.from('profiles').select('id', { count: 'exact', head: true });
    
    console.log(`  Auth users: ${finalUsers?.[0]?.count || 'unknown'} (was ${initialUsers?.[0]?.count || 'unknown'})`);
    console.log(`  Profiles: ${finalProfiles?.count || 0} (was ${initialProfiles?.count || 0})`);

    // 8. Manual trigger test
    console.log('\n🔧 Testing if we can manually fire trigger...');
    try {
      const { error: manualError } = await supabaseService.rpc('sql', {
        query: `SELECT public.handle_new_user() FROM auth.users WHERE id = '${userId}' LIMIT 1`
      });
      
      if (manualError) {
        console.log('❌ Manual trigger test failed:', manualError.message);
      } else {
        console.log('✅ Manual trigger test succeeded');
        
        // Check again after manual trigger
        await new Promise(resolve => setTimeout(resolve, 1000));
        const { data: profileAfter } = await supabaseService.from('profiles').select('*').eq('id', userId).single();
        console.log(`  Profile after manual trigger: ${profileAfter ? '✅ Created' : '❌ Still missing'}`);
      }
    } catch (error) {
      console.log('❌ Manual trigger error:', error.message);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabaseService.from('provider_schedules').delete().eq('provider_id', provider?.id || '');
    await supabaseService.from('providers').delete().eq('profile_id', userId);
    await supabaseService.from('profiles').delete().eq('id', userId);
    await supabaseService.from('auth_trigger_logs').delete().eq('user_id', userId);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('💥 Error in debug:', error);
  }
}

debugSignupIssue();