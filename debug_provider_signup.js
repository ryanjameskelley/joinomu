// Debug provider signup flow step by step
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hwl7L9UNtJ2MWZiUY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugProviderSignup() {
  console.log('🧪 Debugging provider signup flow...\n');

  const testEmail = `testprovider.${Date.now()}@example.com`;
  const testPassword = 'password123';

  try {
    // Step 1: Check initial state
    console.log('📊 Initial state:');
    const { data: initialProfiles } = await supabase.from('profiles').select('count').single();
    const { data: initialProviders } = await supabase.from('providers').select('count').single();
    const { data: initialSchedules } = await supabase.from('provider_schedules').select('count').single();
    console.log(`  Profiles: ${initialProfiles?.count || 0}`);
    console.log(`  Providers: ${initialProviders?.count || 0}`);
    console.log(`  Schedules: ${initialSchedules?.count || 0}\n`);

    // Step 2: Simulate signup (using the same flow as the frontend)
    console.log('🔐 Creating test provider account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          role: 'provider',
          first_name: 'Test',
          last_name: 'Provider',
          specialty: 'Internal Medicine',
          license_number: 'TEST123456'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth signup failed:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user?.id);

    // Step 3: Wait a moment for triggers to execute
    console.log('⏳ Waiting 3 seconds for triggers...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Check what was created
    console.log('\n📊 Post-signup state:');
    
    // Check if profile was created
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail);
    
    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
    } else {
      console.log(`  Profiles found: ${profiles?.length || 0}`);
      if (profiles && profiles.length > 0) {
        console.log(`  Profile role: ${profiles[0].role}`);
        console.log(`  Profile ID: ${profiles[0].id}`);

        // Check if provider record was created
        const { data: providers, error: providerError } = await supabase
          .from('providers')
          .select('*')
          .eq('profile_id', profiles[0].id);

        if (providerError) {
          console.error('❌ Error fetching providers:', providerError);
        } else {
          console.log(`  Provider records: ${providers?.length || 0}`);
          if (providers && providers.length > 0) {
            console.log(`  Provider ID: ${providers[0].id}`);

            // Check if schedules were created
            const { data: schedules, error: scheduleError } = await supabase
              .from('provider_schedules')
              .select('*')
              .eq('provider_id', providers[0].id);

            if (scheduleError) {
              console.error('❌ Error fetching schedules:', scheduleError);
            } else {
              console.log(`  Schedule records: ${schedules?.length || 0}`);
              if (schedules && schedules.length > 0) {
                console.log('✅ SUCCESS: Provider schedules were created!');
                schedules.forEach(schedule => {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  console.log(`    ${days[schedule.day_of_week]}: ${schedule.start_time} - ${schedule.end_time}`);
                });
              } else {
                console.log('❌ FAILURE: No schedules were created');
              }
            }
          } else {
            console.log('❌ FAILURE: No provider record was created');
          }
        }
      } else {
        console.log('❌ FAILURE: No profile was created');
      }
    }

    // Step 5: Test role detection
    if (authData.user?.id) {
      console.log('\n🔍 Testing role detection...');
      const { data: roleData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (roleError) {
        console.error('❌ Role detection failed:', roleError);
      } else {
        console.log(`✅ Role detected: ${roleData?.role}`);
      }
    }

    // Step 6: Cleanup
    console.log('\n🧹 Cleaning up...');
    if (authData.user?.id) {
      // Delete in reverse order due to foreign key constraints
      await supabase.from('provider_schedules').delete().eq('provider_id', authData.user.id);
      await supabase.from('providers').delete().eq('profile_id', authData.user.id);
      await supabase.from('profiles').delete().eq('id', authData.user.id);
      
      // Can't easily delete auth user with service key, so we'll leave it
      console.log('✅ Test data cleaned up (auth user remains)');
    }

  } catch (error) {
    console.error('💥 Error in debug:', error);
  }
}

debugProviderSignup();