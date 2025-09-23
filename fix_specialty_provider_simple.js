const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function assignPatientsToSpecialtyProvider() {
  try {
    console.log('Assigning patients to specialty provider...');
    
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
    
    console.log('Specialty provider:', specialtyProvider);

    // Get all patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*');
    
    if (patientsError) {
      console.error('Patients error:', patientsError);
      return;
    }
    
    console.log('Available patients:', patients.length);

    // Assign last 2 patients to specialty provider (as secondary care)
    const patientsToAssign = patients.slice(-2); // Take last 2 patients
    
    const newAssignments = patientsToAssign.map(patient => ({
      provider_id: specialtyProvider.id,
      patient_id: patient.id,
      assigned_date: new Date().toISOString().split('T')[0],
      treatment_type: 'specialty_care',
      is_primary: false // Make them secondary assignments
    }));

    console.log('Creating new specialty assignments:', newAssignments);

    const { data: insertData, error: insertError } = await supabase
      .from('patient_assignments')
      .insert(newAssignments)
      .select();

    if (insertError) {
      console.error('Error creating assignments:', insertError);
      return;
    }

    console.log('Successfully created assignments:', insertData);

    // Test the RPC function
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

    console.log('\n✅ Specialty provider should now have patients!');
    console.log('Provider profile ID:', specialtyProvider.profile_id);
    console.log('The provider with "specialty" specialty should now see patients in their table.');

  } catch (error) {
    console.error('Script error:', error);
  }
}

assignPatientsToSpecialtyProvider();