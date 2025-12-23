"use client"

import { PosterGrid } from "@/components/poster-grid"
import { CategoryFilter } from "@/components/category-filter"
import { useState, useMemo, useCallback } from "react"

interface Poster {
  id: string
  title: string
  description?: string | null
  image_url: string
  category?: string | null
  created_at: string
}

interface GalleryClientProps {
  initialPosters: Poster[]
  initialCategories: string[]
  error?: string
}

export default function GalleryClient({
  initialPosters,
  initialCategories,
  error: initialError
}: GalleryClientProps) {
  const [posters, setPosters] = useState<Poster[]>(initialPosters)
  const [categories, setCategories] = useState<string[]>(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)

  // Memoize filtered posters for better performance
  const filteredPosters = useMemo(() => {
    if (selectedCategory === null) {
      return posters
    }
    return posters.filter((poster) => poster.category === selectedCategory)
  }, [selectedCategory, posters])

  const loadPosters = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/posters')
      if (!response.ok) {
        throw new Error('Failed to fetch posters')
      }

      const postersData = await response.json()

      if (postersData) {
        console.log('🔄 Reloaded posters:', postersData.length)
        // Convert id to string for consistency
        const normalizedPosters = postersData.map((p: Poster & { id: number | string }) => ({
          ...p,
          id: String(p.id)
        }))
        setPosters(normalizedPosters)

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(normalizedPosters.map((poster: Poster) => poster.category).filter(Boolean)),
        ) as string[]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error("Error loading posters:", error)
      setError(error instanceof Error ? error.message : "Failed to load posters")
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (error && !posters.length) {
    return (
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-destructive">Error Loading Gallery</h1>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">{error}</p>
          <button
            onClick={loadPosters}
            disabled={isLoading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Try Again"}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Poster Gallery</h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto text-pretty px-4">
          Browse through our complete collection of beautiful poster designs. Each piece tells a unique story and
          brings character to any space.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      )}

      <PosterGrid posters={filteredPosters} />

      {selectedCategory && filteredPosters.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <p className="text-muted-foreground text-base sm:text-lg">No posters found in the "{selectedCategory}" category.</p>
        </div>
      )}

      {!posters.length && !error && (
        <div className="text-center py-8 sm:py-12">
          <p className="text-muted-foreground text-base sm:text-lg">No posters available yet.</p>
        </div>
      )}
    </main>
  )
}
