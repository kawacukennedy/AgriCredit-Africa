import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-98",
  {
    variants: {
      variant: {
        primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-level-1 hover:shadow-level-2",
        secondary: "bg-secondary-500 text-black hover:bg-secondary-600 active:bg-secondary-700",
        tertiary: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300",
        danger: "bg-error text-white hover:bg-error/90 active:bg-error",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900",
        link: "text-primary-500 underline-offset-4 hover:underline hover:text-primary-600",
        outline: "border border-neutral-300 bg-transparent hover:bg-neutral-50 text-neutral-900",
        default: "bg-neutral-900 text-white hover:bg-neutral-800",
      },
      size: {
        xs: "h-7 px-3 text-xs rounded-sm",
        sm: "h-8 px-4 text-sm rounded-md",
        md: "h-10 px-5 text-sm rounded-md",
        lg: "h-12 px-6 text-base rounded-lg",
        xl: "h-14 px-8 text-lg rounded-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }