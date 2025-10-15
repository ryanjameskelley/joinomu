// Manually restore medication preferences from backup data
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function restoreMedicationPreferences() {
  try {
    console.log('🔄 Restoring medication preferences from backup...');
    
    // Get current patients to map profile_ids
    const { data: currentPatients } = await supabase
      .from('patients')
      .select('id, profile_id');
    
    console.log('Current patients:', currentPatients);
    
    // Get available medications
    const { data: medications } = await supabase
      .from('medications')
      .select('id, name');
    
    console.log('Available medications:', medications);
    
    if (!currentPatients || currentPatients.length === 0) {
      console.log('❌ No patients found in current database');
      return;
    }
    
    if (!medications || medications.length === 0) {
      console.log('❌ No medications found in current database');
      return;
    }
    
    // Find a patient that matches one from the backup data (we can use the assigned patient)
    const targetPatient = currentPatients.find(p => p.profile_id === 'e2b62e92-840b-4db4-8e37-7f2208b1ac23');
    
    if (!targetPatient) {
      console.log('❌ Target patient not found');
      return;
    }
    
    console.log('✅ Target patient found:', targetPatient);
    
    // Create a sample medication preference with next_prescription_due set for testing
    const samplePreference = {
      id: '8c777711-5d0a-4e42-b395-425fe0c26464', // Use the ID you were testing with
      patient_id: targetPatient.id,
      medication_id: medications[0].id, // Use first available medication
      preferred_dosage: '0.5mg',
      frequency: 'weekly',
      notes: 'Restored from backup for refill testing',
      status: 'approved',
      requested_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      next_prescription_due: '2025-10-02', // Set to today for refill testing
      supply_days: 30,
      refill_requested: false
    };
    
    console.log('🔄 Creating medication preference...');
    
    const { data: createdPreference, error: preferenceError } = await supabase
      .from('patient_medication_preferences')
      .insert(samplePreference)
      .select()
      .single();
    
    if (preferenceError) {
      console.error('❌ Error creating preference:', preferenceError);
      return;
    }
    
    console.log('✅ Medication preference restored:');
    console.log(`   ID: ${createdPreference.id}`);
    console.log(`   Patient: ${targetPatient.profile_id}`);
    console.log(`   Medication: ${medications[0].name}`);
    console.log(`   Status: ${createdPreference.status}`);
    console.log(`   Next due: ${createdPreference.next_prescription_due}`);
    console.log(`   Should show refill button: YES (due today)`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

restoreMedicationPreferences();