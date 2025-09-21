import type { Meta, StoryObj } from '@storybook/react'
import { ProviderDashboard } from './provider-dashboard'
import { action } from '@storybook/addon-actions'

const meta: Meta<typeof ProviderDashboard> = {
  title: 'Atomic/Pages/Providers',
  component: ProviderDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Provider dashboard with JoinOmu sidebar navigation, logo, and profile section for Dashboard, Patients, and Messaging.',
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
        wide: {
          name: 'Wide Desktop',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
      defaultViewport: 'desktop',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    user: {
      control: 'object',
      description: 'Provider user information for sidebar display',
    },
    onLogout: {
      action: 'logout-clicked',
      description: 'Callback when logout is clicked',
    },
    activeItem: {
      control: 'select',
      options: ['Dashboard', 'Patients', 'Messaging'],
      description: 'Currently active navigation item',
    },
    showPatientTable: {
      control: 'boolean',
      description: 'Whether to show patient table or dashboard content',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample provider user data
const sampleProviderUser = {
  name: 'Dr. Michael Chen',
  email: 'michael.chen@clinic.com',
  avatar: ''
}

export const Dashboard: Story = {
  args: {
    user: sampleProviderUser,
    activeItem: 'Dashboard',
    onLogout: action('logout-clicked'),
    showPatientTable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider dashboard view with JoinOmu branding and navigation focused on Dashboard.',
      },
    },
  },
}

export const Patients: Story = {
  args: {
    user: sampleProviderUser,
    activeItem: 'Patients',
    onLogout: action('logout-clicked'),
    showPatientTable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider patients view showing the patient table for patient management.',
      },
    },
  },
}

export const Messaging: Story = {
  args: {
    user: sampleProviderUser,
    activeItem: 'Messaging',
    onLogout: action('logout-clicked'),
    showPatientTable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Provider messaging view with JoinOmu sidebar layout.',
      },
    },
  },
}