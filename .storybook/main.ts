import type { StorybookConfig } from '@storybook/react-vite'
import { join, dirname } from 'path'

const config: StorybookConfig = {
  stories: [
    './*.stories.@(js|jsx|mjs|ts|tsx)',
    './stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../apps/web/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    {
      name: '@storybook/addon-essentials',
      options: {
        viewport: true,
      }
    },
    '@storybook/addon-viewport',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    // Configure Vite to resolve the monorepo packages
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@joinomu/ui': join(dirname(__filename), '../ui/src'),
      '@joinomu/shared': join(dirname(__filename), '../shared/src'),
      // Add path aliases for @ imports
      '@/utils': join(dirname(__filename), '../apps/web/src/utils'),
      '@/ui': join(dirname(__filename), '../apps/web/src/ui'),
      '@': join(dirname(__filename), '../apps/web/src'),
    }
    
    // Ensure PostCSS processes Tailwind properly
    config.css = config.css || {}
    config.css.postcss = join(dirname(__filename), '../postcss.config.js')
    
    return config
  },
  typescript: {
    check: false,
    reactDocgen: false, // Disable react-docgen to avoid dependency issues
  },
}

export default config