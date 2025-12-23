import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  variant?: "primary" | "secondary" | "white"
}

export function Spinner({ 
  size = "md", 
  variant = "primary",
  className,
  ...props 
}: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }
  
  const variantClasses = {
    primary: "border-primary",
    secondary: "border-muted-foreground",
    white: "border-white"
  }
  
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-solid border-transparent",
        sizeClasses[size],
        `${variantClasses[variant]} border-t-transparent`,
        className
      )}
      {...props}
    />
  )
}

export function LoadingDots({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex space-x-1", className)} {...props}>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
    </div>
  )
}

export function PulseLoader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-block h-4 w-4 animate-pulse rounded-full bg-current",
        className
      )}
      {...props}
    />
  )
}
