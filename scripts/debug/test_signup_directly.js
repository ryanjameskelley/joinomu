// Test signup directly to see what happens
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignupDirectly() {
  console.log('🧪 Testing signup directly (simulating frontend)...\n');

  const testEmail = `directtest.${Date.now()}@example.com`;
  
  try {
    console.log('🔐 Attempting signup with anon client...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'password123',
      options: {
        data: {
          role: 'provider',
          firstName: 'Direct',
          lastName: 'Test',
          specialty: 'Internal Medicine',
          licenseNumber: 'DIRECT123'
        }
      }
    });

    if (error) {
      console.error('❌ Signup error:', error);
      return;
    }

    console.log('✅ Signup response received:');
    console.log('  User ID:', data.user?.id);
    console.log('  Email confirmed:', data.user?.email_confirmed_at !== null);
    console.log('  Session exists:', !!data.session);

    // Wait for auth trigger to execute
    console.log('\n⏳ Waiting 5 seconds for auth trigger...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check what was created using service role to bypass RLS
    const supabaseService = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hwl7L9UNtJ2MWZiUY');
    
    console.log('📊 Checking what was created...');
    
    const { data: profiles } = await supabaseService.from('profiles').select('*').eq('id', data.user?.id);
    const { data: providers } = await supabaseService.from('providers').select('*').eq('profile_id', data.user?.id);
    
    console.log(`  Profiles: ${profiles?.length || 0}`);
    if (profiles && profiles.length > 0) {
      console.log(`    Role: ${profiles[0].role}, Name: ${profiles[0].first_name} ${profiles[0].last_name}`);
      
      const { data: schedules } = await supabaseService.from('provider_schedules').select('*')
        .in('provider_id', providers?.map(p => p.id) || []);
      
      console.log(`  Providers: ${providers?.length || 0}`);
      if (providers && providers.length > 0) {
        console.log(`    Provider ID: ${providers[0].id}, Specialty: ${providers[0].specialty}`);
      }
      
      console.log(`  Schedules: ${schedules?.length || 0}`);
      if (schedules && schedules.length > 0) {
        schedules.forEach(schedule => {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          console.log(`    ${days[schedule.day_of_week]}: ${schedule.start_time} - ${schedule.end_time}`);
        });
      }
    } else {
      console.log('❌ No profile created - auth trigger may not be firing');
    }

    // Test signin to see if it works
    console.log('\n🔑 Testing signin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'password123'
    });

    if (signInError) {
      console.error('❌ Signin error:', signInError);
    } else {
      console.log('✅ Signin successful');
      console.log('  User ID:', signInData.user?.id);
      console.log('  Session exists:', !!signInData.session);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabaseService.from('provider_schedules').delete().in('provider_id', providers?.map(p => p.id) || []);
    await supabaseService.from('providers').delete().eq('profile_id', data.user?.id);
    await supabaseService.from('profiles').delete().eq('id', data.user?.id);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('💥 Error in test:', error);
  }
}

testSignupDirectly();