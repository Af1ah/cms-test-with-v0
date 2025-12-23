import { Header } from "@/components/header"
import GalleryClient from "../gallery/gallery-client"
import { query, initializeDatabase } from "@/lib/db"

// Force dynamic rendering since we use database queries
export const dynamic = 'force-dynamic'

interface Poster {
  id: number
  title: string
  description: string | null
  image_url: string
  category: string | null
  featured: boolean
  created_at: string
}

export default async function GalleryPage() {
  let posters: Poster[] = []
  let error: string | undefined

  try {
    // Initialize database
    await initializeDatabase()

    // Fetch posters from PostgreSQL
    posters = await query<Poster>(
      "SELECT * FROM posters ORDER BY created_at DESC"
    )
    console.log('🎯 Server-side loaded posters:', posters.length)
  } catch (err) {
    console.error("Error loading posters:", err)
    error = err instanceof Error ? err.message : "Failed to load posters"
  }

  // Extract unique categories server-side
  const categories = Array.from(
    new Set(posters.map((poster) => poster.category).filter(Boolean) || []),
  ) as string[]

  // Convert id to string for component compatibility
  const postersWithStringId = posters.map(p => ({ ...p, id: String(p.id) }))

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <GalleryClient
        initialPosters={postersWithStringId}
        initialCategories={categories}
        error={error}
      />
    </div>
  )
}
