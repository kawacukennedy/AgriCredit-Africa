import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "./button"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'segmented' | 'attached'
  size?: ButtonProps['size']
  children: React.ReactElement<ButtonProps>[]
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, variant = 'segmented', size, children, ...props }, ref) => {
    const childrenWithProps = React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child) || child.type !== Button) {
        return child
      }

      const isFirst = index === 0
      const isLast = index === children.length - 1

      let buttonClassName = child.props.className || ''

      if (variant === 'segmented') {
        if (!isFirst) {
          buttonClassName += ' border-l-0'
        }
        if (!isFirst && !isLast) {
          buttonClassName += ' rounded-none'
        } else if (isFirst) {
          buttonClassName += ' rounded-r-none'
        } else if (isLast) {
          buttonClassName += ' rounded-l-none'
        }
      } else if (variant === 'attached') {
        if (!isFirst) {
          buttonClassName += ' border-l-0'
        }
        buttonClassName += ' rounded-none'
      }

      return React.cloneElement(child, {
        ...child.props,
        size: size || child.props.size,
        className: buttonClassName,
      })
    })

    return (
      <div
        ref={ref}
        className={cn("inline-flex", className)}
        {...props}
      >
        {childrenWithProps}
      </div>
    )
  }
)

ButtonGroup.displayName = "ButtonGroup"

export { ButtonGroup }