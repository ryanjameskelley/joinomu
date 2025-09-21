// Initialize environment configuration for shared packages
import { setSupabaseConfig } from '@joinomu/shared'

// Initialize Supabase configuration with Vite environment variables
export const initializeEnvironment = () => {
  // Get environment variables from Vite
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  console.log('Initializing environment configuration...')
  console.log('VITE_SUPABASE_URL:', supabaseUrl)
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Found' : 'Not found')

  // Set configuration in shared package if environment variables are available
  if (supabaseUrl && supabaseAnonKey) {
    setSupabaseConfig({
      url: supabaseUrl,
      anonKey: supabaseAnonKey
    })
    console.log('✅ Supabase configuration set from environment variables')
  } else {
    console.warn('⚠️ Environment variables not found, using fallback configuration')
  }
}