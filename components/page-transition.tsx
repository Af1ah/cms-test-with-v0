"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { LoadingState } from "@/components/loading/loading-states"
import { cn } from "@/lib/utils"

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  const pathname = usePathname()

  useEffect(() => {
    setIsTransitioning(true)
    
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsTransitioning(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [children, pathname])

  return (
    <div className={cn(
      "transition-opacity duration-150 ease-in-out",
      isTransitioning ? "opacity-0" : "opacity-100"
    )}>
      {isTransitioning ? (
        <LoadingState 
          type="pulse" 
          text="Loading..." 
          className="min-h-[200px]"
        />
      ) : (
        displayChildren
      )}
    </div>
  )
}

export function NavigationLoader() {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
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
