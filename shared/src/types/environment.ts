export interface EnvironmentConfig {
  supabase: {
    url: string
    anonKey: string
  }
  app: {
    environment: 'development' | 'staging' | 'production'
    apiUrl?: string
  }
}

export const getEnvironment = (): EnvironmentConfig['app']['environment'] => {
  if (typeof process !== 'undefined') {
    return (process.env.NODE_ENV as any) || 'development'
  }
  return 'development'
}