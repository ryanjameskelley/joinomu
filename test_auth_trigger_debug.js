// Test auth trigger directly by checking if it works with admin client
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hwl7L9UNtJ2MWZiUY';

async function testAuthTrigger() {
  console.log('🧪 Testing auth trigger...\n');

  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

  const testEmail = `testauth.${Date.now()}@example.com`;
  
  try {
    // Check initial state
    console.log('📊 Initial state check with service role...');
    const { data: initialProfiles } = await supabaseService.from('profiles').select('*');
    const { data: initialProviders } = await supabaseService.from('providers').select('*');
    const { data: initialSchedules } = await supabaseService.from('provider_schedules').select('*');
    
    console.log(`  Profiles: ${initialProfiles?.length || 0}`);
    console.log(`  Providers: ${initialProviders?.length || 0}`);
    console.log(`  Schedules: ${initialSchedules?.length || 0}\n`);

    // Test auth signup using anon client (simulates frontend)
    console.log('🔐 Testing auth signup with anon client...');
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'provider',
          first_name: 'Auth',
          last_name: 'Test',
          specialty: 'Internal Medicine',
          license_number: 'AUTH123'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup error:', authError);
      return;
    }

    console.log('✅ Auth signup successful:', authData.user?.id);
    console.log('   User email confirmed:', authData.user?.email_confirmed_at !== null);

    // Wait for trigger to execute
    console.log('⏳ Waiting 5 seconds for auth trigger...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check what was created using service role
    console.log('\n📊 Post-signup state check with service role...');
    
    // Check profiles
    const { data: profiles, error: profilesError } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('email', testEmail);
      
    if (profilesError) {
      console.error('❌ Error checking profiles:', profilesError);
    } else {
      console.log(`  Profiles found: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        console.log(`    Profile: ${profiles[0].id} - ${profiles[0].role}`);
        
        // Check providers
        const { data: providers, error: providersError } = await supabaseService
          .from('providers')
          .select('*')
          .eq('profile_id', profiles[0].id);
          
        if (providersError) {
          console.error('❌ Error checking providers:', providersError);
        } else {
          console.log(`  Providers found: ${providers?.length || 0}`);
          if (providers && providers.length > 0) {
            console.log(`    Provider: ${providers[0].id}`);
            
            // Check schedules
            const { data: schedules, error: schedulesError } = await supabaseService
              .from('provider_schedules')
              .select('*')
              .eq('provider_id', providers[0].id);
              
            if (schedulesError) {
              console.error('❌ Error checking schedules:', schedulesError);
            } else {
              console.log(`  Schedules found: ${schedules?.length || 0}`);
              if (schedules && schedules.length > 0) {
                console.log('✅ SUCCESS: Complete provider signup with schedules!');
                schedules.forEach(schedule => {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  console.log(`    ${days[schedule.day_of_week]}: ${schedule.start_time} - ${schedule.end_time}`);
                });
              } else {
                console.log('❌ PARTIAL: Provider created but no schedules');
              }
            }
          } else {
            console.log('❌ PARTIAL: Profile created but no provider record');
          }
        }
      } else {
        console.log('❌ FAILURE: No profile created by auth trigger');
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    if (authData.user?.id) {
      await supabaseService.from('provider_schedules').delete().eq('provider_id', authData.user.id);
      await supabaseService.from('providers').delete().eq('profile_id', authData.user.id);
      await supabaseService.from('profiles').delete().eq('id', authData.user.id);
    }
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('💥 Error in test:', error);
  }
}

testAuthTrigger();