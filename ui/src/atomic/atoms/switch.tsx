import * as React from "react"
import { Switch as SwitchPrimitive } from "../../components/switch"
import { Label } from "../../components/label"

export interface SwitchProps {
  id?: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  className?: string
}

export function Switch({
  id,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  label,
  description,
  className
}: SwitchProps) {
  return (
    <div className={`flex items-center space-x-3 ${className || ''}`}>
      <SwitchPrimitive
        id={id}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      {(label || description) && (
        <div className="grid gap-1.5 leading-none">
          {label && (
            <Label
              htmlFor={id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
            </Label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}