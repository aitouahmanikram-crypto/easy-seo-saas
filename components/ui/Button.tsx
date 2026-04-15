import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'google'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20",
      secondary: "bg-brand-100 text-brand-700 hover:bg-brand-200",
      outline: "border border-gray-200 bg-transparent hover:bg-gray-50 text-gray-700",
      ghost: "hover:bg-gray-100 text-gray-600",
      google: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-3"
    }
    
    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-6 py-2.5 text-base",
      lg: "px-8 py-4 text-lg"
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
