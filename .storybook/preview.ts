import type { Preview } from '@storybook/react'
import * as React from 'react'
import '../apps/web/src/index.css'

const withTheme = (Story, context) => {
  const theme = context.globals.theme || 'light'
  
  React.useEffect(() => {
    const htmlEl = document.documentElement
    htmlEl.classList.remove('light', 'dark')
    htmlEl.classList.add(theme)
  }, [theme])

  return React.createElement(Story)
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f0f23',
        },
      ],
    },
    docs: {
      toc: true,
    },
    layout: 'padded',
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        showName: true,
      },
    },
  },
  decorators: [withTheme],
}

export default preview