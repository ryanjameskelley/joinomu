// Auth service and core functionality
export { authService } from './auth-service.js'
export type { UserRole } from './auth-service.js'

// Auth provider and context
export { AuthProvider, useAuth } from './auth-provider.js'

// Auth hooks for forms and utilities
export { useLoginForm, useSignupForm, useUserRole } from './auth-hooks.js'