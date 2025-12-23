import { useEffect, useState } from "react"

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  networkRequests: number
  cacheHits: number
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    networkRequests: 0,
    cacheHits: 0,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach((entry) => {
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming
          setMetrics(prev => ({
            ...prev,
            loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
          }))
        }
        
        if (entry.entryType === "measure") {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration,
          }))
        }
      })
    })

    observer.observe({ entryTypes: ["navigation", "measure"] })

    return () => observer.disconnect()
  }, [])

  return metrics
}

// Hook for measuring component render time
export function useMeasureRender(componentName: string) {
  useEffect(() => {
    if (typeof window === "undefined") return

    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      if (renderTime > 16) { // Log slow renders (>16ms)
        console.warn(`Slow render detected for ${componentName}: ${renderTime.toFixed(2)}ms`)
      }

      // Mark the render for performance monitoring
      performance.mark(`${componentName}-render-end`)
      performance.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      )
    }
  })

  useEffect(() => {
    performance.mark(`${componentName}-render-start`)
  }, [componentName])
}

// Detect slow interactions
export function useSlowInteractionDetector() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleClick = (e: Event) => {
      const startTime = performance.now()
      
      // Use requestIdleCallback to measure after the interaction
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          const endTime = performance.now()
          const duration = endTime - startTime
          
          if (duration > 100) { // Log interactions >100ms
            console.warn(`Slow interaction detected: ${duration.toFixed(2)}ms`, e.target)
          }
        })
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])
}

// Cache management for better performance
export const createCache = <T>() => {
  const cache = new Map<string, { data: T; timestamp: number }>()
  const TTL = 5 * 60 * 1000 // 5 minutes

  return {
    get: (key: string): T | null => {
      const item = cache.get(key)
      if (!item) return null
      
      if (Date.now() - item.timestamp > TTL) {
        cache.delete(key)
        return null
      }
      
      return item.data
    },
    
    set: (key: string, data: T): void => {
      cache.set(key, { data, timestamp: Date.now() })
    },
    
    clear: (): void => {
      cache.clear()
    },
    
    size: (): number => {
      return cache.size
    }
  }
}

// Global cache instance for API responses
export const apiCache = createCache<any>()
