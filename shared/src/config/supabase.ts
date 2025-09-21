import { createClient } from '@supabase/supabase-js'

// Allow configuration to be set from the application
let _configOverride: { url: string; anonKey: string } | null = null

export const setSupabaseConfig = (config: { url: string; anonKey: string }) => {
  _configOverride = config
}

// Environment-agnostic configuration
export const getSupabaseConfig = () => {
  // Use override if set (for app-specific configuration)
  if (_configOverride) {
    return _configOverride
  }

  // Define variables for different environments
  let url: string | undefined
  let anonKey: string | undefined

  // Check for Node.js environment variables (SSR context)
  if (typeof process !== 'undefined' && process.env) {
    url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
    anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  }

  // Check for browser/window environment variables
  if (typeof window !== 'undefined' && (!url || !anonKey)) {
    const globalEnv = (window as any)
    url = url || globalEnv.VITE_SUPABASE_URL
    anonKey = anonKey || globalEnv.VITE_SUPABASE_ANON_KEY
  }

  // Fallback to hardcoded values for development (temporary)
  if (!url || !anonKey) {
    console.warn('Using fallback Supabase configuration. Set environment variables for production.')
    url = 'https://ukyczgfoqhdbamxycrkn.supabase.co'
    anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzUwNjAsImV4cCI6MjA3MDcxMTA2MH0.Z43rbJrXSpfS1n4R2YUS-2zA_mFUaU2ywdAPOB2KuF8'
  }

  return {
    url,
    anonKey
  }
}

// Create and export the Supabase client
export const createSupabaseClient = () => {
  const config = getSupabaseConfig()
  console.log('Creating Supabase client with URL:', config.url)
  const client = createClient(config.url, config.anonKey)
  
  // Wrap the from method to intercept providers table calls
  const originalFrom = client.from.bind(client)
  client.from = function(table: string) {
    if (table === 'providers') {
      console.log('🚨 INTERCEPTED: Supabase call to providers table')
      console.trace('🚨 CALL STACK for providers table access')
    }
    return originalFrom(table)
  }
  
  return client
}

// Default export for convenience - will be created lazily when first imported
let _supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export const getSupabaseClient = () => {
  if (!_supabaseClient) {
    _supabaseClient = createSupabaseClient()
  }
  return _supabaseClient
}

export const supabase = getSupabaseClient()