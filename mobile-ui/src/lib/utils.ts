// Mobile utility functions for React Native
import { Dimensions, Platform } from 'react-native'

export const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'

// Responsive breakpoints for mobile
export const breakpoints = {
  small: screenWidth < 375,
  medium: screenWidth >= 375 && screenWidth < 414,
  large: screenWidth >= 414
}

// Common spacing values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
}

// Common color utilities
export const colors = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#ffffff',
  surface: '#f9fafb',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#d1d5db'
}