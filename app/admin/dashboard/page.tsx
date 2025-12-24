import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { query, initializeDatabase } from "@/lib/db"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { FileText, Upload, Users } from "lucide-react"

interface PaperCount {
  count: string
}

interface RecentPaper {
  id: number
  subject_name: string
  subject_code: string
  created_at: string
}

interface DeptCount {
  count: string
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/admin/login")
  }

  if (user.role !== "admin") {
    redirect("/admin/papers")
  }

  await initializeDatabase()

  // Get statistics
  const paperCountResult = await query<PaperCount>("SELECT COUNT(*) as count FROM question_papers")
  const totalPapers = parseInt(paperCountResult[0]?.count || '0')

  const deptCountResult = await query<DeptCount>("SELECT COUNT(*) as count FROM departments")
  const totalDepts = parseInt(deptCountResult[0]?.count || '0')

  const recentPapers = await query<RecentPaper>(
    "SELECT id, subject_name, subject_code, created_at FROM question_papers ORDER BY created_at DESC LIMIT 5"
  )

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="Admin Dashboard" />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Welcome, {user.name || user.email}! Manage the question paper repository.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{totalPapers}</div>
              <p className="text-xs text-muted-foreground">Question papers uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{totalDepts}</div>
              <p className="text-xs text-muted-foreground">Active departments</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Upload</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/papers/new">Upload Question Paper</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Manage Papers</CardTitle>
              <CardDescription className="text-sm">Upload, edit, or remove question papers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <Button asChild className="w-full">
                <Link href="/admin/papers/new">Upload New Paper</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/admin/papers/bulk-upload">Bulk Upload</Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/admin/papers">View All Papers</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Recent Uploads</CardTitle>
              <CardDescription className="text-sm">Latest papers added to the repository</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPapers.length > 0 ? (
                <div className="space-y-3">
                  {recentPapers.map((paper) => (
                    <div key={paper.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 text-sm border-b border-muted/20 pb-2">
                      <div>
                        <span className="font-medium">{paper.subject_name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{paper.subject_code}</span>
                      </div>
                      <span className="text-muted-foreground text-xs sm:text-sm flex-shrink-0">
                        {new Date(paper.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No papers yet. Upload your first question paper!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
