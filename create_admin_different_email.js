const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminDifferentEmail() {
  try {
    console.log('🔄 Creating admin user with different email first...')

    // Step 1: Create with a different email to avoid whatever is blocking admin@test.com
    const tempEmail = `admin${Date.now()}@test.com`
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: 'password',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User'
      }
    })

    if (adminAuthError) {
      console.error('❌ Error creating admin auth user:', adminAuthError)
      return
    }

    console.log('✅ Created admin auth user with temp email:', adminAuth.user.id)
    
    // Step 2: Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 3: Update email to admin@test.com
    const { data: updatedAuth, error: updateError } = await supabase.auth.admin.updateUserById(adminAuth.user.id, {
      email: 'admin@test.com'
    })

    if (updateError) {
      console.error('❌ Error updating email to admin@test.com:', updateError)
    } else {
      console.log('✅ Updated email to admin@test.com')
    }
    
    // Step 4: Check if profile was created by trigger
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminAuth.user.id)
      .single()
    
    if (!existingProfile) {
      console.log('⚠️  Profile not created by trigger, creating manually...')
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: adminAuth.user.id,
          email: 'admin@test.com',
          role: 'admin',
          first_name: 'Admin',
          last_name: 'User'
        })

      if (profileError) {
        console.error('❌ Error creating profile:', profileError)
      } else {
        console.log('✅ Profile created manually')
      }
    } else {
      console.log('✅ Profile created by trigger, updating email in profile...')
      
      // Update profile email to match
      await supabase
        .from('profiles')
        .update({ email: 'admin@test.com' })
        .eq('id', adminAuth.user.id)
    }

    // Step 5: Check if admin record exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('profile_id', adminAuth.user.id)
      .single()

    if (!existingAdmin) {
      console.log('⚠️  Admin record not found, creating manually...')
      
      const { error: adminRecordError } = await supabase
        .from('admins')
        .insert({
          profile_id: adminAuth.user.id,
          permissions: ['dashboard', 'patients', 'providers', 'assignments'],
          active: true
        })

      if (adminRecordError) {
        console.error('❌ Error creating admin record:', adminRecordError)
      } else {
        console.log('✅ Admin record created manually')
      }
    } else {
      console.log('✅ Admin record exists')
    }

    // Step 6: Verify everything works
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminAuth.user.id)
      .single()

    const { data: finalAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('profile_id', adminAuth.user.id)
      .single()

    if (finalProfile && finalAdmin) {
      console.log('🎉 Admin user created successfully!')
      console.log('📝 Login credentials: admin@test.com / password')
      console.log('👤 User ID:', adminAuth.user.id)
      console.log('📧 Email verified:', finalProfile.email)
      console.log('🛡️  Admin permissions:', finalAdmin.permissions)
    } else {
      console.log('❌ Something went wrong with final verification')
    }

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

createAdminDifferentEmail()