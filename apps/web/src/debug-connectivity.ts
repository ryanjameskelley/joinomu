import { supabase } from './utils/supabase/client'

async function testBasicConnectivity() {
  try {
    console.log('🔍 Testing basic Supabase connectivity...')
    
    // Test 1: Check current user
    console.log('1. Getting current user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ User error:', userError)
      return
    }
    
    if (user) {
      console.log('✅ Current user:', user.id, user.email)
      console.log('📋 User metadata:', user.user_metadata)
    } else {
      console.log('❌ No user logged in')
      return
    }
    
    // Test 2: Try a simple query that should work
    console.log('2. Testing basic query...')
    const { data: testData, error: testError } = await supabase
      .from('admins')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Query error:', testError)
    } else {
      console.log('✅ Basic query worked:', testData)
    }
    
    // Test 3: Try the patients query directly
    console.log('3. Testing patients query...')
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('id, email, first_name, last_name')
      .limit(5)
    
    if (patientsError) {
      console.error('❌ Patients query error:', patientsError)
      console.log('📝 Error details:', JSON.stringify(patientsError, null, 2))
    } else {
      console.log('✅ Patients query worked:', patientsData)
      console.log(`📊 Found ${patientsData?.length || 0} patients`)
    }
    
    // Test 4: Check if we can call a known RPC function
    console.log('4. Testing RPC function...')
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_user_roles_secure', { user_id_param: user.id })
    
    if (rpcError) {
      console.error('❌ RPC error:', rpcError)
    } else {
      console.log('✅ RPC function worked:', rpcData)
    }
    
  } catch (err) {
    console.error('💥 Exception in connectivity test:', err)
  }
}

// Simpler sync version to check if anything works
function testSync() {
  console.log('🔧 Testing synchronous operations...')
  console.log('📱 Supabase client exists:', !!supabase)
  console.log('🔗 Supabase URL:', supabase.supabaseUrl)
  console.log('🔑 Has auth:', !!supabase.auth)
  
  // Check if we can at least start an auth operation
  supabase.auth.getUser().then(result => {
    console.log('🔄 Async auth result:', result)
  }).catch(err => {
    console.error('❌ Async auth error:', err)
  })
}

// Add a timeout version
function testWithTimeout() {
  console.log('⏱️ Testing with 10 second timeout...')
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Operation timed out after 10 seconds')), 10000)
  )
  
  const queryPromise = supabase
    .from('patients')
    .select('count')
    .limit(1)
  
  Promise.race([queryPromise, timeoutPromise])
    .then(result => {
      console.log('✅ Query completed within timeout:', result)
    })
    .catch(err => {
      console.error('❌ Query failed or timed out:', err)
    })
}

// Export for console use
(window as any).testBasicConnectivity = testBasicConnectivity;
(window as any).testSync = testSync;
(window as any).testWithTimeout = testWithTimeout;

console.log('🔧 Connectivity test functions loaded:');
console.log('- testBasicConnectivity() - comprehensive async test');
console.log('- testSync() - basic sync checks');
console.log('- testWithTimeout() - test with timeout');

export { testBasicConnectivity, testSync, testWithTimeout }