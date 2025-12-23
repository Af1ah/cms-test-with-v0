import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { query, initializeDatabase } from "@/lib/db"
import DeletePosterClient from "./delete-client"
import { PosterErrorBoundary } from "@/components/error-boundary-enhanced"

interface Poster {
  id: number
  title: string
  description: string | null
  image_url: string
  category: string | null
  featured: boolean
  created_at: string
}

interface DeletePosterPageProps {
  params: Promise<{ id: string }>
}

export default async function DeletePosterPage({ params }: DeletePosterPageProps) {
  const { id } = await params

  // Check authentication
  const user = await getCurrentUser()
  if (!user) {
    redirect("/admin/login")
  }

  // Initialize database
  await initializeDatabase()

  // Fetch poster data server-side
  let poster: Poster | null = null
  try {
    const posters = await query<Poster>(
      "SELECT * FROM posters WHERE id = $1",
      [id]
    )
    poster = posters[0] || null
  } catch (error) {
    console.error('Error loading poster:', error)
  }

  return (
    <PosterErrorBoundary>
      <DeletePosterClient poster={poster} posterId={id} />
    </PosterErrorBoundary>
  )
}
