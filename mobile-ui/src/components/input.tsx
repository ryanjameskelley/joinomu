import * as React from 'react'
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native'
import { colors, spacing } from '../lib/utils'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  containerStyle?: ViewStyle
  labelStyle?: TextStyle
  errorStyle?: TextStyle
  disabled?: boolean
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ 
    label, 
    error, 
    containerStyle, 
    labelStyle, 
    errorStyle, 
    disabled = false,
    style,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const inputStyle = [
      styles.input,
      isFocused && styles.inputFocused,
      error && styles.inputError,
      disabled && styles.inputDisabled,
      style
    ]

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, labelStyle]}>
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          style={inputStyle}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          editable={!disabled}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
        {error && (
          <Text style={[styles.error, errorStyle]}>
            {error}
          </Text>
        )}
      </View>
    )
  }
)

Input.displayName = 'Input'

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.6,
  },
  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
})

export { Input }
export type { InputProps }