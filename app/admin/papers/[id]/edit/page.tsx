"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ButtonLoader } from "@/components/loading/loading-states"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"

interface Department {
    id: number
    name: string
}

interface SubjectType {
    id: number
    name: string
}

interface QuestionPaper {
    id: number
    subject_name: string
    subject_code: string
    paper_code: string | null
    year_of_examination: number
    semester: number
    subject_type_id: number | null
    department_id: number | null
    description: string | null
    file_url: string
    file_type: string
    original_filename: string | null
}

export default function EditPaperPage() {
    const params = useParams()
    const router = useRouter()
    const [paper, setPaper] = useState<QuestionPaper | null>(null)
    const [subjectName, setSubjectName] = useState("")
    const [subjectCode, setSubjectCode] = useState("")
    const [paperCode, setPaperCode] = useState("")
    const [yearOfExamination, setYearOfExamination] = useState("")
    const [semester, setSemester] = useState("")
    const [departmentId, setDepartmentId] = useState("")
    const [subjectTypeId, setSubjectTypeId] = useState("")
    const [description, setDescription] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [departments, setDepartments] = useState<Department[]>([])
    const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([])
    const [showNewDepartment, setShowNewDepartment] = useState(false)
    const [showNewSubjectType, setShowNewSubjectType] = useState(false)
    const [newDepartmentName, setNewDepartmentName] = useState("")
    const [newSubjectTypeName, setNewSubjectTypeName] = useState("")

    useEffect(() => {
        const loadData = async () => {
            try {
                const [paperRes, deptRes, typeRes] = await Promise.all([
                    fetch(`/api/papers/${params.id}`),
                    fetch('/api/departments'),
                    fetch('/api/subject-types')
                ])

                if (!paperRes.ok) throw new Error('Paper not found')

                const paperData = await paperRes.json()
                setPaper(paperData)
                setSubjectName(paperData.subject_name)
                setSubjectCode(paperData.subject_code)
                setPaperCode(paperData.paper_code || "")
                setYearOfExamination(String(paperData.year_of_examination))
                setSemester(String(paperData.semester))
                setDepartmentId(paperData.department_id ? String(paperData.department_id) : "")
                setSubjectTypeId(paperData.subject_type_id ? String(paperData.subject_type_id) : "")
                setDescription(paperData.description || "")

                if (deptRes.ok) setDepartments(await deptRes.json())
                if (typeRes.ok) setSubjectTypes(await typeRes.json())
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error loading paper')
            } finally {
                setIsLoadingData(false)
            }
        }
        loadData()
    }, [params.id])

    const handleCreateDepartment = async () => {
        if (!newDepartmentName.trim()) return
        try {
            const response = await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newDepartmentName.trim() })
            })
            if (response.ok) {
                const dept = await response.json()
                setDepartments(prev => [...prev, dept].sort((a, b) => a.name.localeCompare(b.name)))
                setDepartmentId(String(dept.id))
                setNewDepartmentName("")
                setShowNewDepartment(false)
            }
        } catch (err) {
            console.error('Error creating department:', err)
        }
    }

    const handleCreateSubjectType = async () => {
        if (!newSubjectTypeName.trim()) return
        try {
            const response = await fetch('/api/subject-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSubjectTypeName.trim() })
            })
            if (response.ok) {
                const type = await response.json()
                setSubjectTypes(prev => [...prev, type].sort((a, b) => a.name.localeCompare(b.name)))
                setSubjectTypeId(String(type.id))
                setNewSubjectTypeName("")
                setShowNewSubjectType(false)
            }
        } catch (err) {
            console.error('Error creating subject type:', err)
        }
    }

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        if (!paper) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/papers/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject_name: subjectName,
                    subject_code: subjectCode,
                    paper_code: paperCode || null,
                    year_of_examination: parseInt(yearOfExamination),
                    semester: parseInt(semester),
                    department_id: departmentId ? parseInt(departmentId) : null,
                    subject_type_id: subjectTypeId ? parseInt(subjectTypeId) : null,
                    description: description || null,
                    file_url: paper.file_url,
                    file_type: paper.file_type,
                    original_filename: paper.original_filename
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update paper')
            }

            router.push("/admin/papers")
            router.refresh()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }, [paper, params.id, subjectName, subjectCode, paperCode, yearOfExamination, semester, departmentId, subjectTypeId, description, router])

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
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Edit Question Paper</h1>
                        <p className="text-muted-foreground">Update the paper details</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Paper Details</CardTitle>
                            <CardDescription>Modify the information for this question paper</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="subjectCode">Subject Code *</Label>
                                    <Input
                                        id="subjectCode"
                                        required
                                        value={subjectCode}
                                        onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                                        disabled={isLoading}
                                        className="uppercase"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="subjectName">Subject Name *</Label>
                                    <Input
                                        id="subjectName"
                                        required
                                        value={subjectName}
                                        onChange={(e) => setSubjectName(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="paperCode">Question Paper Code</Label>
                                    <Input
                                        id="paperCode"
                                        value={paperCode}
                                        onChange={(e) => setPaperCode(e.target.value.toUpperCase())}
                                        disabled={isLoading}
                                        className="uppercase"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="year">Year of Examination *</Label>
                                        <Input
                                            id="year"
                                            type="number"
                                            required
                                            value={yearOfExamination}
                                            onChange={(e) => setYearOfExamination(e.target.value)}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="semester">Semester *</Label>
                                        <Select value={semester} onValueChange={setSemester} disabled={isLoading}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select semester" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sem => (
                                                    <SelectItem key={sem} value={String(sem)}>
                                                        Semester {sem}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Department</Label>
                                    {!showNewDepartment ? (
                                        <div className="flex gap-2">
                                            <Select value={departmentId} onValueChange={setDepartmentId} disabled={isLoading}>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departments.map(dept => (
                                                        <SelectItem key={dept.id} value={String(dept.id)}>
                                                            {dept.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button type="button" variant="outline" size="icon" onClick={() => setShowNewDepartment(true)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="New department name"
                                                value={newDepartmentName}
                                                onChange={(e) => setNewDepartmentName(e.target.value)}
                                            />
                                            <Button type="button" onClick={handleCreateDepartment}>Add</Button>
                                            <Button type="button" variant="outline" onClick={() => setShowNewDepartment(false)}>Cancel</Button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Subject Type</Label>
                                    {!showNewSubjectType ? (
                                        <div className="flex gap-2">
                                            <Select value={subjectTypeId} onValueChange={setSubjectTypeId} disabled={isLoading}>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select subject type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {subjectTypes.map(type => (
                                                        <SelectItem key={type.id} value={String(type.id)}>
                                                            {type.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button type="button" variant="outline" size="icon" onClick={() => setShowNewSubjectType(true)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="New subject type"
                                                value={newSubjectTypeName}
                                                onChange={(e) => setNewSubjectTypeName(e.target.value)}
                                            />
                                            <Button type="button" onClick={handleCreateSubjectType}>Add</Button>
                                            <Button type="button" variant="outline" onClick={() => setShowNewSubjectType(false)}>Cancel</Button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="p-4 border rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span className="font-medium">{paper.original_filename || paper.file_url}</span>
                                        <span className="text-sm text-muted-foreground uppercase">({paper.file_type})</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        File cannot be changed. Delete and re-upload if needed.
                                    </p>
                                </div>

                                {error && <p className="text-sm text-destructive">{error}</p>}

                                <div className="flex gap-4">
                                    <Button type="submit" disabled={isLoading} className="flex-1">
                                        {isLoading ? <ButtonLoader text="Saving..." /> : "Save Changes"}
                                    </Button>
                                    <Button asChild variant="outline" type="button">
                                        <Link href="/admin/papers">Cancel</Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
