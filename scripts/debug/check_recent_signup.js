// Check the most recent signup and see what happened with schedules
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkRecentSignup() {
  console.log('🔍 Checking recent signup and provider schedules...\n');

  try {
    // 1. Find the most recent provider
    console.log('👨‍⚕️ Finding most recent provider...');
    const { data: recentProvider, error: providerError } = await supabase
      .from('providers')
      .select(`
        *,
        profiles!inner(*)
      `)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (providerError) {
      console.error('❌ Error finding provider:', providerError);
      return;
    }

    if (!recentProvider) {
      console.log('❌ No providers found');
      return;
    }

    console.log(`✅ Found provider: ${recentProvider.profiles.first_name} ${recentProvider.profiles.last_name}`);
    console.log(`   Provider ID: ${recentProvider.id}`);
    console.log(`   Profile ID: ${recentProvider.profile_id}`);
    console.log(`   Created: ${recentProvider.created_at}`);
    console.log(`   Specialty: ${recentProvider.specialty}`);

    // 2. Check their schedules
    console.log('\n📅 Checking provider schedules...');
    const { data: schedules, error: schedulesError } = await supabase
      .from('provider_schedules')
      .select('*')
      .eq('provider_id', recentProvider.id)
      .order('day_of_week');

    if (schedulesError) {
      console.error('❌ Error checking schedules:', schedulesError);
    } else {
      console.log(`📊 Found ${schedules?.length || 0} schedule entries`);
      
      if (schedules && schedules.length > 0) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        schedules.forEach(schedule => {
          console.log(`   ${days[schedule.day_of_week]}: ${schedule.start_time} - ${schedule.end_time} (${schedule.active ? 'Active' : 'Inactive'})`);
        });
      } else {
        console.log('❌ No schedules found for this provider');
      }
    }

    // 3. Check auth trigger logs for this user
    console.log('\n📋 Checking auth trigger logs...');
    const { data: logs, error: logsError } = await supabase
      .from('auth_trigger_logs')
      .select('*')
      .eq('user_id', recentProvider.profile_id)
      .order('created_at');

    if (logsError) {
      console.error('❌ Error checking logs:', logsError);
    } else if (logs && logs.length > 0) {
      console.log(`✅ Found ${logs.length} trigger log entries:`);
      logs.forEach((log, i) => {
        const status = log.success ? '✅' : '❌';
        console.log(`   ${i+1}. ${status} ${log.trigger_stage}`);
        if (log.error_message) {
          console.log(`      Error: ${log.error_message}`);
        }
        if (log.metadata) {
          console.log(`      Data: ${JSON.stringify(log.metadata)}`);
        }
      });
    } else {
      console.log('❌ No trigger logs found - auth trigger may not have fired');
    }

    // 4. Check if we can manually create schedules for this provider
    console.log('\n🔧 Testing manual schedule creation...');
    try {
      // First check if schedules already exist
      const { data: existingSchedules } = await supabase
        .from('provider_schedules')
        .select('*')
        .eq('provider_id', recentProvider.id);

      console.log(`   Existing schedules: ${existingSchedules?.length || 0}`);

      if (!existingSchedules || existingSchedules.length === 0) {
        console.log('   Creating missing schedules manually...');
        
        const schedulesToCreate = [
          { provider_id: recentProvider.id, day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00', active: true },
          { provider_id: recentProvider.id, day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00', active: true },
          { provider_id: recentProvider.id, day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00', active: true },
          { provider_id: recentProvider.id, day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00', active: true },
          { provider_id: recentProvider.id, day_of_week: 5, start_time: '09:00:00', end_time: '17:00:00', active: true }
        ];

        const { data: newSchedules, error: createError } = await supabase
          .from('provider_schedules')
          .insert(schedulesToCreate)
          .select();

        if (createError) {
          console.error('❌ Failed to create schedules manually:', createError);
        } else {
          console.log(`✅ Successfully created ${newSchedules?.length || 0} schedules manually`);
        }
      }
    } catch (error) {
      console.error('❌ Error in manual schedule creation:', error.message);
    }

    // 5. Check overall provider schedule statistics
    console.log('\n📊 Provider schedule statistics:');
    const { data: allProviders } = await supabase.from('providers').select('*');
    const { data: allSchedules } = await supabase.from('provider_schedules').select('*');
    
    console.log(`   Total providers: ${allProviders?.length || 0}`);
    console.log(`   Total schedules: ${allSchedules?.length || 0}`);
    
    if (allProviders && allProviders.length > 0) {
      let providersWithSchedules = 0;
      for (const provider of allProviders) {
        const { data: providerSchedules } = await supabase
          .from('provider_schedules')
          .select('*')
          .eq('provider_id', provider.id);
        
        if (providerSchedules && providerSchedules.length > 0) {
          providersWithSchedules++;
        }
      }
      console.log(`   Providers with schedules: ${providersWithSchedules}`);
      console.log(`   Providers missing schedules: ${allProviders.length - providersWithSchedules}`);
    }

  } catch (error) {
    console.error('💥 Error in recent signup check:', error);
  }
}

checkRecentSignup();