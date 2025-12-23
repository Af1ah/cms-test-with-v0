import { create } from "zustand"

interface LoadingStore {
  isLoading: boolean
  loadingMessage: string
  loadingOperations: Set<string>
  startLoading: (operation: string, message?: string) => void
  stopLoading: (operation: string) => void
  setGlobalLoading: (loading: boolean, message?: string) => void
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  isLoading: false,
  loadingMessage: "Loading...",
  loadingOperations: new Set(),

  startLoading: (operation: string, message?: string) => {
    const operations = new Set(get().loadingOperations)
    operations.add(operation)

    set({
      loadingOperations: operations,
      isLoading: true,
      loadingMessage: message || "Loading...",
    })
  },

  stopLoading: (operation: string) => {
    const operations = new Set(get().loadingOperations)
    operations.delete(operation)

    set({
      loadingOperations: operations,
      isLoading: operations.size > 0,
    })
  },

  setGlobalLoading: (loading: boolean, message?: string) => {
    set({
      isLoading: loading,
      loadingMessage: message || "Loading...",
    })
  },
}))

export function useLoading() {
  const { startLoading, stopLoading, setGlobalLoading } = useLoadingStore()

  return {
    startLoading,
    stopLoading,
    setGlobalLoading,
    withLoading: async <T,>(operation: string, asyncFn: () => Promise<T>, message?: string): Promise<T> => {
      startLoading(operation, message)
      try {
        const result = await asyncFn()
        return result
      } finally {
        stopLoading(operation)
      }
    },
  }
}
