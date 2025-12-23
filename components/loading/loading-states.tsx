import { Spinner, LoadingDots } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  type?: "spinner" | "dots" | "pulse" | "skeleton"
  size?: "sm" | "md" | "lg"
  variant?: "primary" | "secondary" | "white"
  text?: string
  className?: string
  fullScreen?: boolean
  overlay?: boolean
}

export function LoadingState({ 
  type = "spinner",
  size = "md",
  variant = "primary",
  text,
  className,
  fullScreen = false,
  overlay = false
}: LoadingStateProps) {
  const LoadingComponent = () => {
    switch (type) {
      case "dots":
        return <LoadingDots className="text-current" />
      case "pulse":
        return <div className="animate-pulse rounded-full h-4 w-4 bg-current" />
      case "skeleton":
        return (
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        )
      default:
        return <Spinner size={size} variant={variant} />
    }
  }

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      fullScreen ? "min-h-screen" : "py-12",
      className
    )}>
      <LoadingComponent />
      {text && (
        <p className="text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        overlay ? "bg-background/80 backdrop-blur-sm" : "bg-background"
      )}>
        {content}
      </div>
    )
  }

  return content
}

export function InlineLoader({ 
  text = "Loading...",
  size = "sm",
  className 
}: {
  text?: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Spinner size={size} />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  )
}

// Enhanced loading states for specific operations
export function AuthLoader({ text = "Authenticating..." }: { text?: string }) {
  return (
    <LoadingState 
      type="spinner" 
      size="md" 
      variant="primary" 
      text={text}
      fullScreen
      overlay
    />
  )
}

export function CrudLoader({ 
  operation = "Processing", 
  fullScreen = false 
}: { 
  operation?: string
  fullScreen?: boolean 
}) {
  return (
    <LoadingState 
      type="dots" 
      size="md" 
      variant="primary" 
      text={`${operation}...`}
      fullScreen={fullScreen}
      overlay={fullScreen}
    />
  )
}

export function ValidationLoader({ text = "Validating..." }: { text?: string }) {
  return (
    <InlineLoader text={text} size="sm" />
  )
}

export function ButtonLoader({ 
  text = "Please wait...",
  size = "sm" 
}: { 
  text?: string
  size?: "sm" | "md" | "lg" 
}) {
  return (
    <div className="flex items-center gap-2">
      <Spinner size={size} variant="white" />
      <span>{text}</span>
    </div>
  )
}
