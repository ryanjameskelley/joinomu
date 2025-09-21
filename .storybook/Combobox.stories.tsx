import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Combobox } from '@joinomu/ui'

const meta = {
  title: 'Atomic/Molecules/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: 'Array of options with value and label properties'
    },
    value: {
      control: 'text',
      description: 'Currently selected value'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when no option is selected'
    },
    searchPlaceholder: {
      control: 'text',
      description: 'Placeholder text for the search input'
    },
    emptyText: {
      control: 'text',
      description: 'Text to display when no options match the search'
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the combobox is disabled'
    },
  },
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

const frameworkOptions = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
]

// Default combobox
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState("")
    
    return (
      <Combobox
        options={frameworkOptions}
        value={value}
        onValueChange={setValue}
        placeholder="Select framework..."
        searchPlaceholder="Search framework..."
      />
    )
  },
}

// Pre-selected value
export const WithPreselectedValue: Story = {
  render: () => {
    const [value, setValue] = React.useState("next.js")
    
    return (
      <Combobox
        options={frameworkOptions}
        value={value}
        onValueChange={setValue}
        placeholder="Select framework..."
        searchPlaceholder="Search framework..."
      />
    )
  },
}

// Disabled state
export const Disabled: Story = {
  render: () => {
    return (
      <Combobox
        options={frameworkOptions}
        value=""
        placeholder="Select framework..."
        disabled={true}
      />
    )
  },
}