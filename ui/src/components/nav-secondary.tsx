"use client"

import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./sidebar"

export function NavSecondary({
  items,
  onItemClick,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
  onItemClick?: (itemTitle: string) => void
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild={!onItemClick} 
              size="sm"
              onClick={onItemClick ? () => onItemClick(item.title) : undefined}
            >
              {onItemClick ? (
                <div className="flex items-center gap-2 cursor-pointer">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </div>
              ) : (
                <a href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </a>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}