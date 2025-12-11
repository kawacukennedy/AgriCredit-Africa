import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: 'sm' | 'md' | 'lg';
  variant?: 'outlined' | 'filled' | 'standard';
  error?: boolean;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    inputSize = 'md',
    variant = 'outlined',
    error = false,
    helperText,
    startAdornment,
    endAdornment,
    ...props
  }, ref) => {
    const sizeClasses = {
      sm: 'h-8 px-3 py-1 text-sm',
      md: 'h-10 px-3 py-2 text-sm',
      lg: 'h-12 px-4 py-3 text-base',
    };

    const variantClasses = {
      outlined: 'border border-input bg-background focus:border-ring',
      filled: 'border-0 bg-muted focus:bg-background focus:border focus:border-ring',
      standard: 'border-0 border-b-2 border-input bg-transparent rounded-none px-0 focus:border-ring',
    };

    const errorClass = error ? 'border-destructive focus:border-destructive' : '';

    return (
      <div className="relative">
        <div className="relative">
          {startAdornment && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {startAdornment}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex w-full rounded-md bg-background text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              sizeClasses[inputSize || 'md'],
              variantClasses[variant],
              errorClass,
              startAdornment && 'pl-10',
              endAdornment && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {endAdornment}
            </div>
          )}
        </div>
        {helperText && (
          <p className={cn(
            "mt-1 text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }