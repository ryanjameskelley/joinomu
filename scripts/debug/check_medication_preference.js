// Check specific medication preference 8c777711-5d0a-4e42-b395-425fe0c26464
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkMedicationPreference() {
  try {
    const preferenceId = '8c777711-5d0a-4e42-b395-425fe0c26464';
    
    console.log('🔍 Checking medication preference:', preferenceId);
    
    // Get the specific preference
    const { data: preference, error } = await supabase
      .from('patient_medication_preferences')
      .select('*')
      .eq('id', preferenceId)
      .single();
    
    if (error) {
      console.error('❌ Error fetching preference:', error);
      return;
    }
    
    if (!preference) {
      console.error('❌ Preference not found');
      return;
    }
    
    console.log('📋 Preference data:', preference);
    
    // Check refill button criteria
    console.log('\n🔍 Refill button criteria check:');
    console.log(`   Status: ${preference.status} (should be "approved")`);
    console.log(`   Next due: ${preference.next_prescription_due} (should exist)`);
    
    if (preference.next_prescription_due) {
      const today = new Date();
      const dueDate = new Date(preference.next_prescription_due);
      const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      console.log(`   Days until due: ${daysDifference} (should be <= 3)`);
      console.log(`   Today: ${today.toDateString()}`);
      console.log(`   Due date: ${dueDate.toDateString()}`);
      
      const shouldShow = preference.status === 'approved' && 
                        preference.next_prescription_due && 
                        preference.status !== 'pending' && 
                        daysDifference <= 3;
      
      console.log(`\n🎯 Should show refill button: ${shouldShow ? '✅ YES' : '❌ NO'}`);
      
      if (!shouldShow) {
        console.log('\n❓ Reasons button not showing:');
        if (preference.status !== 'approved') console.log('   - Status is not approved');
        if (!preference.next_prescription_due) console.log('   - No next prescription due date');
        if (preference.status === 'pending') console.log('   - Status is pending');
        if (daysDifference > 3) console.log(`   - Due date is too far away (${daysDifference} days)`);
      }
    } else {
      console.log('   Next due: NOT SET');
      console.log('\n❌ No due date set - button will not show');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkMedicationPreference();