// Check what assignment tables exist in the database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkAssignmentTables() {
  console.log('🔍 Checking assignment tables in database...\n');

  try {
    // Get all tables in public schema
    const { data: tables, error: tablesError } = await supabase.rpc('sql', {
      query: `
        SELECT table_name, table_type 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '%assignment%' OR table_name LIKE '%patient%' OR table_name LIKE '%provider%')
        ORDER BY table_name
      `
    });

    if (tablesError) {
      console.error('❌ Error getting tables:', tablesError);
      return;
    }

    console.log('📋 Assignment-related tables:');
    if (tables && tables.length > 0) {
      tables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
    } else {
      console.log('  No assignment tables found');
    }

    // Check if patient_assignments table exists and its structure
    console.log('\n🔍 Checking patient_assignments table structure...');
    const { data: patientAssignments, error: paError } = await supabase
      .from('patient_assignments')
      .select('*')
      .limit(1);

    if (paError) {
      console.log('❌ patient_assignments table error:', paError.message);
    } else {
      console.log('✅ patient_assignments table exists');
      
      // Get column structure
      const { data: columns } = await supabase.rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'patient_assignments'
          ORDER BY ordinal_position
        `
      });

      if (columns) {
        console.log('  Columns:');
        columns.forEach(col => {
          console.log(`    - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
        });
      }

      // Check existing assignments
      const { data: existingAssignments } = await supabase
        .from('patient_assignments')
        .select('*');
      
      console.log(`  Current assignments: ${existingAssignments?.length || 0}`);
    }

    // Also check providers and patients tables for the IDs
    console.log('\n👨‍⚕️ Checking provider ID...');
    const providerId = '1a3803f0-fe96-4649-8e2a-0e06a64c94c1';
    const { data: provider } = await supabase
      .from('providers')
      .select('id, profile_id, specialty')
      .eq('id', providerId)
      .single();

    if (provider) {
      console.log(`✅ Provider found: ID ${provider.id}, Profile ${provider.profile_id}, Specialty: ${provider.specialty}`);
    } else {
      console.log('❌ Provider not found with that ID');
    }

    console.log('\n🏥 Checking patient ID...');
    const patientId = 'fee32dc6-49b5-49a4-a245-8f5ee70b4613';
    const { data: patient } = await supabase
      .from('patients')
      .select('id, profile_id')
      .eq('id', patientId)
      .single();

    if (patient) {
      console.log(`✅ Patient found: ID ${patient.id}, Profile ${patient.profile_id}`);
    } else {
      console.log('❌ Patient not found with that ID');
    }

  } catch (error) {
    console.error('💥 Error checking tables:', error);
  }
}

checkAssignmentTables();