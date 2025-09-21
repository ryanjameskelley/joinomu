import type { Meta, StoryObj } from '@storybook/react'
import { AdminDashboard } from './admin-dashboard'
import { action } from '@storybook/addon-actions'
import * as React from 'react'

// Enhanced component that handles navigation between pages
function AdminDashboardWithNavigation(props: any) {
  const [activeItem, setActiveItem] = React.useState(props.activeItem || 'Dashboard')
  
  const handleNavigate = (item: string) => {
    setActiveItem(item)
    action('navigate')(item)
  }

  return (
    <AdminDashboard
      {...props}
      activeItem={activeItem}
      showPatientTable={activeItem === 'Patients'}
      onNavigate={handleNavigate}
    />
  )
}

const meta: Meta<typeof AdminDashboardWithNavigation> = {
  title: 'Atomic/Pages/Admins',
  component: AdminDashboardWithNavigation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Admin dashboard with JoinOmu sidebar navigation, logo, and profile section for Dashboard, Patients, and Messaging.',
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
      description: 'Admin user information for sidebar display',
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

// Sample admin user data
const sampleAdminUser = {
  name: 'Dr. Sarah Wilson',
  email: 'sarah.wilson@hospital.com',
  avatar: ''
}

export const Dashboard: Story = {
  args: {
    user: sampleAdminUser,
    activeItem: 'Dashboard',
    onLogout: action('logout-clicked'),
    showPatientTable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin dashboard view with JoinOmu branding and navigation focused on Dashboard.',
      },
    },
  },
}

export const Patients: Story = {
  args: {
    user: sampleAdminUser,
    activeItem: 'Patients',
    onLogout: action('logout-clicked'),
    showPatientTable: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin patients view showing the patient table for patient management.',
      },
    },
  },
}

export const Messaging: Story = {
  args: {
    user: sampleAdminUser,
    activeItem: 'Messaging',
    onLogout: action('logout-clicked'),
    showPatientTable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Admin messaging view with JoinOmu sidebar layout.',
      },
    },
  },
}