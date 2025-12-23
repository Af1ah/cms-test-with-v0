import { Header } from "@/components/header"
import { PosterGrid } from "@/components/poster-grid"
import { Button } from "@/components/ui/button"
import Link from "next/link"
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

export default async function HomePage() {
  // Initialize database and fetch featured posters
  await initializeDatabase()

  const featuredPosters = await query<Poster>(
    "SELECT * FROM posters ORDER BY created_at DESC LIMIT 8"
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            Discover Amazing <span className="text-primary">Poster Art</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty mb-8">
            Explore our curated collection of stunning posters from talented artists around the world. Find the perfect
            piece for your space.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/gallery">Browse Gallery</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Posters */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Posters</h2>
            <p className="text-muted-foreground text-lg">Check out our latest and most popular poster designs</p>
          </div>

          <PosterGrid posters={featuredPosters.map(p => ({ ...p, id: String(p.id) })) || []} />

          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg">
              <Link href="/gallery">View All Posters</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
