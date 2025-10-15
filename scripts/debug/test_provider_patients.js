const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function testProviderPatients() {
  try {
    console.log('Testing provider patient access...');
    
    // First, let's see the exact table structure
    console.log('\n=== CHECKING PROFILES TABLE ===');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3);
    
    if (profilesError) {
      console.error('Profiles error:', profilesError);
    } else {
      console.log('Sample profiles:', profiles);
    }

    // Get the provider with specialty "specialty"
    console.log('\n=== FINDING SPECIALTY PROVIDER ===');
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

    // Get assignments for this provider
    console.log('\n=== GETTING ASSIGNMENTS FOR SPECIALTY PROVIDER ===');
    const { data: assignments, error: assignError } = await supabase
      .from('patient_assignments')
      .select('*')
      .eq('provider_id', specialtyProvider.id);
    
    if (assignError) {
      console.error('Assignments error:', assignError);
      return;
    }
    
    console.log('Assignments for specialty provider:', assignments);

    // Get patients for those assignments
    if (assignments.length > 0) {
      console.log('\n=== GETTING PATIENT DETAILS ===');
      const patientIds = assignments.map(a => a.patient_id);
      
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .in('id', patientIds);
      
      if (patientsError) {
        console.error('Patients error:', patientsError);
      } else {
        console.log('Assigned patients:', patients);
        
        // Try to get profile info for these patients
        console.log('\n=== GETTING PATIENT PROFILE INFO ===');
        const profileIds = patients.map(p => p.profile_id);
        
        const { data: patientProfiles, error: patientProfilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', profileIds);
        
        if (patientProfilesError) {
          console.error('Patient profiles error:', patientProfilesError);
        } else {
          console.log('Patient profiles:', patientProfiles);
        }
      }
    }

    // Test the RPC function directly
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

  } catch (error) {
    console.error('Script error:', error);
  }
}

testProviderPatients();