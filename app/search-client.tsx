"use client"

import { useState, useCallback } from "react"
import { PaperCard } from "@/components/paper-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Filter, X, FileText, GraduationCap } from "lucide-react"

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
    department_name: string | null
    subject_type_name: string | null
    program_type_name: string | null
    created_at?: string
}

interface Department {
    id: number
    name: string
}

interface SubjectType {
    id: number
    name: string
}

interface ProgramType {
    id: number
    name: string
}

interface SearchClientProps {
    initialPapers: QuestionPaper[]
    departments: Department[]
    subjectTypes: SubjectType[]
    programTypes: ProgramType[]
    years: number[]
}

export default function SearchClient({
    initialPapers,
    departments,
    subjectTypes,
    programTypes,
    years
}: SearchClientProps) {
    const [papers, setPapers] = useState<QuestionPaper[]>(initialPapers)
    const [isLoading, setIsLoading] = useState(false)
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Search filters
    const [subject, setSubject] = useState("")
    const [subjectCode, setSubjectCode] = useState("")
    const [year, setYear] = useState("")
    const [semester, setSemester] = useState("")
    const [departmentId, setDepartmentId] = useState("")
    const [subjectTypeId, setSubjectTypeId] = useState("")
    const [programTypeId, setProgramTypeId] = useState("")

    const searchPapers = useCallback(async () => {
        setIsLoading(true)

        try {
            const params = new URLSearchParams()
            if (subject) params.append("subject", subject)
            if (subjectCode) params.append("subject_code", subjectCode)
            if (year && year !== "all") params.append("year", year)
            if (semester && semester !== "all") params.append("semester", semester)
            if (departmentId && departmentId !== "all") params.append("department_id", departmentId)
            if (subjectTypeId && subjectTypeId !== "all") params.append("subject_type_id", subjectTypeId)
            if (programTypeId && programTypeId !== "all") params.append("program_type_id", programTypeId)

            const response = await fetch(`/api/papers?${params.toString()}`)
            if (response.ok) {
                setPapers(await response.json())
            }
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setIsLoading(false)
        }
    }, [subject, subjectCode, year, semester, departmentId, subjectTypeId, programTypeId])

    const clearFilters = () => {
        setSubject("")
        setSubjectCode("")
        setYear("all")
        setSemester("all")
        setDepartmentId("all")
        setSubjectTypeId("all")
        setProgramTypeId("all")
    }

    const hasFilters = subject || subjectCode || (year && year !== "all") || (semester && semester !== "all") || (departmentId && departmentId !== "all") || (subjectTypeId && subjectTypeId !== "all") || (programTypeId && programTypeId !== "all")

    return (
        <div className="flex flex-col min-h-screen">
            {/* Sticky Search Section */}
            <section className="sticky top-[65px] z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm py-4 px-4 h-auto">
                <div className="container mx-auto">
                    <div className="flex gap-2 max-w-2xl mx-auto items-center">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by subject name or code..."

                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchPapers()}
                                className="pl-9 h-11 bg-white/50 border-slate-200 focus:bg-white transition-all shadow-none"
                            />
                            {isLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full" />
                                </div>
                            )}
                        </div>

                        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-11 w-11 flex-shrink-0"
                                    title="Advanced Filters"
                                >
                                    <Filter className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                    </div>
                </div>
            </section>

            {/* Filter Modal */}
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Advanced Filters</DialogTitle>
                        <DialogDescription>
                            Refine your search with multiple filter options
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid sm:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Subject Code</Label>
                            <Input
                                placeholder="e.g., CS101"
                                value={subjectCode}
                                onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                                className="uppercase"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Year</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All years</SelectItem>
                                    {years.map(y => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Semester</Label>
                            <Select value={semester} onValueChange={setSemester}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All semesters" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All semesters</SelectItem>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                                        <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All departments</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Subject Type</Label>
                            <Select value={subjectTypeId} onValueChange={setSubjectTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All types</SelectItem>
                                    {subjectTypes.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Program Type</Label>
                            <Select value={programTypeId} onValueChange={setProgramTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All program types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All program types</SelectItem>
                                    {programTypes.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        {hasFilters && (
                            <Button variant="outline" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-2" />
                                Clear All
                            </Button>
                        )}
                        <Button onClick={() => {
                            searchPapers()
                            setIsFilterOpen(false)
                        }} disabled={isLoading}>
                            Apply Filters
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Results */}
            <section className="py-12 px-4">
                <div className="container mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {hasFilters ? 'Search Results' : 'Recent Papers'}
                            </h2>
                            <p className="text-muted-foreground">
                                {papers.length} {papers.length === 1 ? 'paper' : 'papers'} found
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : papers.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {papers.map((paper) => (
                                <PaperCard key={paper.id} paper={paper} />
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Papers Found</h3>
                                <p className="text-muted-foreground mb-4">
                                    {hasFilters
                                        ? 'Try adjusting your search filters to find what you\'re looking for.'
                                        : 'No question papers have been uploaded yet.'}
                                </p>
                                {hasFilters && (
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear Filters
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>
        </div>
    )
}
