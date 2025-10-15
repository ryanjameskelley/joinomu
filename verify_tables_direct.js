const baseUrl = 'http://127.0.0.1:54321/rest/v1'
const apiKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

async function checkTable(tableName) {
  try {
    const response = await fetch(`${baseUrl}/${tableName}?limit=1`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Table '${tableName}': Found`)
      
      // Get count
      const countResponse = await fetch(`${baseUrl}/${tableName}?select=*&head=true`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      })
      
      const count = countResponse.headers.get('content-range')?.split('/')[1] || '0'
      console.log(`   📊 Records: ${count}`)
      
      return true
    } else {
      const error = await response.text()
      console.log(`❌ Table '${tableName}': ${response.status} - ${error}`)
      return false
    }
  } catch (err) {
    console.log(`❌ Table '${tableName}': ${err.message}`)
    return false
  }
}

async function main() {
  console.log('🔍 Verifying eligibility system tables...\n')
  
  const tables = [
    'treatment_types',
    'eligibility_questions', 
    'treatment_eligibility_questions',
    'patient_eligibility_submissions',
    'patient_eligibility_responses',
    'eligibility_rules'
  ]
  
  let foundTables = 0
  
  for (const table of tables) {
    const exists = await checkTable(table)
    if (exists) foundTables++
  }
  
  console.log(`\n📈 Summary: ${foundTables}/${tables.length} eligibility system tables found`)
  
  if (foundTables === tables.length) {
    console.log('🎉 Eligibility system migration successfully applied!')
  } else if (foundTables > 0) {
    console.log('⚠️  Partial eligibility system found - some tables may be missing')
  } else {
    console.log('❌ Eligibility system tables not found - migration may not have been applied')
  }
}

main().catch(console.error)