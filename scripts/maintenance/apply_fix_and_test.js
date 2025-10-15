const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection with service role
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function applyFixAndTest() {
  try {
    console.log('Applying RPC function fix...');
    
    // First, let's try to drop and recreate the function
    const functionSQL = `
-- Drop and recreate the function with correct logic
DROP FUNCTION IF EXISTS get_assigned_patients_for_provider(UUID);

CREATE OR REPLACE FUNCTION get_assigned_patients_for_provider(provider_profile_id UUID)
RETURNS TABLE (
  patient_id UUID,
  profile_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  treatment_type TEXT,
  assigned_date DATE,
  is_primary BOOLEAN,
  has_completed_intake BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as patient_id,
    p.profile_id,
    prof.first_name,
    prof.last_name,
    prof.email,
    p.phone,
    p.date_of_birth,
    pa.treatment_type,
    pa.assigned_date,
    pa.is_primary,
    p.has_completed_intake,
    p.created_at
  FROM patients p
  INNER JOIN profiles prof ON p.profile_id = prof.id
  INNER JOIN patient_assignments pa ON p.id = pa.patient_id
  INNER JOIN providers prov ON pa.provider_id = prov.id
  WHERE prov.profile_id = provider_profile_id
  AND pa.active = true
  ORDER BY pa.assigned_date DESC, prof.first_name, prof.last_name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_assigned_patients_for_provider(UUID) TO authenticated;
    `;

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: functionSQL });
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      // Try a simpler approach without the exec_sql function
      console.log('Trying manual approach...');
    } else {
      console.log('SQL executed successfully');
    }

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
    
    console.log('Testing with specialty provider:', specialtyProvider.profile_id);

    // Test the fixed RPC function
    console.log('\n=== TESTING FIXED RPC FUNCTION ===');
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_assigned_patients_for_provider', { 
        provider_profile_id: specialtyProvider.profile_id 
      });
    
    if (rpcError) {
      console.error('RPC function error:', rpcError);
    } else {
      console.log('RPC function SUCCESS! Results:', rpcResult);
    }

    console.log('\n✅ If you see results above, the specialty provider should now see patients in their table!');
    console.log('Go to http://localhost:4455/ and log in as a provider to test.');

  } catch (error) {
    console.error('Script error:', error);
  }
}

applyFixAndTest();