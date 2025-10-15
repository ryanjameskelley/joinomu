// Check what medication data is being loaded for the patient
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkPatientMedicationData() {
  try {
    const patientAuthId = 'e2b62e92-840b-4db4-8e37-7f2208b1ac23';
    
    // Get patient ID from profile
    const { data: patientData } = await supabase
      .from('patients')
      .select('id')
      .eq('profile_id', patientAuthId)
      .single();
    
    if (!patientData) {
      console.error('❌ Patient not found');
      return;
    }
    
    console.log('🔍 Patient ID:', patientData.id);
    
    // Get all medication preferences for this patient (this is likely what the frontend loads)
    const { data: preferences, error } = await supabase
      .from('patient_medication_preferences')
      .select(`
        *,
        medications (
          id,
          name,
          brand_name
        )
      `)
      .eq('patient_id', patientData.id);
    
    if (error) {
      console.error('❌ Error loading preferences:', error);
      return;
    }
    
    console.log('\n📋 All medication preferences for patient:');
    console.log(`Found ${preferences?.length || 0} preferences`);
    
    preferences?.forEach((pref, index) => {
      console.log(`\n${index + 1}. Preference ID: ${pref.id}`);
      console.log(`   Medication: ${pref.medications?.name} (${pref.preferred_dosage})`);
      console.log(`   Status: ${pref.status}`);
      console.log(`   Next due: ${pref.next_prescription_due}`);
      console.log(`   Refill requested: ${pref.refill_requested}`);
      
      // Check if this specific preference should show refill button
      if (pref.next_prescription_due) {
        const today = new Date();
        const dueDate = new Date(pref.next_prescription_due);
        const daysDifference = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        const shouldShow = pref.status === 'approved' && 
                          pref.next_prescription_due && 
                          pref.status !== 'pending' && 
                          daysDifference <= 3;
        
        console.log(`   Should show refill: ${shouldShow ? '✅ YES' : '❌ NO'} (${daysDifference} days until due)`);
      } else {
        console.log(`   Should show refill: ❌ NO (no due date)`);
      }
    });
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkPatientMedicationData();