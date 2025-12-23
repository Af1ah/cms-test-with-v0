"use client"

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react"

interface LoadingState {
  auth: boolean
  crud: boolean
  navigation: boolean
  validation: boolean
  [key: string]: boolean
}

interface GlobalLoadingContextType {
  loadingStates: LoadingState
  setLoading: (key: keyof LoadingState | string, isLoading: boolean) => void
  isAnyLoading: boolean
  clearAllLoading: () => void
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined)

const initialState: LoadingState = {
  auth: false,
  crud: false,
  navigation: false,
  validation: false,
}

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(initialState)

  const setLoading = useCallback((key: keyof LoadingState | string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }, [])

  const clearAllLoading = useCallback(() => {
    setLoadingStates(initialState)
  }, [])

  const isAnyLoading = useMemo(() => {
    return Object.values(loadingStates).some(Boolean)
  }, [loadingStates])

  const value = useMemo(() => ({
    loadingStates,
    setLoading,
    isAnyLoading,
    clearAllLoading,
  }), [loadingStates, setLoading, isAnyLoading, clearAllLoading])

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
    </GlobalLoadingContext.Provider>
  )
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext)
  if (context === undefined) {
    throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider")
  }
  return context
}

// Hook for specific loading states
export function useLoadingState(key: keyof LoadingState | string) {
  const { loadingStates, setLoading } = useGlobalLoading()
  
  const isLoading = loadingStates[key] || false
  
  const setLoadingState = useCallback((loading: boolean) => {
    setLoading(key, loading)
  }, [key, setLoading])

  return [isLoading, setLoadingState] as const
}
