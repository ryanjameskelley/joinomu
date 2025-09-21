import * as React from 'react'
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native'
import { colors, spacing } from '../lib/utils'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

const Button = React.forwardRef<TouchableOpacity, ButtonProps>(
  ({ 
    title, 
    onPress, 
    variant = 'default', 
    size = 'default', 
    disabled = false, 
    loading = false,
    style,
    textStyle,
    ...props 
  }, ref) => {
    const buttonStyle = [
      styles.button,
      styles[variant],
      styles[size],
      disabled && styles.disabled,
      style
    ]

    const textStyleCombined = [
      styles.text,
      styles[`${variant}Text`],
      styles[`${size}Text`],
      disabled && styles.disabledText,
      textStyle
    ]

    return (
      <TouchableOpacity
        ref={ref}
        style={buttonStyle}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? colors.primary : '#fff'} />
        ) : (
          <Text style={textStyleCombined}>{title}</Text>
        )}
      </TouchableOpacity>
    )
  }
)

Button.displayName = 'Button'

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  
  // Variants
  default: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  destructive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  
  // Sizes
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  lg: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  icon: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  
  // Text styles
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  defaultText: {
    color: '#fff',
  },
  destructiveText: {
    color: '#fff',
  },
  outlineText: {
    color: colors.text,
  },
  secondaryText: {
    color: colors.text,
  },
  ghostText: {
    color: colors.text,
  },
  
  // Size text styles
  smText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 18,
  },
  iconText: {
    fontSize: 16,
  },
  
  // Disabled styles
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
})

export { Button }
export type { ButtonProps }