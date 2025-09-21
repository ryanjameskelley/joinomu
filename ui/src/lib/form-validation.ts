// Form validation utilities

export interface ValidationRule {
  required?: boolean | string
  minLength?: number | { value: number; message: string }
  maxLength?: number | { value: number; message: string }
  pattern?: RegExp | { value: RegExp; message: string }
  custom?: (value: any) => string | undefined
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export class FormValidator {
  private rules: Record<string, ValidationRule> = {}

  constructor(rules: Record<string, ValidationRule> = {}) {
    this.rules = rules
  }

  addRule(field: string, rule: ValidationRule): FormValidator {
    this.rules[field] = rule
    return this
  }

  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {}

    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field]
      const error = this.validateField(value, rule)
      
      if (error) {
        errors[field] = error
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  validateField(value: any, rule: ValidationRule): string | undefined {
    // Required validation
    if (rule.required) {
      const isEmpty = value === undefined || value === null || value === '' || 
                     (Array.isArray(value) && value.length === 0)
      
      if (isEmpty) {
        return typeof rule.required === 'string' 
          ? rule.required 
          : 'This field is required'
      }
    }

    // Skip other validations if value is empty (and not required)
    if (value === undefined || value === null || value === '') {
      return undefined
    }

    // String validations
    if (typeof value === 'string') {
      // Min length
      if (rule.minLength !== undefined) {
        const minLength = typeof rule.minLength === 'number' 
          ? rule.minLength 
          : rule.minLength.value
        const message = typeof rule.minLength === 'number'
          ? `Must be at least ${minLength} characters`
          : rule.minLength.message

        if (value.length < minLength) {
          return message
        }
      }

      // Max length
      if (rule.maxLength !== undefined) {
        const maxLength = typeof rule.maxLength === 'number' 
          ? rule.maxLength 
          : rule.maxLength.value
        const message = typeof rule.maxLength === 'number'
          ? `Must be no more than ${maxLength} characters`
          : rule.maxLength.message

        if (value.length > maxLength) {
          return message
        }
      }

      // Pattern validation
      if (rule.pattern !== undefined) {
        const pattern = rule.pattern instanceof RegExp 
          ? rule.pattern 
          : rule.pattern.value
        const message = rule.pattern instanceof RegExp
          ? 'Invalid format'
          : rule.pattern.message

        if (!pattern.test(value)) {
          return message
        }
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value)
    }

    return undefined
  }
}

// Common validation patterns
export const ValidationPatterns = {
  email: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  phone: {
    value: /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
    message: 'Please enter a valid phone number'
  },
  zipCode: {
    value: /^\d{5}(-\d{4})?$/,
    message: 'Please enter a valid ZIP code'
  },
  password: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
  }
}

// Pre-built validators for common use cases
export const CommonValidators = {
  email: (): ValidationRule => ({
    required: true,
    pattern: ValidationPatterns.email
  }),

  password: (minLength = 6): ValidationRule => ({
    required: true,
    minLength: {
      value: minLength,
      message: `Password must be at least ${minLength} characters`
    }
  }),

  confirmPassword: (originalPassword: string): ValidationRule => ({
    required: true,
    custom: (value: string) => {
      if (value !== originalPassword) {
        return 'Passwords do not match'
      }
      return undefined
    }
  }),

  name: (): ValidationRule => ({
    required: true,
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters'
    },
    maxLength: {
      value: 50,
      message: 'Name must be no more than 50 characters'
    }
  }),

  age: (minAge = 18, maxAge = 120): ValidationRule => ({
    required: true,
    custom: (value: number) => {
      const age = Number(value)
      if (isNaN(age) || age < minAge) {
        return `You must be at least ${minAge} years old`
      }
      if (age > maxAge) {
        return `Age must be less than ${maxAge}`
      }
      return undefined
    }
  }),

  zipCode: (): ValidationRule => ({
    required: true,
    pattern: ValidationPatterns.zipCode
  }),

  phone: (): ValidationRule => ({
    pattern: ValidationPatterns.phone
  }),

  weight: (minWeight = 50, maxWeight = 800): ValidationRule => ({
    required: true,
    custom: (value: number) => {
      const weight = Number(value)
      if (isNaN(weight) || weight < minWeight) {
        return `Weight must be at least ${minWeight} lbs`
      }
      if (weight > maxWeight) {
        return `Weight must be less than ${maxWeight} lbs`
      }
      return undefined
    }
  })
}

// Healthcare-specific validators
export const HealthcareValidators = {
  bmi: (minBmi = 15, maxBmi = 60): ValidationRule => ({
    custom: (value: number) => {
      const bmi = Number(value)
      if (isNaN(bmi) || bmi < minBmi) {
        return `BMI appears too low (${bmi?.toFixed(1)}). Please check your height/weight.`
      }
      if (bmi > maxBmi) {
        return `BMI appears too high (${bmi?.toFixed(1)}). Please check your height/weight.`
      }
      return undefined
    }
  }),

  medicationList: (): ValidationRule => ({
    custom: (value: string[]) => {
      if (Array.isArray(value) && value.length > 20) {
        return 'Please limit to 20 medications or less'
      }
      return undefined
    }
  })
}

// Utility function to calculate BMI
export function calculateBMI(weightPounds: number, heightInches: number): number {
  return (weightPounds / (heightInches * heightInches)) * 703
}

// Utility function to format height
export function formatHeight(feet: number, inches: number): string {
  return `${feet}'${inches}"`
}

// Utility function to validate eligibility form
export function createEligibilityValidator() {
  return new FormValidator({
    email: CommonValidators.email(),
    firstName: CommonValidators.name(),
    lastName: CommonValidators.name(),
    age: CommonValidators.age(18, 120),
    weight: CommonValidators.weight(50, 800),
    zipCode: CommonValidators.zipCode(),
    state: { required: 'Please select your state' },
    treatmentType: { required: 'Please select a treatment type' }
  })
}