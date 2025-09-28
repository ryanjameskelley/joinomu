import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { AppWindowIcon, CodeIcon } from "lucide-react"

import { Button } from "@joinomu/ui"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@joinomu/ui"
import { Input } from "@joinomu/ui"
import { Label } from "@joinomu/ui"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@joinomu/ui"

const meta = {
  title: 'Atomic/Atoms/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export function TabsDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Make changes to your account here. Click save when you&apos;re
                done.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="tabs-demo-name">Name</Label>
                <Input id="tabs-demo-name" defaultValue="Pedro Duarte" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="tabs-demo-username">Username</Label>
                <Input id="tabs-demo-username" defaultValue="@peduarte" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password here. After saving, you&apos;ll be logged
                out.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="tabs-demo-current">Current password</Label>
                <Input id="tabs-demo-current" type="password" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="tabs-demo-new">New password</Label>
                <Input id="tabs-demo-new" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save password</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Default example using the provided TabsDemo component
export const Default: Story = {
  render: () => <TabsDemo />,
}

// Simple tabs example
export const Simple: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="mt-4">
        <div className="p-4 rounded-lg bg-muted">
          Content for Tab 1
        </div>
      </TabsContent>
      <TabsContent value="tab2" className="mt-4">
        <div className="p-4 rounded-lg bg-muted">
          Content for Tab 2
        </div>
      </TabsContent>
    </Tabs>
  ),
}

// Tabs with icons
export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="preview" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="preview" className="flex items-center gap-2">
          <AppWindowIcon className="h-4 w-4" />
          Preview
        </TabsTrigger>
        <TabsTrigger value="code" className="flex items-center gap-2">
          <CodeIcon className="h-4 w-4" />
          Code
        </TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="mt-4">
        <div className="p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Preview Mode</h3>
          <p className="text-muted-foreground">This is the preview content.</p>
        </div>
      </TabsContent>
      <TabsContent value="code" className="mt-4">
        <div className="p-6 rounded-lg border bg-muted font-mono text-sm">
          <h3 className="text-lg font-semibold mb-2">Code Mode</h3>
          <pre>{`<div>Hello World</div>`}</pre>
        </div>
      </TabsContent>
    </Tabs>
  ),
}