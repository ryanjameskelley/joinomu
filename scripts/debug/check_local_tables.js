const { createClient } = require('@supabase/supabase-js');

// Local Supabase connection
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkLocalTables() {
  try {
    console.log('Checking local database structure...');
    
    // Check providers table structure
    console.log('\n=== PROVIDERS TABLE ===');
    const { data: providers, error: providersError } = await supabase
      .from('providers')
      .select('*')
      .limit(5);

    if (providersError) {
      console.error('Providers table error:', providersError);
      
      // Try alternative column names
      console.log('Trying with different column names...');
      const { data: providers2, error: providersError2 } = await supabase
        .from('providers')
        .select('id, profile_id, first_name, last_name')
        .limit(5);
        
      if (providersError2) {
        console.error('Still error with providers:', providersError2);
      } else {
        console.log('Providers found:', providers2);
      }
    } else {
      console.log('Providers found:', providers);
    }

    // Check patients table structure
    console.log('\n=== PATIENTS TABLE ===');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(5);

    if (patientsError) {
      console.error('Patients table error:', patientsError);
      
      // Try alternative column names
      console.log('Trying with different column names...');
      const { data: patients2, error: patientsError2 } = await supabase
        .from('patients')
        .select('id, profile_id, first_name, last_name')
        .limit(5);
        
      if (patientsError2) {
        console.error('Still error with patients:', patientsError2);
      } else {
        console.log('Patients found:', patients2);
      }
    } else {
      console.log('Patients found:', patients);
    }

    // Check assignments table
    console.log('\n=== ASSIGNMENTS TABLE ===');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('patient_provider_assignments')
      .select('*')
      .limit(5);

    if (assignmentsError) {
      console.error('Assignments table error:', assignmentsError);
    } else {
      console.log('Assignments found:', assignments);
    }

    // List all tables
    console.log('\n=== ALL TABLES ===');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');

    if (tablesError) {
      console.error('Error getting table names:', tablesError);
    } else {
      console.log('Tables:', tables);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkLocalTables();