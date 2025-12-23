import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { query, initializeDatabase } from "@/lib/db"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface Poster {
  id: number
  title: string
  description: string | null
  image_url: string
  category: string | null
  featured: boolean
  created_at: string
}

export default async function AdminDashboardPage() {
  // Check authentication
  const user = await getCurrentUser()
  if (!user) {
    redirect("/admin/login")
  }

  // Initialize database and get statistics
  await initializeDatabase()

  const countResult = await query<{ count: string }>("SELECT COUNT(*) as count FROM posters")
  const totalPosters = parseInt(countResult[0]?.count || '0')

  const recentPosters = await query<Poster>(
    "SELECT * FROM posters ORDER BY created_at DESC LIMIT 5"
  )

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="Admin Dashboard" />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome, {user.name || user.email}! Manage your poster gallery.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{totalPosters}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{recentPosters.length}</div>
              <p className="text-xs text-muted-foreground">Last 5 uploads</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/posters/new">Add New Poster</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Manage Posters</CardTitle>
              <CardDescription className="text-sm">Add, edit, or remove posters from your gallery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <Button asChild className="w-full">
                <Link href="/admin/posters/new">Add New Poster</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/admin/posters">View All Posters</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
              <CardDescription className="text-sm">Latest posters added to the gallery</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPosters.length > 0 ? (
                <div className="space-y-3">
                  {recentPosters.map((poster) => (
                    <div key={poster.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-sm border-b border-muted/20 pb-2">
                      <span className="truncate font-medium">{poster.title}</span>
                      <span className="text-muted-foreground text-xs sm:text-sm flex-shrink-0">{new Date(poster.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No posters yet. Add your first poster!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
