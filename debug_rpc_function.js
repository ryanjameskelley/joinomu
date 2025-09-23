const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function debugRpcFunction() {
  try {
    console.log('Debugging RPC function...');
    
    // Get the specialty provider
    const { data: specialtyProvider, error: providerError } = await supabase
      .from('providers')
      .select('*')
      .eq('specialty', 'specialty')
      .single();
    
    console.log('Specialty provider:', specialtyProvider);

    // Test the join manually
    console.log('\n=== MANUAL JOIN TEST ===');
    const { data: joinResult, error: joinError } = await supabase
      .from('patients')
      .select(`
        id,
        profile_id,
        phone,
        patient_assignments!inner (
          provider_id,
          treatment_type,
          assigned_date
        )
      `)
      .eq('patient_assignments.provider_id', specialtyProvider.id);

    if (joinError) {
      console.error('Join error:', joinError);
    } else {
      console.log('Manual join result:', joinResult);
    }

    // Check if the issue is in the profiles join
    console.log('\n=== CHECKING PROFILES JOIN ===');
    const { data: profileJoin, error: profileError } = await supabase
      .from('patients')
      .select(`
        id,
        profile_id,
        profiles (
          id,
          email,
          first_name,
          last_name
        ),
        patient_assignments!inner (
          provider_id,
          treatment_type
        )
      `)
      .eq('patient_assignments.provider_id', specialtyProvider.id);

    if (profileError) {
      console.error('Profile join error:', profileError);
    } else {
      console.log('Profile join result:', profileJoin);
    }

    // Try a simpler version of the RPC function logic
    console.log('\n=== SIMPLER QUERY ===');
    const { data: simpleResult, error: simpleError } = await supabase
      .from('patient_assignments')
      .select(`
        *,
        patients (*),
        providers (*)
      `)
      .eq('provider_id', specialtyProvider.id);

    if (simpleError) {
      console.error('Simple query error:', simpleError);
    } else {
      console.log('Simple query result:', simpleResult);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

debugRpcFunction();