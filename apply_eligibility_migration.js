import { readFileSync } from 'fs'

const migrationSQL = readFileSync('./supabase/migrations/20251015025000_add_multi_treatment_eligibility_system.sql', 'utf8')

const baseUrl = 'http://127.0.0.1:54321/rest/v1'
const apiKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

async function executeMigration() {
  console.log('🚀 Applying multi-treatment eligibility system migration...\n')
  
  try {
    // Execute the SQL migration directly
    const response = await fetch(`${baseUrl}/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: migrationSQL
      })
    })
    
    if (response.ok) {
      console.log('✅ Migration executed successfully!')
      
      // Verify the tables were created
      const verifyResponse = await fetch(`${baseUrl}/treatment_types?limit=1`, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (verifyResponse.ok) {
        console.log('✅ Verification: treatment_types table accessible')
        
        const data = await verifyResponse.json()
        console.log(`📊 Found ${data.length} treatment types`)
        if (data.length > 0) {
          console.log('🎯 Sample data was created successfully')
        }
      } else {
        console.log('⚠️  Verification failed - tables may not be accessible via API')
      }
      
    } else {
      const error = await response.text()
      console.log('❌ Migration failed:', error)
    }
    
  } catch (err) {
    console.log('❌ Error executing migration:', err.message)
  }
}

// Alternative approach: Try to execute via database connection
async function executeMigrationDirect() {
  console.log('🔄 Trying alternative approach: Direct SQL execution...\n')
  
  // Split the SQL into individual statements for better error handling
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
  
  console.log(`📝 Found ${statements.length} SQL statements to execute`)
  
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';'
    
    try {
      const response = await fetch(`${baseUrl}/rpc/execute_raw_sql`, {
        method: 'POST', 
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: statement
        })
      })
      
      if (response.ok) {
        successCount++
        if (statement.includes('CREATE TABLE') || statement.includes('INSERT INTO')) {
          console.log(`✅ Statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
        }
      } else {
        errorCount++
        const error = await response.text()
        console.log(`❌ Statement ${i + 1} failed: ${error}`)
      }
      
    } catch (err) {
      errorCount++
      console.log(`❌ Statement ${i + 1} error: ${err.message}`)
    }
  }
  
  console.log(`\n📊 Results: ${successCount} successful, ${errorCount} failed`)
  
  if (successCount > 0) {
    console.log('✅ Some migration statements executed successfully')
    return true
  } else {
    console.log('❌ No migration statements executed successfully')
    return false
  }
}

// Run the migration
async function main() {
  console.log('🎯 Multi-Treatment Eligibility System Migration\n')
  
  // First try the RPC approach
  await executeMigration()
  
  // If that fails, try the direct approach
  console.log('\n' + '='.repeat(50))
  const success = await executeMigrationDirect()
  
  if (success) {
    console.log('\n🎉 Migration process completed!')
    console.log('💡 Please verify the tables were created by running the verification script')
  } else {
    console.log('\n❌ Migration failed')
    console.log('💡 You may need to apply the migration manually through the Supabase dashboard')
  }
}

main().catch(console.error)