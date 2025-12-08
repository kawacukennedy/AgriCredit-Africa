import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const iconButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-98",
  {
    variants: {
      variant: {
        primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-level-1 hover:shadow-level-2",
        secondary: "bg-secondary-500 text-black hover:bg-secondary-600 active:bg-secondary-700",
        tertiary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300",
        danger: "bg-error text-white hover:bg-error/90 active:bg-error",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900",
      },
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  asChild?: boolean
  loading?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(iconButtonVariants({ variant, size }), className)}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <div className="animate-spin rounded-full border-2 border-current border-t-transparent h-4 w-4" />
        ) : (
          children
        )}
      </Comp>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }