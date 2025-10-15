// Manually test the provider trigger by inserting a provider record
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hwl7L9UNtJ2MWZiUY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTriggerManually() {
  console.log('🧪 Testing provider schedule trigger manually...\n');

  try {
    // Step 1: Create a test profile first
    console.log('1. Creating test profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        email: `test.trigger.${Date.now()}@example.com`,
        role: 'provider',
        first_name: 'Trigger',
        last_name: 'Test'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return;
    }

    console.log('✅ Profile created:', profile.id);

    // Step 2: Check initial schedule count
    const { data: initialSchedules } = await supabase
      .from('provider_schedules')
      .select('*');
    console.log(`📅 Initial schedule count: ${initialSchedules?.length || 0}`);

    // Step 3: Insert provider record directly (this should trigger the schedule creation)
    console.log('\n2. Creating provider record (should trigger schedule creation)...');
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .insert({
        profile_id: profile.id,
        specialty: 'Internal Medicine',
        license_number: 'TEST123',
        years_of_experience: 5
      })
      .select()
      .single();

    if (providerError) {
      console.error('❌ Error creating provider:', providerError);
      return;
    }

    console.log('✅ Provider created:', provider.id);

    // Step 4: Wait a moment for trigger
    console.log('⏳ Waiting 2 seconds for trigger...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Check if schedules were created
    console.log('\n3. Checking for created schedules...');
    const { data: schedules, error: scheduleError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', provider.id);

    if (scheduleError) {
      console.error('❌ Error fetching schedules:', scheduleError);
    } else {
      console.log(`📅 Found ${schedules?.length || 0} schedule entries for provider ${provider.id}`);
      
      if (schedules && schedules.length > 0) {
        console.log('✅ SUCCESS: Provider schedule trigger is working!');
        schedules.forEach(schedule => {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          console.log(`  ${days[schedule.day_of_week]}: ${schedule.start_time} - ${schedule.end_time}`);
        });
      } else {
        console.log('❌ FAILURE: Trigger did not create schedules');
        
        // Try to check if the trigger function exists and is active
        console.log('\n4. Debugging trigger state...');
        const { data: triggerInfo, error: triggerError } = await supabase
          .rpc('exec_sql', { 
            sql: `
              SELECT 
                t.tgname as trigger_name,
                t.tgenabled as enabled,
                p.proname as function_name
              FROM pg_trigger t
              JOIN pg_proc p ON t.tgfoid = p.oid
              WHERE t.tgname = 'on_provider_created'
            ` 
          });

        if (!triggerError && triggerInfo) {
          console.log('🔧 Trigger info:', triggerInfo);
        }
      }
    }

    // Step 6: Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase.from('provider_schedules').delete().eq('provider_id', provider.id);
    await supabase.from('providers').delete().eq('id', provider.id);
    await supabase.from('profiles').delete().eq('id', profile.id);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('💥 Error in test:', error);
  }
}

testTriggerManually();