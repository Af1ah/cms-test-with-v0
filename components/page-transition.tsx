"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { LoadingState } from "@/components/loading/loading-states"
import { cn } from "@/lib/utils"

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  // Remove the artificial delay and double buffering of children
  // This reduces TBT significantly
  return (
    <div className="animate-in fade-in duration-300">
      {children}
    </div>
  )
}

export function NavigationLoader() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Only show loader if transition takes more than 100ms
    const timer = setTimeout(() => setIsLoading(true), 100)
    // Hide immediately on pathname change
    return () => {
      clearTimeout(timer)
      setIsLoading(false)
    }
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-muted z-50">
      <div className="h-full bg-primary animate-pulse" style={{
        width: '30%',
        animation: 'loading-bar 1s ease-in-out infinite'
      }} />
      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
