import * as React from 'react'
import { Maximize, Minimize, User } from 'lucide-react'
import { Button } from '../../components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../components/dialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../components/breadcrumb'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '../../components/sidebar'
import { cn } from '../../lib/utils'

export interface ExpandableDialogItem {
  id: string
  name: string
  icon?: React.ComponentType<any>
}

export interface ExpandableDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  children?: React.ReactNode
  title?: string
  description?: string
  sidebarItems?: ExpandableDialogItem[]
  activeSection?: string
  onSectionChange?: (section: string) => void
  hideExpandButton?: boolean
  breadcrumbParent?: string
  onBreadcrumbParentClick?: () => void
}

export function ExpandableDialog({
  open = true,
  onOpenChange,
  className,
  children,
  title = "Expandable Dialog",
  description = "A dialog with expandable content and sidebar navigation",
  sidebarItems = [
    {
      id: 'information',
      name: 'Information',
      icon: User
    }
  ],
  activeSection = 'Information',
  onSectionChange,
  hideExpandButton = false,
  breadcrumbParent,
  onBreadcrumbParentClick
}: ExpandableDialogProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(hideExpandButton)
  const [currentSection, setCurrentSection] = React.useState(activeSection)

  // Update current section when activeSection prop changes
  React.useEffect(() => {
    setCurrentSection(activeSection)
  }, [activeSection])

  const handleSectionChange = (section: string) => {
    setCurrentSection(section)
    onSectionChange?.(section)
  }

  const getCurrentBreadcrumb = () => {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">{title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          {breadcrumbParent && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault()
                    onBreadcrumbParentClick?.()
                  }}
                >
                  {breadcrumbParent}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{currentSection}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const renderContent = () => {
    return children || null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 bg-card flex flex-col overflow-hidden",
          isFullscreen 
            ? "w-[calc(100vw-16px)] h-[calc(100vh-16px)] max-w-none max-h-none" 
            : "md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]",
          className
        )}
      >
        <DialogTitle className="sr-only">
          {title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {description}
        </DialogDescription>
        <SidebarProvider className="items-start flex-1 flex">
          <Sidebar 
            collapsible="none" 
            className="hidden md:flex w-64 border-r border-sidebar-border dark:border-transparent"
          >
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.name === currentSection}
                        >
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault()
                              handleSectionChange(item.name)
                            }}
                          >
                            {item.icon && <item.icon />}
                            <span>{item.name}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main 
            className="flex flex-1 flex-col bg-card h-full min-h-0"
          >
            <header className="flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
              <div className="flex items-center gap-2 px-4">
                {!hideExpandButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>
                )}
                {getCurrentBreadcrumb()}
              </div>
            </header>
            <div className="flex flex-col gap-4 p-4 pt-0 flex-1 min-h-0 overflow-y-auto">
              {renderContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}