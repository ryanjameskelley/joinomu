"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Activity,
  Scale,
  Moon,
  Dumbbell,
  Pill,
  Heart,
  LifeBuoy,
  Send,
  MessageCircle,
  Users,
  Stethoscope,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./sidebar"

// JoinOmu Logo Component
function JoinOmuLogo({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="6" cy="18" r="6" fill="currentColor"/>
      <path d="M6 3C6 1.34315 7.34315 0 9 0V0C10.6569 0 12 1.34315 12 3V12H6V3Z" fill="currentColor"/>
      <path d="M12 3C12 1.34315 13.3431 0 15 0V0C16.6569 0 18 1.34315 18 3V12H12V3Z" fill="currentColor"/>
      <path d="M12 12H24V18C24 21.3137 21.3137 24 18 24V24C14.6863 24 12 21.3137 12 18V12Z" fill="currentColor"/>
    </svg>
  )
}

// Role-specific navigation data
const getNavigationData = (userRole: "patient" | "admin" | "provider") => {
  const baseData = {
    user: {
      name: "John Doe",
      email: "john@example.com",
      avatar: "",
    },
    navSecondary: [
      {
        title: "Support",
        url: "#",
        icon: LifeBuoy,
      },
      {
        title: "Feedback",
        url: "#",
        icon: Send,
      },
    ],
  }

  if (userRole === "admin" || userRole === "provider") {
    return {
      ...baseData,
      navMain: [
        {
          title: "Dashboard",
          url: "#",
          icon: LayoutDashboard,
          isActive: true,
        },
        {
          title: "Patients",
          url: "#",
          icon: Users,
        },
        {
          title: "Messaging",
          url: "#",
          icon: MessageCircle,
        },
      ],
      projects: [], // No projects for admin/provider
    }
  }

  // Patient navigation (default)
  return {
    ...baseData,
    navMain: [
      {
        title: "Dashboard",
        url: "#",
        icon: LayoutDashboard,
        isActive: true,
      },
      {
        title: "Treatments",
        url: "/treatments",
        icon: Stethoscope,
      },
      {
        title: "Messaging",
        url: "#",
        icon: MessageCircle,
      },
      {
        title: "Tracking",
        url: "#",
        icon: Activity,
        items: [
          {
            title: "All",
            url: "#",
          },
          {
            title: "Weight",
            url: "#",
          },
          {
            title: "Sleep",
            url: "#",
          },
          {
            title: "Exercise",
            url: "#",
          },
        ],
      },
    ],
    projects: [
      {
        name: "WeightLoss",
        url: "/treatments/weightloss",
        icon: Pill,
      },
      {
        name: "Mens Health",
        url: "/treatments/mens-health",
        icon: Heart,
      },
    ],
  }
}

export function AppSidebar({ 
  user,
  onLogout,
  onNavigate,
  userRole = "patient",
  ...props 
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  onLogout?: () => void
  onNavigate?: (item: string) => void
  userRole?: "patient" | "admin" | "provider"
}) {
  // Get role-specific navigation data
  const navigationData = getNavigationData(userRole)
  
  // Use provided user data or fallback to default
  const userData = user || navigationData.user

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <JoinOmuLogo className="size-8" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">JoinOmu</span>
                  <span className="truncate text-xs">Healthcare</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData.navMain} onNavigate={onNavigate} />
        <NavProjects projects={navigationData.projects} onNavigate={onNavigate} />
        <NavSecondary items={navigationData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser 
          user={{
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar || ""
          }} 
          onLogout={onLogout}
        />
      </SidebarFooter>
    </Sidebar>
  )
}