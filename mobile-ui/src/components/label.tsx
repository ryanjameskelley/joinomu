import * as React from 'react'
import { Text, StyleSheet, TextStyle } from 'react-native'
import { colors } from '../lib/utils'

interface LabelProps {
  children: React.ReactNode
  style?: TextStyle
  required?: boolean
}

const Label = React.forwardRef<Text, LabelProps>(
  ({ children, style, required = false, ...props }, ref) => (
    <Text
      ref={ref}
      style={[styles.label, style]}
      {...props}
    >
      {children}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  )
)

Label.displayName = 'Label'

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  required: {
    color: colors.error,
  },
})

export { Label }
export type { LabelProps }