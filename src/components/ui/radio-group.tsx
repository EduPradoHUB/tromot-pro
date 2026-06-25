import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupContextType {
  value: string
  onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextType | null>(null)

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange }}>
        <div
          ref={ref}
          role="radiogroup"
          className={cn("grid gap-2", className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value: string
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, disabled, onChange, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext)
    const isChecked = context?.value === value

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event)

      if (!event.defaultPrevented && !disabled) {
        context?.onValueChange(value)
      }
    }

    return (
      <label
        htmlFor={id}
        onClick={() => {
          if (!disabled) {
            context?.onValueChange(value)
          }
        }}
        className={cn(
          "relative inline-flex items-center cursor-pointer",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          type="radio"
          ref={ref}
          id={id}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          value={value}
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            isChecked ? "bg-primary" : "bg-background",
            className
          )}
        >
          {isChecked && (
            <div className="flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
            </div>
          )}
        </span>
      </label>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }