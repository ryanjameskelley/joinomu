import * as React from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { colors, spacing } from '../lib/utils'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
}

interface CardHeaderProps {
  children: React.ReactNode
  style?: ViewStyle
}

interface CardTitleProps {
  children: React.ReactNode
  style?: TextStyle
}

interface CardDescriptionProps {
  children: React.ReactNode
  style?: TextStyle
}

interface CardContentProps {
  children: React.ReactNode
  style?: ViewStyle
}

interface CardFooterProps {
  children: React.ReactNode
  style?: ViewStyle
}

const Card = React.forwardRef<View, CardProps>(
  ({ children, style, ...props }, ref) => (
    <View
      ref={ref}
      style={[styles.card, style]}
      {...props}
    >
      {children}
    </View>
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<View, CardHeaderProps>(
  ({ children, style, ...props }, ref) => (
    <View
      ref={ref}
      style={[styles.header, style]}
      {...props}
    >
      {children}
    </View>
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<Text, CardTitleProps>(
  ({ children, style, ...props }, ref) => (
    <Text
      ref={ref}
      style={[styles.title, style]}
      {...props}
    >
      {children}
    </Text>
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<Text, CardDescriptionProps>(
  ({ children, style, ...props }, ref) => (
    <Text
      ref={ref}
      style={[styles.description, style]}
      {...props}
    >
      {children}
    </Text>
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<View, CardContentProps>(
  ({ children, style, ...props }, ref) => (
    <View
      ref={ref}
      style={[styles.content, style]}
      {...props}
    >
      {children}
    </View>
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<View, CardFooterProps>(
  ({ children, style, ...props }, ref) => (
    <View
      ref={ref}
      style={[styles.footer, style]}
      {...props}
    >
      {children}
    </View>
  )
)
CardFooter.displayName = 'CardFooter'

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
})

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
}

export type { 
  CardProps, 
  CardHeaderProps, 
  CardTitleProps, 
  CardDescriptionProps, 
  CardContentProps, 
  CardFooterProps 
}