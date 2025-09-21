import { useState } from 'react'
import { authService } from './auth-service.js'
import type { SignInCredentials, SignUpCredentials } from '../types/auth.js'

/**
 * Hook for handling login form logic
 */
export const useLoginForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (credentials: SignInCredentials) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await authService.signIn(credentials)
      
      if (error) {
        setError(error.message || 'Login failed')
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handleLogin,
    isLoading,
    error,
    clearError: () => setError(null)
  }
}

/**
 * Hook for handling signup form logic
 */
export const useSignupForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (credentials: SignUpCredentials) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await authService.signUp(credentials)
      
      if (error) {
        setError(error.message || 'Signup failed')
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handleSignup,
    isLoading,
    error,
    clearError: () => setError(null)
  }
}

/**
 * Hook for user role utilities
 */
export const useUserRole = () => {
  const isPatient = (role: string | null) => role === 'patient'
  const isAdmin = (role: string | null) => role === 'admin'
  const isProvider = (role: string | null) => role === 'provider'

  return {
    isPatient,
    isAdmin,
    isProvider
  }
}