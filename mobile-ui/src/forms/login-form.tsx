import * as React from 'react'
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { Button } from '../components/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/card'
import { Input } from '../components/input'
import { colors, spacing } from '../lib/utils'

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => void
  onForgotPassword?: () => void
  onGoogleLogin?: () => void
  onSignup?: () => void
  loading?: boolean
  error?: string
  showForgotPassword?: boolean
  showGoogleLogin?: boolean
  showSignupLink?: boolean
}

export function LoginForm({
  onSubmit,
  onForgotPassword,
  onGoogleLogin,
  onSignup,
  loading = false,
  error,
  showForgotPassword = true,
  showGoogleLogin = true,
  showSignupLink = true,
}: LoginFormProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  const handleSubmit = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }
    onSubmit?.(email.trim(), password)
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle style={styles.title}>Login</CardTitle>
          <Text style={styles.description}>
            Enter your email below to login to your account
          </Text>
        </CardHeader>
        <CardContent>
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="m@example.com"
              required
            />

            <View style={styles.passwordContainer}>
              <View style={styles.passwordHeader}>
                <Text style={styles.passwordLabel}>Password</Text>
                {showForgotPassword && (
                  <TouchableOpacity onPress={onForgotPassword}>
                    <Text style={styles.forgotPassword}>
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <Input
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                placeholder="Enter your password"
                required
              />
            </View>

            {error && (
              <Text style={styles.error}>{error}</Text>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title={loading ? 'Signing in...' : 'Login'}
                onPress={handleSubmit}
                disabled={loading}
                style={styles.loginButton}
              />

              {showGoogleLogin && (
                <Button
                  title="Login with Google"
                  onPress={onGoogleLogin}
                  variant="outline"
                  style={styles.googleButton}
                />
              )}
            </View>

            {showSignupLink && (
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                  Don't have an account?{' '}
                  <TouchableOpacity onPress={onSignup}>
                    <Text style={styles.signupLink}>Sign up</Text>
                  </TouchableOpacity>
                </Text>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: spacing.lg,
  },
  passwordContainer: {
    gap: spacing.xs,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  forgotPassword: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  error: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    backgroundColor: colors.error + '10',
    padding: spacing.sm,
    borderRadius: 6,
  },
  buttonContainer: {
    gap: spacing.sm,
  },
  loginButton: {
    width: '100%',
  },
  googleButton: {
    width: '100%',
  },
  signupContainer: {
    marginTop: spacing.md,
  },
  signupText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  signupLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
})

export type { LoginFormProps }