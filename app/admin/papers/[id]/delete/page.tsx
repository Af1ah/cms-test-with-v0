"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ButtonLoader } from "@/components/loading/loading-states"
import Link from "next/link"
import { AlertTriangle, FileText } from "lucide-react"

interface QuestionPaper {
    id: number
    subject_name: string
    subject_code: string
    year_of_examination: number
    semester: number
    file_type: string
    original_filename: string | null
}

export default function DeletePaperPage() {
    const params = useParams()
    const router = useRouter()
    const [paper, setPaper] = useState<QuestionPaper | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadPaper = async () => {
            try {
                const response = await fetch(`/api/papers/${params.id}`)
                if (!response.ok) throw new Error('Paper not found')
                setPaper(await response.json())
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error loading paper')
            } finally {
                setIsLoadingData(false)
            }
        }
        loadPaper()
    }, [params.id])

    const handleDelete = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/papers/${params.id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete paper')
            }

            router.push("/admin/papers")
            router.refresh()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred")
            setIsLoading(false)
        }
    }

    if (isLoadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!paper) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-6 text-center">
                        <p className="text-destructive mb-4">{error || "Paper not found"}</p>
                        <Button asChild>
                            <Link href="/admin/papers">Back to Papers</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-background/95 backdrop-blur">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center justify-between">
                        <Link href="/admin/dashboard" className="text-2xl font-bold text-primary">
                            Admin Dashboard
                        </Link>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/admin/papers">← Back to Papers</Link>
                        </Button>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto">
                    <Card className="border-destructive/50">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle>Delete Question Paper</CardTitle>
                            <CardDescription>
                                This action cannot be undone. The file will be permanently deleted.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">{paper.subject_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {paper.subject_code} • {paper.year_of_examination} • Semester {paper.semester}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {paper.original_filename || `File (${paper.file_type.toUpperCase()})`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {error && <p className="text-sm text-destructive text-center">{error}</p>}

                            <div className="flex gap-4">
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? <ButtonLoader text="Deleting..." /> : "Delete Paper"}
                                </Button>
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href="/admin/papers">Cancel</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
