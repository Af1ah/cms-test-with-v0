import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { query, initializeDatabase } from "@/lib/db"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { FileText, Download } from "lucide-react"

export const dynamic = 'force-dynamic'

interface QuestionPaper {
    id: number
    subject_name: string
    subject_code: string
    paper_code: string | null
    year_of_examination: number
    semester: number
    description: string | null
    file_url: string
    file_type: string
    original_filename: string | null
    created_at: string
    created_by: number | null
    department_name: string | null
    subject_type_name: string | null
}

export default async function AdminPapersPage() {
    const user = await getCurrentUser()
    if (!user) {
        redirect("/admin/login")
    }

    await initializeDatabase()

    const papers = await query<QuestionPaper>(
        `SELECT qp.*, 
            d.name as department_name, 
            st.name as subject_type_name
     FROM question_papers qp
     LEFT JOIN departments d ON qp.department_id = d.id
     LEFT JOIN subject_types st ON qp.subject_type_id = st.id
     ORDER BY qp.created_at DESC`
    )

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader title="Admin Dashboard" />

            <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Manage Question Papers</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Add, edit, or remove question papers from the repository</p>
                    </div>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/admin/papers/new">Upload New Paper</Link>
                    </Button>
                </div>

                {papers && papers.length > 0 ? (
                    <div className="grid gap-4 sm:gap-6">
                        {papers.map((paper) => (
                            <Card key={paper.id}>
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg flex-shrink-0">
                                            <FileText className="h-8 w-8 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-2 mb-3">
                                                <div>
                                                    <h3 className="text-lg sm:text-xl font-semibold">{paper.subject_name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {paper.subject_code} {paper.paper_code && `• ${paper.paper_code}`}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 justify-center sm:justify-start flex-shrink-0">
                                                    {(user.role === 'admin' || paper.created_by === user.id) && (
                                                        <>
                                                            <Button asChild variant="outline" size="sm">
                                                                <Link href={`/admin/papers/${paper.id}/edit`}>Edit</Link>
                                                            </Button>
                                                            <Button asChild variant="destructive" size="sm">
                                                                <Link href={`/admin/papers/${paper.id}/delete`}>Delete</Link>
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {paper.description && (
                                                <p className="text-muted-foreground mb-3 text-sm line-clamp-2">{paper.description}</p>
                                            )}

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <Badge variant="secondary">
                                                    {paper.year_of_examination}
                                                </Badge>
                                                <Badge variant="outline">
                                                    Semester {paper.semester}
                                                </Badge>
                                                {paper.department_name && (
                                                    <Badge variant="outline">{paper.department_name}</Badge>
                                                )}
                                                {paper.subject_type_name && (
                                                    <Badge>{paper.subject_type_name}</Badge>
                                                )}
                                                <Badge variant="secondary" className="uppercase">
                                                    {paper.file_type}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                                                <span>Added {new Date(paper.created_at).toLocaleDateString()}</span>
                                                <a
                                                    href={`/api/download/${paper.id}`}
                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Download
                                                </a>
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
                            <CardTitle className="text-lg sm:text-xl">No Question Papers Yet</CardTitle>
                            <CardDescription className="text-sm">Get started by uploading your first question paper</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild className="w-full sm:w-auto">
                                <Link href="/admin/papers/new">Upload First Paper</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    )
}
