import React, { useState } from 'react'
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { LoginForm } from '@joinomu/mobile-ui'
import { AuthProvider } from '@joinomu/shared'

function LoginScreen() {
  const [loading, setLoading] = useState(false)

  const handleLogin = (email: string, password: string) => {
    setLoading(true)
    
    // Mock login process
    setTimeout(() => {
      setLoading(false)
      Alert.alert('Login', `Attempting login with: ${email}`)
    }, 2000)
  }

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Reset password functionality would go here')
  }

  const handleGoogleLogin = () => {
    Alert.alert('Google Login', 'Google OAuth would be implemented here')
  }

  const handleSignup = () => {
    Alert.alert('Sign Up', 'Navigate to signup screen')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>JoinOmu</Text>
        <Text style={styles.subtitle}>Healthcare Management Platform</Text>
      </View>
      
      <LoginForm
        onSubmit={handleLogin}
        onForgotPassword={handleForgotPassword}
        onGoogleLogin={handleGoogleLogin}
        onSignup={handleSignup}
        loading={loading}
      />
    </ScrollView>
  )
}

export const App = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="auto" />
          <LoginScreen />
        </SafeAreaView>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

export default App

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
})