import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndAddAllergiesColumn() {
  try {
    console.log('🔍 Checking if allergies column exists in patients table...')
    
    // Try to describe the patients table
    const { data, error } = await supabase.rpc('check_column_exists', {
      table_name: 'patients',
      column_name: 'allergies'
    })
    
    if (error) {
      console.log('❌ Error checking column (likely doesn\'t exist):', error.message)
      
      // Try to add the column
      console.log('🔄 Adding allergies column to patients table...')
      const { error: alterError } = await supabase.rpc('add_allergies_column')
      
      if (alterError) {
        console.log('❌ Error adding column, trying direct SQL...')
        
        // Use raw SQL to add the column
        const { error: sqlError } = await supabase.from('patients').select('allergies').limit(1)
        
        if (sqlError && sqlError.code === '42703') {
          console.log('✅ Confirmed allergies column does not exist')
          console.log('📝 You will need to create a migration to add the allergies column')
          console.log('Migration SQL:')
          console.log('ALTER TABLE patients ADD COLUMN allergies TEXT;')
        }
      } else {
        console.log('✅ Successfully added allergies column')
      }
    } else {
      console.log('✅ Allergies column already exists')
    }
    
    // Test a simple query to see current structure
    console.log('🔍 Testing patients table structure...')
    const { data: sampleData, error: queryError } = await supabase
      .from('patients')
      .select('id, profile_id, phone, date_of_birth')
      .limit(1)
    
    if (queryError) {
      console.log('❌ Error querying patients:', queryError)
    } else {
      console.log('✅ Successfully queried patients table')
      console.log('Sample record keys:', sampleData?.[0] ? Object.keys(sampleData[0]) : 'No records')
    }
    
  } catch (error) {
    console.error('❌ Exception:', error)
  }
}

checkAndAddAllergiesColumn()