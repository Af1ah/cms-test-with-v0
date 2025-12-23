import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { query, initializeDatabase } from "@/lib/db"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

// Admin pages should be dynamic (SSR) for fresh data
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

export default async function AdminPostersPage() {
  // Check authentication
  const user = await getCurrentUser()
  if (!user) {
    redirect("/admin/login")
  }

  // Initialize database and get all posters
  await initializeDatabase()
  const posters = await query<Poster>(
    "SELECT * FROM posters ORDER BY created_at DESC"
  )

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="Admin Dashboard" />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Manage Posters</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Add, edit, or remove posters from your gallery</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/posters/new">Add New Poster</Link>
          </Button>
        </div>

        {posters && posters.length > 0 ? (
          <div className="grid gap-4 sm:gap-6">
            {posters.map((poster) => (
              <Card key={poster.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="relative w-full sm:w-24 h-48 sm:h-32 flex-shrink-0 mx-auto sm:mx-0 max-w-32">
                      <Image
                        src={poster.image_url || "/placeholder.svg"}
                        alt={poster.title}
                        fill
                        className="object-cover rounded-md"
                        sizes="(max-width: 640px) 128px, 96px"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-2 mb-3">
                        <h3 className="text-lg sm:text-xl font-semibold truncate">{poster.title}</h3>
                        <div className="flex gap-2 justify-center sm:justify-start flex-shrink-0">
                          <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-initial">
                            <Link href={`/admin/posters/${poster.id}/edit`}>Edit</Link>
                          </Button>
                          <Button asChild variant="destructive" size="sm" className="flex-1 sm:flex-initial">
                            <Link href={`/admin/posters/${poster.id}/delete`}>Delete</Link>
                          </Button>
                        </div>
                      </div>
                      {poster.description && <p className="text-muted-foreground mb-3 text-sm sm:text-base line-clamp-2">{poster.description}</p>}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        {poster.category && <Badge variant="secondary" className="w-fit mx-auto sm:mx-0">{poster.category}</Badge>}
                        <span>Added {new Date(poster.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">No Posters Yet</CardTitle>
              <CardDescription className="text-sm">Get started by adding your first poster to the gallery</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/admin/posters/new">Add Your First Poster</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
