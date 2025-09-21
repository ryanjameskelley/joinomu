import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://vvhqiheaaiswvzgvuvfp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2aHFpaGVhYWlzd3Z6Z3Z1dmZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQyMzM0OCwiZXhwIjoyMDUzMDAxMzQ4fQ.QX1EEI9dNLJA8q9LdlKaguzEjQ0C2E6gTH3_O0UHLb8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixTrigger() {
  try {
    console.log('🔧 Reading trigger fix SQL...')
    const sql = readFileSync('./fix_patient_trigger.sql', 'utf8')
    
    console.log('🚀 Executing trigger fix...')
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('❌ Error executing trigger fix:', error)
    } else {
      console.log('✅ Trigger fix executed successfully:', data)
    }
  } catch (err) {
    console.error('💥 Exception:', err)
  }
}

fixTrigger()