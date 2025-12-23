"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function PerformanceMonitor() {
  const pathname = usePathname()

  useEffect(() => {
    // Log page navigation timing
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            console.log('[Performance] Page load metrics:', {
              path: pathname,
              domComplete: Math.round(navEntry.domComplete),
              loadComplete: Math.round(navEntry.loadEventEnd),
              firstContentfulPaint: Math.round(navEntry.domContentLoadedEventEnd)
            })
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('[Performance] LCP:', Math.round(entry.startTime))
          }
          
          if (entry.entryType === 'layout-shift') {
            const clsEntry = entry as PerformanceEntry & { value: number }
            if (clsEntry.value > 0.1) {
              console.warn('[Performance] CLS detected:', clsEntry.value)
            }
          }
        }
      })

      try {
        observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'layout-shift'] })
      } catch (e) {
        // Fallback for browsers that don't support all entry types
        observer.observe({ entryTypes: ['navigation'] })
      }

      return () => observer.disconnect()
    }
  }, [pathname])

  useEffect(() => {
    // Monitor route changes
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      console.log(`[Performance] Route transition to ${pathname}: ${Math.round(end - start)}ms`)
    }
  }, [pathname])

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return null
}

// Hook for measuring component render time
export function useRenderTime(componentName: string) {
  useEffect(() => {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      if (end - start > 16) { // Only log if render took longer than 1 frame (16ms)
        console.log(`[Performance] ${componentName} render: ${Math.round(end - start)}ms`)
      }
    }
  })
}

// Hook for measuring async operations
export function useMeasure() {
  return {
    start: (name: string) => performance.mark(`${name}-start`),
    end: (name: string) => {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      const measure = performance.getEntriesByName(name)[0]
      console.log(`[Performance] ${name}: ${Math.round(measure.duration)}ms`)
      performance.clearMarks(`${name}-start`)
      performance.clearMarks(`${name}-end`)
      performance.clearMeasures(name)
    }
  }
}
