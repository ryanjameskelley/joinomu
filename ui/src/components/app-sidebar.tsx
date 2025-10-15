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
        title: "Tracking",
        url: "#",
        icon: Activity,
      },
    ],
    projects: [],
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
  onAccountClick?: () => void
  onBillingClick?: () => void
  onPreferencesClick?: () => void
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
          onAccountClick={props.onAccountClick}
          onBillingClick={props.onBillingClick}
          onPreferencesClick={props.onPreferencesClick}
        />
      </SidebarFooter>
    </Sidebar>
  )
}