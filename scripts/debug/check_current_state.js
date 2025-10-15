// Check current database state to see if provider records are being created
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hwl7L9UNtJ2MWZiUY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentState() {
  console.log('📊 Current database state:\n');

  try {
    // Check all tables
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: providers } = await supabase.from('providers').select('*');
    const { data: schedules } = await supabase.from('provider_schedules').select('*');

    console.log(`Profiles: ${profiles?.length || 0}`);
    if (profiles && profiles.length > 0) {
      profiles.forEach((profile, i) => {
        console.log(`  ${i+1}. ${profile.email} (${profile.role}) - Created: ${profile.created_at}`);
      });
    }

    console.log(`\nProviders: ${providers?.length || 0}`);
    if (providers && providers.length > 0) {
      providers.forEach((provider, i) => {
        console.log(`  ${i+1}. ID: ${provider.id.slice(0, 8)}... Profile: ${provider.profile_id.slice(0, 8)}... - Created: ${provider.created_at}`);
      });
    }

    console.log(`\nProvider Schedules: ${schedules?.length || 0}`);
    if (schedules && schedules.length > 0) {
      schedules.forEach((schedule, i) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        console.log(`  ${i+1}. Provider: ${schedule.provider_id.slice(0, 8)}... ${days[schedule.day_of_week]}: ${schedule.start_time}-${schedule.end_time}`);
      });
    }

    // Check for any recent signups
    if (profiles && profiles.length > 0) {
      const recent = profiles.filter(p => new Date(p.created_at) > new Date(Date.now() - 10 * 60 * 1000)); // last 10 minutes
      console.log(`\nRecent signups (last 10 min): ${recent.length}`);
      recent.forEach(profile => {
        console.log(`  ${profile.email} (${profile.role}) - ${profile.created_at}`);
      });
    }

  } catch (error) {
    console.error('Error checking state:', error);
  }
}

checkCurrentState();