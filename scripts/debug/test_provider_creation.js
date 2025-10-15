// Test provider creation and schedule auto-generation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hwl7L9UNtJ2MWZiUY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProviderCreation() {
  console.log('🧪 Testing provider creation and schedule auto-generation...\n');

  try {
    // 1. Create a test profile first
    const testEmail = `test.provider.${Date.now()}@example.com`;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        email: testEmail,
        role: 'provider',
        first_name: 'Test',
        last_name: 'Provider'
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return;
    }

    console.log('✅ Created profile:', profile.id);

    // 2. Create provider record (this should trigger schedule creation)
    console.log('📋 Creating provider record...');
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .insert({
        profile_id: profile.id,
        specialty: 'Internal Medicine',
        license_number: 'TEST123456',
        years_of_experience: 5
      })
      .select()
      .single();

    if (providerError) {
      console.error('❌ Error creating provider:', providerError);
      return;
    }

    console.log('✅ Created provider:', provider.id);

    // 3. Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Check if schedules were created
    console.log('📅 Checking for auto-created schedules...');
    const { data: schedules, error: scheduleError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', provider.id);

    if (scheduleError) {
      console.error('❌ Error fetching schedules:', scheduleError);
      return;
    }

    console.log(`📊 Found ${schedules.length} schedule entries for provider ${provider.id}`);
    
    if (schedules.length > 0) {
      console.log('✅ SUCCESS: Provider schedules were auto-created!');
      schedules.forEach(schedule => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        console.log(`  ${days[schedule.day_of_week]}: ${schedule.start_time} - ${schedule.end_time}`);
      });
    } else {
      console.log('❌ FAILURE: No schedules were created - trigger is not working');
    }

    // 5. Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('provider_schedules').delete().eq('provider_id', provider.id);
    await supabase.from('providers').delete().eq('id', provider.id);
    await supabase.from('profiles').delete().eq('id', profile.id);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('💥 Error in test:', error);
  }
}

testProviderCreation();