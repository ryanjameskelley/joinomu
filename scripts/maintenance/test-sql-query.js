// Test the SQL query that the function uses
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSQLQuery() {
  console.log('🔍 Testing SQL Query directly')
  console.log('============================')

  const providerProfileId = '5edc937b-66d3-4aa4-9e16-166c17b86c56'

  // Test the exact SQL from the function
  const query = `
    SELECT 
      p.id as patient_id,
      p.profile_id,
      prof.first_name,
      prof.last_name,
      prof.email,
      p.phone,
      p.date_of_birth,
      pa.treatment_type,
      pa.assigned_date::DATE,
      pa.is_primary,
      p.has_completed_intake,
      p.created_at
    FROM patients p
    INNER JOIN profiles prof ON p.profile_id = prof.id
    INNER JOIN patient_assignments pa ON p.id = pa.patient_id
    INNER JOIN providers prov ON pa.provider_id = prov.id
    WHERE prov.profile_id = $1
    ORDER BY pa.assigned_date DESC, prof.first_name, prof.last_name
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: query,
      params: [providerProfileId]
    })

    if (error) {
      console.log('❌ SQL Error:', error)
      
      // Let's try without the RPC and test piece by piece
      console.log('\n🔧 Testing piece by piece...')
      
      // Step 1: Basic patient-profile join
      console.log('\n1️⃣ Patients with profiles:')
      const { data: patientsWithProfiles } = await supabase
        .from('patients')
        .select(`
          id,
          profile_id,
          profiles!patients_profile_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
      console.log('Result:', patientsWithProfiles)

      // Step 2: Add assignments
      console.log('\n2️⃣ Patients with assignments:')
      const { data: patientsWithAssignments } = await supabase
        .from('patients')
        .select(`
          id,
          profile_id,
          profiles!patients_profile_id_fkey (
            first_name,
            last_name,
            email
          ),
          patient_assignments!patient_assignments_patient_id_fkey (
            treatment_type,
            assigned_date,
            is_primary,
            provider_id
          )
        `)
      console.log('Result:', patientsWithAssignments)

      // Step 3: Add provider filtering
      console.log('\n3️⃣ Filtering by provider:')
      const { data: filteredResult, error: filterError } = await supabase
        .from('patient_assignments')
        .select(`
          treatment_type,
          assigned_date,
          is_primary,
          patients!patient_assignments_patient_id_fkey (
            id,
            profile_id,
            phone,
            date_of_birth,
            has_completed_intake,
            created_at,
            profiles!patients_profile_id_fkey (
              first_name,
              last_name,
              email
            )
          ),
          providers!patient_assignments_provider_id_fkey (
            profile_id
          )
        `)
        .eq('providers.profile_id', providerProfileId)

      if (filterError) {
        console.log('❌ Filter error:', filterError)
      } else {
        console.log('✅ Filtered result:', filteredResult)
      }

    } else {
      console.log('✅ SQL Result:', data)
    }
  } catch (error) {
    console.log('💥 Exception:', error)
  }
}

testSQLQuery().catch(console.error)