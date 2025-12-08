import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./dialog"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'center' | 'side' | 'fullscreen'
  showCloseButton?: boolean
  className?: string
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    variant = 'center',
    showCloseButton = true,
    className,
    ...props
  }, ref) => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    }

    const variantClasses = {
      center: '',
      side: 'left-1/2 top-0 h-full w-full max-w-lg -translate-x-1/2 -translate-y-0 data-[state=open]:slide-in-from-right-full data-[state=closed]:slide-out-to-right-full',
      fullscreen: 'inset-0 h-full w-full max-w-none rounded-none',
    }

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          ref={ref}
          className={cn(
            'gap-0 p-0',
            sizeClasses[size],
            variantClasses[variant],
            className
          )}
          {...props}
        >
          {(title || description) && (
            <DialogHeader className="border-b border-neutral-200 p-lg">
              {title && <DialogTitle className="text-h4">{title}</DialogTitle>}
              {description && <DialogDescription className="text-body_small text-neutral-600">{description}</DialogDescription>}
            </DialogHeader>
          )}

          <div className="flex-1 overflow-auto p-lg">
            {children}
          </div>

          {showCloseButton && (
            <DialogClose className="absolute right-lg top-lg rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogClose>
          )}
        </DialogContent>
      </Dialog>
    )
  }
)

Modal.displayName = "Modal"

export { Modal }