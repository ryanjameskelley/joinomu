// Address validation and formatting utilities
// Provides client-side validation and formatting for patient addresses

export interface Address {
  id?: string
  patient_id?: string
  address_type: 'shipping' | 'billing' | 'emergency'
  street_line_1: string
  street_line_2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_primary: boolean
  is_verified?: boolean
  verified_at?: string
  verification_method?: 'usps' | 'ups' | 'fedex' | 'manual' | 'user_confirmed'
  notes?: string
}

export interface AddressValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

// US state abbreviations for validation
const US_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
])

/**
 * Validates an address object
 */
export function validateAddress(address: Partial<Address>): AddressValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required field validation
  if (!address.street_line_1?.trim()) {
    errors.push('Street address is required')
  }

  if (!address.city?.trim()) {
    errors.push('City is required')
  }

  if (!address.state?.trim()) {
    errors.push('State is required')
  }

  if (!address.postal_code?.trim()) {
    errors.push('Postal code is required')
  }

  if (!address.address_type) {
    errors.push('Address type is required')
  }

  // Country-specific validation
  const country = address.country || 'US'

  if (country === 'US') {
    // US postal code validation
    if (address.postal_code && !isValidUSPostalCode(address.postal_code)) {
      errors.push('Invalid US postal code format (use 12345 or 12345-6789)')
    }

    // US state validation
    if (address.state && !isValidUSState(address.state)) {
      errors.push('State must be a valid 2-letter US state abbreviation')
    }
  }

  // Length validations
  if (address.street_line_1 && address.street_line_1.length > 100) {
    errors.push('Street address line 1 must be 100 characters or less')
  }

  if (address.street_line_2 && address.street_line_2.length > 100) {
    errors.push('Street address line 2 must be 100 characters or less')
  }

  if (address.city && address.city.length > 50) {
    errors.push('City must be 50 characters or less')
  }

  if (address.notes && address.notes.length > 500) {
    errors.push('Notes must be 500 characters or less')
  }

  // Warnings for potential issues
  if (address.street_line_1 && !/\d/.test(address.street_line_1)) {
    warnings.push('Street address should typically include a house number')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates US postal code format
 */
export function isValidUSPostalCode(postalCode: string): boolean {
  const trimmed = postalCode.trim()
  return /^\d{5}(-\d{4})?$/.test(trimmed)
}

/**
 * Validates US state abbreviation
 */
export function isValidUSState(state: string): boolean {
  return US_STATES.has(state.toUpperCase())
}

/**
 * Formats a postal code for display
 */
export function formatPostalCode(postalCode: string, country: string = 'US'): string {
  if (country === 'US') {
    const cleaned = postalCode.replace(/\D/g, '')
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
    }
    return cleaned.slice(0, 5)
  }
  return postalCode
}

/**
 * Formats an address for display
 */
export function formatAddressDisplay(address: Address): string {
  const lines = [
    address.street_line_1,
    address.street_line_2?.trim() || null,
    `${address.city}, ${address.state} ${formatPostalCode(address.postal_code, address.country)}`
  ].filter(Boolean)

  return lines.join('\n')
}

/**
 * Formats an address for single-line display
 */
export function formatAddressOneLine(address: Address): string {
  const parts = [
    address.street_line_1,
    address.street_line_2?.trim() || null,
    address.city,
    address.state,
    formatPostalCode(address.postal_code, address.country)
  ].filter(Boolean)

  return parts.join(', ')
}

/**
 * Converts address type to display label
 */
export function getAddressTypeLabel(type: Address['address_type']): string {
  switch (type) {
    case 'shipping':
      return 'Shipping Address'
    case 'billing':
      return 'Billing Address'
    case 'emergency':
      return 'Emergency Contact Address'
    default:
      return 'Address'
  }
}

/**
 * Gets the verification status display
 */
export function getVerificationStatusDisplay(address: Address): {
  label: string
  color: 'green' | 'yellow' | 'gray'
  icon: string
} {
  if (address.is_verified) {
    return {
      label: 'Verified',
      color: 'green',
      icon: '✓'
    }
  }

  if (address.verification_method === 'user_confirmed') {
    return {
      label: 'User Confirmed',
      color: 'yellow',
      icon: '⚠'
    }
  }

  return {
    label: 'Unverified',
    color: 'gray',
    icon: '○'
  }
}

/**
 * Normalizes address input (trim whitespace, convert to proper case)
 */
export function normalizeAddress(address: Partial<Address>): Partial<Address> {
  return {
    ...address,
    street_line_1: address.street_line_1?.trim(),
    street_line_2: address.street_line_2?.trim() || undefined,
    city: toTitleCase(address.city?.trim() || ''),
    state: address.state?.trim().toUpperCase(),
    postal_code: address.postal_code?.trim(),
    country: address.country?.trim().toUpperCase() || 'US'
  }
}

/**
 * Converts string to title case
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Checks if two addresses are substantially the same
 */
export function addressesMatch(addr1: Address, addr2: Address): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w]/g, '')
  
  return (
    normalize(addr1.street_line_1) === normalize(addr2.street_line_1) &&
    normalize(addr1.city) === normalize(addr2.city) &&
    normalize(addr1.state) === normalize(addr2.state) &&
    normalize(addr1.postal_code) === normalize(addr2.postal_code) &&
    normalize(addr1.country) === normalize(addr2.country)
  )
}

/**
 * Default empty address object
 */
export function createEmptyAddress(type: Address['address_type'] = 'shipping'): Partial<Address> {
  return {
    address_type: type,
    street_line_1: '',
    street_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    is_primary: false,
    is_verified: false
  }
}