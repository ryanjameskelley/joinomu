import type { Meta, StoryObj } from '@storybook/react'
import { PatientDashboard } from './patient-dashboard'
import { action } from '@storybook/addon-actions'

const meta: Meta<typeof PatientDashboard> = {
  title: 'Atomic/Pages/Blank Dashboard',
  component: PatientDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Blank patient dashboard showing the basic layout with sidebar navigation and placeholder content areas.',
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
      description: 'User information for sidebar display',
    },
    onLogout: {
      action: 'logout-clicked',
      description: 'Callback when logout is clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample user data
const sampleUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: ''
}

export const Default: Story = {
  args: {
    user: sampleUser,
    isOnboarded: true,
    onLogout: action('logout-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic blank dashboard with sidebar navigation and empty content areas. Shows the foundational layout structure.',
      },
    },
  },
}

export const WithoutUser: Story = {
  args: {
    isOnboarded: true,
    onLogout: action('logout-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Blank dashboard without user data, showing fallback user information in sidebar.',
      },
    },
  },
}

export const MobileBlankView: Story = {
  args: {
    user: sampleUser,
    isOnboarded: true,
    onLogout: action('logout-clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Blank dashboard optimized for mobile view with collapsed sidebar navigation.',
      },
    },
  },
}

export const TabletBlankView: Story = {
  args: {
    user: sampleUser,
    isOnboarded: true,
    onLogout: action('logout-clicked'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Blank dashboard optimized for tablet view showing responsive behavior.',
      },
    },
  },
}