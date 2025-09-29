const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

async function checkUser() {
  const userId = '01a7078f-34cb-4a31-96ff-59023f1f4b9e'
  
  console.log('Checking user:', userId)
  
  // Check if user exists in auth.users
  const { data: authUser, error: authError } = await supabase.auth.getUser()
  console.log('Current auth user:', authUser?.user?.id)
  
  // Check profiles table
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  console.log('Profile data:', profileData)
  console.log('Profile error:', profileError)
  
  // Check all profiles
  const { data: allProfiles, error: allError } = await supabase
    .from('profiles')
    .select('id, email, role')
    
  console.log('All profiles:', allProfiles)
  console.log('All profiles error:', allError)
  
  // Try to create the profile if it doesn't exist
  if (profileError && profileError.code === 'PGRST116') {
    console.log('Profile not found, creating...')
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      })
      .select()
      .single()
      
    console.log('Created profile:', newProfile)
    console.log('Create error:', createError)
  }
}

checkUser().catch(console.error)