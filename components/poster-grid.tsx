"use client"
import { PosterCard } from "./poster-card"

interface Poster {
  id: string
  title: string
  description?: string | null
  image_url: string
  category?: string | null
  created_at: string
}

interface PosterGridProps {
  posters: Poster[]
  priorityCount?: number // How many posters to prioritize for immediate loading
}

export function PosterGrid({
  posters,
  priorityCount = 4,
}: PosterGridProps) {
  if (posters.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No posters found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {posters.map((poster, index) => (
        <PosterCard
          key={poster.id}
          poster={poster}
          priority={index < priorityCount}
        />
      ))}
    </div>
  )
}
