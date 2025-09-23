"use client"

import * as React from "react"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "../lib/utils"
import { Button } from "./button"

export interface ChecklistItem {
  id: string
  title: string
  description?: string
  completed: boolean
  disabled?: boolean
}

export interface PatientChecklistProps {
  items: ChecklistItem[]
  onItemClick?: (item: ChecklistItem) => void
  className?: string
}

export function PatientChecklist({
  items,
  onItemClick,
  className
}: PatientChecklistProps) {
  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Complete Your Onboarding
          </h2>
          <p className="text-sm text-muted-foreground">
            Follow these steps to get started with your healthcare journey
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {items.map((item, index) => {
              const isFirst = index === 0
              const isLast = index === items.length - 1
              // Temporarily allow medication preferences (index 1) for testing
              const isDisabled = item.disabled || (!isFirst && !items[index - 1]?.completed && !(item.id === 'medication' && index === 1))
              
              return (
                <div key={item.id} className="relative flex items-start gap-4">
                  {/* Timeline node */}
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    <div
                      className={cn(
                        "h-6 w-6 rounded-full border-2 bg-background flex items-center justify-center transition-all",
                        item.completed
                          ? "border-primary bg-primary text-primary-foreground"
                          : isDisabled
                          ? "border-muted-foreground/30 bg-muted"
                          : "border-primary bg-background"
                      )}
                    >
                      {item.completed ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isDisabled
                              ? "text-muted-foreground/50"
                              : "text-primary"
                          )}
                        >
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div
                      className={cn(
                        "rounded-lg border p-4 transition-all",
                        item.completed
                          ? "bg-muted/50 border-muted"
                          : isDisabled
                          ? "bg-muted/30 border-muted"
                          : "bg-card border-border hover:border-border/80"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3
                            className={cn(
                              "text-sm font-medium leading-none",
                              isDisabled && "text-muted-foreground"
                            )}
                          >
                            {item.title}
                          </h3>
                          {item.description && (
                            <p
                              className={cn(
                                "text-sm text-muted-foreground",
                                isDisabled && "text-muted-foreground/60"
                              )}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>

                        <Button
                          variant={item.completed ? "outline" : "default"}
                          size="sm"
                          disabled={isDisabled}
                          onClick={() => onItemClick?.(item)}
                          className={cn(
                            "ml-4 shrink-0",
                            item.completed && "text-muted-foreground"
                          )}
                        >
                          {item.completed ? "View" : "Start"}
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Progress summary */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${(items.filter(item => item.completed).length / items.length) * 100}%`
                }}
              />
            </div>
            <span>
              {items.filter(item => item.completed).length} of {items.length} completed
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}