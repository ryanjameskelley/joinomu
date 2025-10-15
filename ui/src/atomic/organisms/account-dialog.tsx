import * as React from 'react'
import { User, Heart, CreditCard, Settings, Check, Info, Trash2 } from 'lucide-react'
import { ExpandableDialog } from '../molecules/expandable-dialog'
import { Button } from '../../components/button'
import { Input } from '../../components/input'
import { Label } from '../../components/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/card'
import { Badge } from '../../components/badge'
import { Switch } from '../atoms/switch'
import { Separator } from '../../components/separator'
import { Textarea } from '../../components/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/select'
import { showToast } from '../../components/toast'

// JoinOmu Logo Component
function JoinOmuLogo({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 18C12 21.3137 9.31371 24 6 24C2.68629 24 0 21.3137 0 18C0 14.6863 2.68629 12 6 12C9.31371 12 12 14.6863 12 18Z" fill="url(#paint0_linear_202_550)"/>
      <path d="M6 3C6 1.34315 7.34315 0 9 0C10.6569 0 12 1.34315 12 3V12H6V3Z" fill="url(#paint1_linear_202_550)"/>
      <path d="M12 3C12 1.34315 13.3431 0 15 0C16.6569 0 18 1.34315 18 3V12H12V3Z" fill="url(#paint2_linear_202_550)"/>
      <path d="M12 12H24V18C24 21.3137 21.3137 24 18 24C14.6863 24 12 21.3137 12 18V12Z" fill="url(#paint3_linear_202_550)"/>
      <defs>
        <linearGradient id="paint0_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
        <linearGradient id="paint1_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
        <linearGradient id="paint2_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
        <linearGradient id="paint3_linear_202_550" x1="13.1184" y1="12" x2="22.8816" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBDDFF"/>
          <stop offset="1" stopColor="#C85A15"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export interface AccountDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  activeSection?: string
  onSectionChange?: (section: string) => void
}

// Import auth service (will be dynamically imported to avoid build issues in Storybook)
let authService: any = null
const getAuthService = async () => {
  if (!authService) {
    try {
      const module = await import('@joinomu/shared')
      authService = module.authService
    } catch (error) {
      console.warn('Auth service not available (likely in Storybook):', error)
      // Return mock service for Storybook
      authService = {
        getCurrentUser: () => ({ user: null, error: null }),
        getUserProfile: () => ({ data: null, error: null }),
        updatePatientProfile: () => ({ success: true, error: null }),
        updatePassword: () => ({ success: true, error: null })
      }
    }
  }
  return authService
}

const sidebarItems = [
  {
    id: 'account',
    name: 'Account',
    icon: User
  },
  {
    id: 'health-profile',
    name: 'Health Profile',
    icon: Heart
  },
  {
    id: 'billing-and-plans',
    name: 'Billing and Plans',
    icon: CreditCard
  },
  {
    id: 'preferences',
    name: 'Preferences',
    icon: Settings
  }
]

export function AccountDialog({
  open = true,
  onOpenChange,
  activeSection = 'Account',
  onSectionChange
}: AccountDialogProps) {
  const [currentSection, setCurrentSection] = React.useState(activeSection)
  const [hasAccountChanges, setHasAccountChanges] = React.useState(false)
  const [hasHealthChanges, setHasHealthChanges] = React.useState(false)
  const [hasPreferencesChanges, setHasPreferencesChanges] = React.useState(false)
  const [hasAddressChanges, setHasAddressChanges] = React.useState(false)

  // User profile data state
  const [userProfile, setUserProfile] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form data state
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  })

  // Update current section when activeSection prop changes
  React.useEffect(() => {
    setCurrentSection(activeSection)
  }, [activeSection])

  // Load user profile data when dialog opens
  React.useEffect(() => {
    if (open) {
      loadUserProfile()
    }
  }, [open])

  const loadUserProfile = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const auth = await getAuthService()
      const { data, error } = await auth.getUserProfile()
      
      if (error) {
        setError('Failed to load profile data')
        console.error('Profile load error:', error)
      } else if (data) {
        setUserProfile(data)
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          password: ''
        })
        // Reset changes state when loading fresh data
        setHasAccountChanges(false)
      }
    } catch (err) {
      setError('Failed to load profile data')
      console.error('Profile load exception:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasAccountChanges(true)
  }

  const handleSaveAccount = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const auth = await getAuthService()
      
      // Prepare update data
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      }

      // Update profile
      const { success, error } = await auth.updatePatientProfile(updateData)
      
      if (error) {
        setError('Failed to save changes')
        console.error('Save error:', error)
        showToast({
          title: 'Save Failed',
          description: 'Failed to update account information. Please try again.',
          variant: 'error'
        })
      } else if (success) {
        setHasAccountChanges(false)
        // Reload profile to get updated data
        await loadUserProfile()
        
        // Show success toast
        showToast({
          title: 'Account Updated',
          description: 'Your account information has been saved successfully.',
          variant: 'success'
        })
      }

      // Handle password update separately if provided
      if (formData.password) {
        const { success: passwordSuccess, error: passwordError } = await auth.updatePassword('', formData.password)
        if (passwordError) {
          setError('Profile saved but password update failed')
          console.error('Password update error:', passwordError)
          showToast({
            title: 'Password Update Failed',
            description: 'Account information saved but password update failed.',
            variant: 'warning'
          })
        } else if (passwordSuccess) {
          setFormData(prev => ({ ...prev, password: '' }))
          showToast({
            title: 'Password Updated',
            description: 'Your password has been changed successfully.',
            variant: 'success'
          })
        }
      }
    } catch (err) {
      setError('Failed to save changes')
      console.error('Save exception:', err)
      showToast({
        title: 'Save Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'error'
      })
    } finally {
      // Brief delay to ensure toast shows before resetting UI state
      setTimeout(() => {
        setIsSaving(false)
      }, 100)
    }
  }

  const handleSectionChange = (section: string) => {
    setCurrentSection(section)
    onSectionChange?.(section)
  }

  const renderAccountContent = () => (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading profile data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={formData.firstName}
                onChange={(e) => handleFormChange('firstName', e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={formData.lastName}
                onChange={(e) => handleFormChange('lastName', e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              disabled={isSaving}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel" 
              value={formData.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
              disabled={isSaving}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={formData.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              disabled={isSaving}
            />
            <p className="text-sm text-muted-foreground">Leave blank to keep current password</p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              disabled={isSaving}
              onClick={() => {
                setFormData({
                  firstName: userProfile?.first_name || '',
                  lastName: userProfile?.last_name || '',
                  email: userProfile?.email || '',
                  phone: userProfile?.phone || '',
                  password: ''
                })
                setHasAccountChanges(false)
                setError(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              disabled={!hasAccountChanges || isSaving}
              onClick={handleSaveAccount}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </>
      )}
    </div>
  )

  const renderHealthProfileContent = () => (
    <div className="h-full overflow-y-auto overflow-x-visible">
      <div className="space-y-6 pb-8 px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <div className="flex space-x-2">
              <Input id="height-ft" placeholder="6" className="w-20" onChange={() => setHasHealthChanges(true)} />
              <span className="flex items-center">ft</span>
              <Input id="height-in" placeholder="2" className="w-20" onChange={() => setHasHealthChanges(true)} />
              <span className="flex items-center">in</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (lbs)</Label>
            <Input id="weight" placeholder="180" onChange={() => setHasHealthChanges(true)} />
          </div>
        </div>


        <div className="space-y-2">
          <Label htmlFor="allergies">Allergies</Label>
          <Textarea 
            id="allergies" 
            placeholder="List any known allergies or adverse reactions..."
            rows={3}
            defaultValue="Penicillin - severe reaction&#10;Shellfish - mild reaction"
            onChange={() => setHasHealthChanges(true)}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button disabled={!hasHealthChanges}>Save Changes</Button>
        </div>
      </div>
    </div>
  )


  const renderBillingContent = () => (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 pb-8">
      {/* Current Membership */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Medication + Tracking Plan</p>
              <p className="text-sm text-muted-foreground">$79/month</p>
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => handleSectionChange('Edit Membership')}>Change Plan</Button>
            </div>
          </div>
          <div className="text-sm">
            <p className="text-muted-foreground">Next billing date: February 15, 2024</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">•••• •••• •••• 4242</p>
              <p className="text-sm text-muted-foreground">Expires 12/25</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button variant="outline" className="w-full">Add Payment Method</Button>
        </CardContent>
      </Card>

      {/* Shipping Information */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary Shipping Address */}
          <div className="p-3 border rounded-lg bg-blue-50">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">John Doe</p>
              <span className="text-xs font-medium text-blue-700">Primary</span>
            </div>
            <p className="text-sm text-muted-foreground">123 Main Street</p>
            <p className="text-sm text-muted-foreground">Apt 4B</p>
            <p className="text-sm text-muted-foreground">New York, NY 10001</p>
            <div className="flex space-x-2 mt-3">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Secondary Shipping Address */}
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">John Doe</p>
              <Button variant="ghost" size="sm" className="text-xs">Set as Primary</Button>
            </div>
            <p className="text-sm text-muted-foreground">456 Oak Avenue</p>
            <p className="text-sm text-muted-foreground">Suite 200</p>
            <p className="text-sm text-muted-foreground">Los Angeles, CA 90210</p>
            <div className="flex space-x-2 mt-3">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button variant="outline" className="w-full" onClick={() => handleSectionChange('Add Shipping Address')}>Add New Shipping Address</Button>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Monthly Subscription</p>
                <p className="text-sm text-muted-foreground">January 15, 2024</p>
              </div>
              <p className="font-semibold">$79.00</p>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Semaglutide Prescription</p>
                <p className="text-sm text-muted-foreground">January 10, 2024</p>
              </div>
              <p className="font-semibold">$120.00</p>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Monthly Subscription</p>
                <p className="text-sm text-muted-foreground">December 15, 2023</p>
              </div>
              <p className="font-semibold">$79.00</p>
            </div>
          </div>
          <Button variant="outline" className="w-full">View Full History</Button>
        </CardContent>
      </Card>
      </div>
    </div>
  )

  const renderPreferencesContent = () => (
    <div className="space-y-6 pb-8">
      {/* Tracking Chart Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Chart Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weight</p>
              <p className="text-sm text-muted-foreground">Show weight data in charts</p>
            </div>
            <Switch defaultChecked onCheckedChange={() => setHasPreferencesChanges(true)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Steps</p>
              <p className="text-sm text-muted-foreground">Show daily step count</p>
            </div>
            <Switch defaultChecked onCheckedChange={() => setHasPreferencesChanges(true)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sleep</p>
              <p className="text-sm text-muted-foreground">Show sleep tracking data</p>
            </div>
            <Switch onCheckedChange={() => setHasPreferencesChanges(true)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Calories</p>
              <p className="text-sm text-muted-foreground">Show calorie intake and burn data</p>
            </div>
            <Switch onCheckedChange={() => setHasPreferencesChanges(true)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Protein</p>
              <p className="text-sm text-muted-foreground">Show protein intake tracking</p>
            </div>
            <Switch onCheckedChange={() => setHasPreferencesChanges(true)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sugar</p>
              <p className="text-sm text-muted-foreground">Show sugar intake monitoring</p>
            </div>
            <Switch onCheckedChange={() => setHasPreferencesChanges(true)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Water</p>
              <p className="text-sm text-muted-foreground">Show daily water intake</p>
            </div>
            <Switch onCheckedChange={() => setHasPreferencesChanges(true)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Average Heart Rate</p>
              <p className="text-sm text-muted-foreground">Show heart rate data and trends</p>
            </div>
            <Switch onCheckedChange={() => setHasPreferencesChanges(true)} />
          </div>
        </CardContent>
      </Card>

      {/* Connected Wearables */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Wearables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black rounded text-white text-xs flex items-center justify-center">A</div>
              <div>
                <p className="font-medium">Apple Watch Series 9</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
            <Button variant="destructive" size="sm">Disconnect</Button>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded text-white text-xs flex items-center justify-center">F</div>
              <div>
                <p className="font-medium">Fitbit Versa 4</p>
                <p className="text-sm text-muted-foreground">Not connected</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
          
          <Button variant="outline" className="w-full">Add New Device</Button>
        </CardContent>
      </Card>

      {/* Provider Access */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Share Tracking Data</p>
              <p className="text-sm text-muted-foreground">Allow your provider to view your health tracking data</p>
            </div>
            <Switch defaultChecked onCheckedChange={() => setHasPreferencesChanges(true)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline">Cancel</Button>
        <Button disabled={!hasPreferencesChanges}>Save Preferences</Button>
      </div>
    </div>
  )

  const renderEditMembershipContent = () => (
    <div className="space-y-6 pb-8">
      {/* Pricing Cards */}
      <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto mt-12">
        {/* Tracking Only Plan */}
        <Card className="flex-1">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Tracking only</h3>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-semibold text-foreground">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Button variant="secondary" className="w-full">Select plan</Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">What's included:</p>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 flex items-start gap-3">
                  <p className="text-sm text-muted-foreground flex-1">
                    Comprehensive medication and health tracking to optimize your results
                  </p>
                  <Info className="h-4 w-4 text-muted-foreground opacity-70 mt-0.5 flex-shrink-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medication + Tracking Plan */}
        <Card className="flex-1">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Medication + Tracking</h3>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-semibold text-foreground">$79</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-center text-sm text-muted-foreground font-medium py-2">Current Plan</p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">Everything in Tracking only, plus:</p>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 flex items-start gap-3">
                  <p className="text-sm text-muted-foreground flex-1">
                    Unlimited access to a licensed JoinOmu physician with treatment level expertise
                  </p>
                  <Info className="h-4 w-4 text-muted-foreground opacity-70 mt-0.5 flex-shrink-0" />
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 flex items-start gap-3">
                  <p className="text-sm text-muted-foreground flex-1">
                    Access to prescription medications
                  </p>
                  <Info className="h-4 w-4 text-muted-foreground opacity-70 mt-0.5 flex-shrink-0" />
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 flex items-start gap-3">
                  <p className="text-sm text-muted-foreground flex-1">
                    Regular check ins with your provider
                  </p>
                  <Info className="h-4 w-4 text-muted-foreground opacity-70 mt-0.5 flex-shrink-0" />
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 flex items-start gap-3">
                  <p className="text-sm text-muted-foreground flex-1">
                    On demand dosage adjustments
                  </p>
                  <Info className="h-4 w-4 text-muted-foreground opacity-70 mt-0.5 flex-shrink-0" />
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 flex items-start gap-3">
                  <p className="text-sm text-muted-foreground flex-1">
                    Access to 24/7 messaging with your care team
                  </p>
                  <Info className="h-4 w-4 text-muted-foreground opacity-70 mt-0.5 flex-shrink-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <div className="text-center">
        <p className="text-muted-foreground text-sm leading-6 max-w-2xl mx-auto">
          Either plan gives access to comprehensive medication and health tracking to optimize your results regardless of if you're seeing a JoinOmu provider.
        </p>
      </div>
    </div>
  )


  const renderAddShippingAddressContent = () => {
    return (
      <div className="space-y-6 pb-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="newFullName">Full Name</Label>
            <Input id="newFullName" placeholder="Enter full name" onChange={() => setHasAddressChanges(true)} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newStreetLine1">Street Address</Label>
            <Input id="newStreetLine1" placeholder="Enter street address" onChange={() => setHasAddressChanges(true)} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newStreetLine2">Apartment, suite, etc. (optional)</Label>
            <Input id="newStreetLine2" placeholder="Apt, suite, unit, etc." onChange={() => setHasAddressChanges(true)} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newCity">City</Label>
              <Input id="newCity" placeholder="Enter city" onChange={() => setHasAddressChanges(true)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newState">State</Label>
              <Select onValueChange={() => setHasAddressChanges(true)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="al">Alabama</SelectItem>
                  <SelectItem value="ak">Alaska</SelectItem>
                  <SelectItem value="az">Arizona</SelectItem>
                  <SelectItem value="ar">Arkansas</SelectItem>
                  <SelectItem value="ca">California</SelectItem>
                  <SelectItem value="co">Colorado</SelectItem>
                  <SelectItem value="ct">Connecticut</SelectItem>
                  <SelectItem value="de">Delaware</SelectItem>
                  <SelectItem value="fl">Florida</SelectItem>
                  <SelectItem value="ga">Georgia</SelectItem>
                  <SelectItem value="hi">Hawaii</SelectItem>
                  <SelectItem value="id">Idaho</SelectItem>
                  <SelectItem value="il">Illinois</SelectItem>
                  <SelectItem value="in">Indiana</SelectItem>
                  <SelectItem value="ia">Iowa</SelectItem>
                  <SelectItem value="ks">Kansas</SelectItem>
                  <SelectItem value="ky">Kentucky</SelectItem>
                  <SelectItem value="la">Louisiana</SelectItem>
                  <SelectItem value="me">Maine</SelectItem>
                  <SelectItem value="md">Maryland</SelectItem>
                  <SelectItem value="ma">Massachusetts</SelectItem>
                  <SelectItem value="mi">Michigan</SelectItem>
                  <SelectItem value="mn">Minnesota</SelectItem>
                  <SelectItem value="ms">Mississippi</SelectItem>
                  <SelectItem value="mo">Missouri</SelectItem>
                  <SelectItem value="mt">Montana</SelectItem>
                  <SelectItem value="ne">Nebraska</SelectItem>
                  <SelectItem value="nv">Nevada</SelectItem>
                  <SelectItem value="nh">New Hampshire</SelectItem>
                  <SelectItem value="nj">New Jersey</SelectItem>
                  <SelectItem value="nm">New Mexico</SelectItem>
                  <SelectItem value="ny">New York</SelectItem>
                  <SelectItem value="nc">North Carolina</SelectItem>
                  <SelectItem value="nd">North Dakota</SelectItem>
                  <SelectItem value="oh">Ohio</SelectItem>
                  <SelectItem value="ok">Oklahoma</SelectItem>
                  <SelectItem value="or">Oregon</SelectItem>
                  <SelectItem value="pa">Pennsylvania</SelectItem>
                  <SelectItem value="ri">Rhode Island</SelectItem>
                  <SelectItem value="sc">South Carolina</SelectItem>
                  <SelectItem value="sd">South Dakota</SelectItem>
                  <SelectItem value="tn">Tennessee</SelectItem>
                  <SelectItem value="tx">Texas</SelectItem>
                  <SelectItem value="ut">Utah</SelectItem>
                  <SelectItem value="vt">Vermont</SelectItem>
                  <SelectItem value="va">Virginia</SelectItem>
                  <SelectItem value="wa">Washington</SelectItem>
                  <SelectItem value="wv">West Virginia</SelectItem>
                  <SelectItem value="wi">Wisconsin</SelectItem>
                  <SelectItem value="wy">Wyoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newZipCode">ZIP Code</Label>
              <Input id="newZipCode" placeholder="Enter ZIP code" onChange={() => setHasAddressChanges(true)} />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="setNewPrimary" className="rounded" />
            <Label htmlFor="setNewPrimary">Set as primary address</Label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancel</Button>
          <Button disabled={!hasAddressChanges}>Add Address</Button>
        </div>
      </div>
    )
  }

  const renderSectionContent = () => {
    switch (currentSection) {
      case 'Account':
        return renderAccountContent()
      case 'Health Profile':
        return renderHealthProfileContent()
      case 'Billing and Plans':
        return renderBillingContent()
      case 'Preferences':
        return renderPreferencesContent()
      case 'Edit Membership':
        return renderEditMembershipContent()
      case 'Add Shipping Address':
        return renderAddShippingAddressContent()
      default:
        return null
    }
  }

  return (
    <ExpandableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Account Settings"
      description="Manage your account settings, health profile, billing, and preferences"
      sidebarItems={sidebarItems}
      activeSection={currentSection}
      onSectionChange={handleSectionChange}
      className="w-[calc(100vw-16px)] h-[calc(100vh-16px)] max-w-none max-h-none"
      hideExpandButton={true}
      breadcrumbParent={currentSection === 'Edit Membership' || currentSection === 'Add Shipping Address' ? 'Billing and Plans' : undefined}
      onBreadcrumbParentClick={currentSection === 'Edit Membership' || currentSection === 'Add Shipping Address' ? () => handleSectionChange('Billing and Plans') : undefined}
    >
      {renderSectionContent()}
    </ExpandableDialog>
  )
}