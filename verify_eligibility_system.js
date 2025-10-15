import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyEligibilitySystem() {
  console.log('🔍 Verifying eligibility system tables...\n')
  
  const tables = [
    'treatment_types',
    'eligibility_questions', 
    'treatment_eligibility_questions',
    'patient_eligibility_submissions',
    'patient_eligibility_responses',
    'eligibility_rules'
  ]
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`)
      } else {
        console.log(`✅ Table '${table}': Found`)
        
        // Get count for each table
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        console.log(`   📊 Records: ${count || 0}`)
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`)
    }
  }
  
  // Check specific sample data
  console.log('\n🔍 Checking sample data...')
  
  try {
    const { data: treatments } = await supabase
      .from('treatment_types')
      .select('name, display_name')
    
    if (treatments && treatments.length > 0) {
      console.log('✅ Treatment types found:')
      treatments.forEach(t => console.log(`   - ${t.display_name} (${t.name})`))
    }
  } catch (err) {
    console.log('❌ Error checking treatment types:', err.message)
  }
  
  try {
    const { data: questions } = await supabase
      .from('eligibility_questions')
      .select('question_key, question_text')
      .limit(3)
    
    if (questions && questions.length > 0) {
      console.log('\n✅ Sample eligibility questions found:')
      questions.forEach(q => console.log(`   - ${q.question_key}: ${q.question_text.substring(0, 50)}...`))
    }
  } catch (err) {
    console.log('❌ Error checking eligibility questions:', err.message)
  }
}

verifyEligibilitySystem().then(() => {
  console.log('\n🎉 Verification complete!')
  process.exit(0)
}).catch(err => {
  console.error('❌ Verification failed:', err.message)
  process.exit(1)
})