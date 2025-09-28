// Check if there are new providers without schedules
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hwl7L9UNtJ2MWZiUY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNewProviders() {
  console.log('🔍 Checking for new providers without schedules...\n');

  try {
    // Get all providers
    const { data: providers, error: providerError } = await supabase
      .from('providers')
      .select('id, profile_id, created_at')
      .order('created_at', { ascending: false });
    
    if (providerError) {
      console.error('Error fetching providers:', providerError);
      return;
    }
    
    console.log(`📋 Found ${providers.length} providers total:`);
    providers.forEach((p, i) => {
      console.log(`  ${i+1}. ID: ${p.id.slice(0, 8)}... Created: ${p.created_at}`);
    });

    // Get provider schedules directly using service role to bypass RLS
    const { data: schedules, error: scheduleError } = await supabase
      .from('provider_schedules')
      .select('provider_id')
      .order('created_at', { ascending: false });
      
    if (scheduleError) {
      console.error('Error fetching schedules:', scheduleError);
      return;
    }
    
    console.log(`\n📅 Found ${schedules.length} schedule entries:`);
    const providersWithSchedules = [...new Set(schedules.map(s => s.provider_id))];
    console.log(`📊 ${providersWithSchedules.length} distinct providers have schedules`);
    
    // Find providers without schedules
    const providersWithoutSchedules = providers.filter(p => 
      !providersWithSchedules.includes(p.id)
    );
    
    console.log(`\n❌ ${providersWithoutSchedules.length} providers WITHOUT schedules:`);
    providersWithoutSchedules.forEach((p, i) => {
      console.log(`  ${i+1}. ID: ${p.id.slice(0, 8)}... Created: ${p.created_at}`);
    });

    if (providersWithoutSchedules.length > 0) {
      console.log('\n🔧 These providers need schedules created!');
      return providersWithoutSchedules;
    } else {
      console.log('\n✅ All providers have schedules!');
      return [];
    }

  } catch (error) {
    console.error('Error in check:', error);
  }
}

checkNewProviders();