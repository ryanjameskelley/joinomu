const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function fixSpecialtyProviderAssignments() {
  try {
    console.log('Fixing specialty provider assignments...');
    
    // Check all current assignments
    console.log('\n=== CURRENT ASSIGNMENTS ===');
    const { data: allAssignments, error: assignError } = await supabase
      .from('patient_assignments')
      .select('*');
    
    if (assignError) {
      console.error('Error getting assignments:', assignError);
      return;
    }
    
    console.log('All current assignments:', allAssignments);

    // Get the specialty provider
    const { data: specialtyProvider, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('specialty', 'specialty')
      .single();
    
    if (providerError) {
      console.error('Provider error:', providerError);
      return;
    }
    
    console.log('\nSpecialty provider:', specialtyProvider);

    // Get all patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(3);
    
    if (patientsError) {
      console.error('Patients error:', patientsError);
      return;
    }
    
    console.log('\nAvailable patients:', patients);

    // Clear existing assignments for specialty provider
    const { error: deleteError } = await supabase
      .from('patient_assignments')
      .delete()
      .eq('provider_id', specialtyProvider.id);
    
    if (deleteError) {
      console.error('Error clearing assignments:', deleteError);
    } else {
      console.log('Cleared existing assignments for specialty provider');
    }

    // Assign first 2 patients to specialty provider
    const newAssignments = patients.slice(0, 2).map(patient => ({
      provider_id: specialtyProvider.id,
      patient_id: patient.id,
      assigned_date: new Date().toISOString().split('T')[0],
      treatment_type: 'general_care',
      is_primary: true
    }));

    console.log('\nCreating new assignments:', newAssignments);

    const { data: insertData, error: insertError } = await supabase
      .from('patient_assignments')
      .insert(newAssignments)
      .select();

    if (insertError) {
      console.error('Error creating assignments:', insertError);
      return;
    }

    console.log('Successfully created assignments:', insertData);

    // Verify the RPC function now works
    console.log('\n=== TESTING RPC FUNCTION ===');
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_assigned_patients_for_provider', { 
        provider_profile_id: specialtyProvider.profile_id 
      });
    
    if (rpcError) {
      console.error('RPC function error:', rpcError);
    } else {
      console.log('RPC function result:', rpcResult);
    }

    console.log('\n✅ Specialty provider should now have patients in their table!');
    console.log('Provider profile ID:', specialtyProvider.profile_id);
    console.log('Test by logging in as this provider in the app.');

  } catch (error) {
    console.error('Script error:', error);
  }
}

fixSpecialtyProviderAssignments();