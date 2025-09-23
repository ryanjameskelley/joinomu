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

  // Fallback to local development Supabase
  if (!url || !anonKey) {
    console.warn('Using fallback LOCAL Supabase configuration. Set environment variables for production.')
    url = 'http://127.0.0.1:54321'
    anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  }

  return {
    url,
    anonKey
  }
}

// Create and export the Supabase client
export const createSupabaseClient = () => {
  const config = getSupabaseConfig()
  return createClient(config.url, config.anonKey)
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