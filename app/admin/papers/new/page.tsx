"use client"

import React from "react"
import { StorageService, getFileType } from "@/lib/storage-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ButtonLoader, ValidationLoader } from "@/components/loading/loading-states"
import { useGlobalLoading } from "@/hooks/use-global-loading"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { FileText, Plus } from "lucide-react"

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

export default function NewPaperPage() {
    const [subjectName, setSubjectName] = useState("")
    const [subjectCode, setSubjectCode] = useState("")
    const [paperCode, setPaperCode] = useState("")
    const [yearOfExamination, setYearOfExamination] = useState("")
    const [semester, setSemester] = useState("")
    const [departmentId, setDepartmentId] = useState("")
    const [subjectTypeId, setSubjectTypeId] = useState("")
    const [programTypeId, setProgramTypeId] = useState("")
    const [description, setDescription] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [departments, setDepartments] = useState<Department[]>([])
    const [subjectTypes, setSubjectTypes] = useState<SubjectType[]>([])
    const [programTypes, setProgramTypes] = useState<ProgramType[]>([])
    const [showNewDepartment, setShowNewDepartment] = useState(false)
    const [showNewSubjectType, setShowNewSubjectType] = useState(false)
    const [showNewProgramType, setShowNewProgramType] = useState(false)
    const [newDepartmentName, setNewDepartmentName] = useState("")
    const [newSubjectTypeName, setNewSubjectTypeName] = useState("")
    const [newProgramTypeName, setNewProgramTypeName] = useState("")
    const [yearSuggestions, setYearSuggestions] = useState<number[]>([])
    const [isLoadingSubjectName, setIsLoadingSubjectName] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const { setLoading } = useGlobalLoading()

    // Generate year suggestions (current year and 10 years back)
    useEffect(() => {
        const currentYear = new Date().getFullYear()
        const years = Array.from({ length: 11 }, (_, i) => currentYear - i)
        setYearSuggestions(years)
    }, [])

    // Load departments, subject types, and program types on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [deptRes, typeRes, progRes] = await Promise.all([
                    fetch('/api/departments'),
                    fetch('/api/subject-types'),
                    fetch('/api/program-types')
                ])
                if (deptRes.ok) setDepartments(await deptRes.json())
                if (typeRes.ok) setSubjectTypes(await typeRes.json())
                if (progRes.ok) setProgramTypes(await progRes.json())
            } catch (err) {
                console.error('Error loading data:', err)
            }
        }
        loadData()
    }, [])

    // Auto-load subject name when subject code matches existing
    useEffect(() => {
        const lookupSubjectName = async () => {
            if (!subjectCode || subjectCode.length < 2) return

            setIsLoadingSubjectName(true)
            try {
                const response = await fetch(`/api/subjects?code=${encodeURIComponent(subjectCode)}`)
                if (response.ok) {
                    const data = await response.json()
                    if (data && data.subject_name) {
                        setSubjectName(data.subject_name)
                    }
                }
            } catch (err) {
                console.error('Error looking up subject:', err)
            } finally {
                setIsLoadingSubjectName(false)
            }
        }

        const debounce = setTimeout(lookupSubjectName, 500)
        return () => clearTimeout(debounce)
    }, [subjectCode])

    // Form validation
    const isFormValid = useMemo(() => {
        return (
            subjectName.trim() !== "" &&
            subjectCode.trim() !== "" &&
            yearOfExamination.trim() !== "" &&
            semester !== "" &&
            selectedFile !== null
        )
    }, [subjectName, subjectCode, yearOfExamination, semester, selectedFile])

    // Handle file selection
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) {
            setSelectedFile(null)
            setError(null)
            return
        }

        const validation = StorageService.validateFile(file)
        if (!validation.isValid) {
            setError(validation.error || "Invalid file")
            setSelectedFile(null)
            return
        }

        setSelectedFile(file)
        setError(null)
    }, [])

    // Upload file
    const uploadFile = useCallback(async (file: File) => {
        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Upload failed')
            }

            const data = await response.json()
            return {
                publicUrl: data.publicUrl,
                fileType: getFileType(file.type).toLowerCase(),
                originalName: file.name
            }
        } finally {
            setIsUploading(false)
        }
    }, [])

    // Reset file input
    const resetFileInput = useCallback(() => {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }, [])

    // Create new department
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

    // Create new subject type
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

    // Create new program type
    const handleCreateProgramType = async () => {
        if (!newProgramTypeName.trim()) return

        try {
            const response = await fetch('/api/program-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newProgramTypeName.trim() })
            })

            if (response.ok) {
                const type = await response.json()
                setProgramTypes(prev => [...prev, type].sort((a, b) => a.name.localeCompare(b.name)))
                setProgramTypeId(String(type.id))
                setNewProgramTypeName("")
                setShowNewProgramType(false)
            }
        } catch (err) {
            console.error('Error creating program type:', err)
        }
    }

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setLoading('crud', true)
        setError(null)

        try {
            // Upload file first
            let fileData = { publicUrl: '', fileType: '', originalName: '' }
            if (selectedFile) {
                fileData = await uploadFile(selectedFile)
            }

            // Create paper via API
            const response = await fetch('/api/papers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject_name: subjectName,
                    subject_code: subjectCode,
                    paper_code: paperCode || null,
                    year_of_examination: parseInt(yearOfExamination),
                    semester: parseInt(semester),
                    department_id: departmentId ? parseInt(departmentId) : null,
                    subject_type_id: subjectTypeId ? parseInt(subjectTypeId) : null,
                    program_type_id: programTypeId ? parseInt(programTypeId) : null,
                    description: description || null,
                    file_url: fileData.publicUrl,
                    file_type: fileData.fileType,
                    original_filename: fileData.originalName
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create paper')
            }

            await new Promise(resolve => setTimeout(resolve, 500))
            router.push("/admin/papers")
            router.refresh()
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : "An error occurred")
        } finally {
            setIsLoading(false)
            setLoading('crud', false)
            setIsUploading(false)
        }
    }, [subjectName, subjectCode, paperCode, yearOfExamination, semester, departmentId, subjectTypeId, programTypeId, description, router, selectedFile, uploadFile, setLoading])

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                        <h1 className="text-3xl font-bold mb-2">Upload Question Paper</h1>
                        <p className="text-muted-foreground">Add a new question paper to the repository</p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Paper Details</CardTitle>
                            <CardDescription>Fill in the information for the question paper</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Subject Code with auto-fill */}
                                <div className="grid gap-2">
                                    <Label htmlFor="subjectCode">Subject Code *</Label>
                                    <div className="relative">
                                        <Input
                                            id="subjectCode"
                                            type="text"
                                            placeholder="e.g., CS101"
                                            required
                                            value={subjectCode}
                                            onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                                            disabled={isLoading}
                                            className="uppercase"
                                        />
                                        {isLoadingSubjectName && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Subject name will auto-fill if code matches existing records
                                    </p>
                                </div>

                                {/* Subject Name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="subjectName">Subject Name *</Label>
                                    <Input
                                        id="subjectName"
                                        type="text"
                                        placeholder="e.g., Computer Science Fundamentals"
                                        required
                                        value={subjectName}
                                        onChange={(e) => setSubjectName(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Paper Code */}
                                <div className="grid gap-2">
                                    <Label htmlFor="paperCode">Question Paper Code</Label>
                                    <Input
                                        id="paperCode"
                                        type="text"
                                        placeholder="e.g., QP2024CS101"
                                        value={paperCode}
                                        onChange={(e) => setPaperCode(e.target.value.toUpperCase())}
                                        disabled={isLoading}
                                        className="uppercase"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Year of Examination */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="year">Year of Examination *</Label>
                                        <Input
                                            id="year"
                                            type="number"
                                            placeholder={String(new Date().getFullYear())}
                                            required
                                            value={yearOfExamination}
                                            onChange={(e) => setYearOfExamination(e.target.value)}
                                            disabled={isLoading}
                                            list="year-suggestions"
                                            min="1990"
                                            max={new Date().getFullYear() + 1}
                                        />
                                        <datalist id="year-suggestions">
                                            {yearSuggestions.map(year => (
                                                <option key={year} value={year} />
                                            ))}
                                        </datalist>
                                    </div>

                                    {/* Semester */}
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

                                {/* Department */}
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
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setShowNewDepartment(true)}
                                                disabled={isLoading}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter new department name"
                                                value={newDepartmentName}
                                                onChange={(e) => setNewDepartmentName(e.target.value)}
                                                disabled={isLoading}
                                            />
                                            <Button type="button" onClick={handleCreateDepartment} disabled={isLoading || !newDepartmentName.trim()}>
                                                Add
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowNewDepartment(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Subject Type */}
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
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setShowNewSubjectType(true)}
                                                disabled={isLoading}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter new subject type"
                                                value={newSubjectTypeName}
                                                onChange={(e) => setNewSubjectTypeName(e.target.value)}
                                                disabled={isLoading}
                                            />
                                            <Button type="button" onClick={handleCreateSubjectType} disabled={isLoading || !newSubjectTypeName.trim()}>
                                                Add
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowNewSubjectType(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Program Type */}
                                <div className="grid gap-2">
                                    <Label>Program Type</Label>
                                    {!showNewProgramType ? (
                                        <div className="flex gap-2">
                                            <Select value={programTypeId} onValueChange={setProgramTypeId} disabled={isLoading}>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select program type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {programTypes.map(type => (
                                                        <SelectItem key={type.id} value={String(type.id)}>
                                                            {type.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => setShowNewProgramType(true)}
                                                disabled={isLoading}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter new program type"
                                                value={newProgramTypeName}
                                                onChange={(e) => setNewProgramTypeName(e.target.value)}
                                                disabled={isLoading}
                                            />
                                            <Button type="button" onClick={handleCreateProgramType} disabled={isLoading || !newProgramTypeName.trim()}>
                                                Add
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setShowNewProgramType(false)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Additional notes about this question paper (optional)"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* File Upload */}
                                <div className="grid gap-2">
                                    <Label htmlFor="file">Question Paper File *</Label>
                                    <div className="space-y-4">
                                        <Input
                                            ref={fileInputRef}
                                            id="file"
                                            type="file"
                                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={handleFileSelect}
                                            disabled={isLoading || isUploading}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Upload PDF, DOC, or DOCX file (max 50MB)
                                        </p>

                                        {selectedFile && (
                                            <div className="p-4 border rounded-lg bg-muted/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-5 w-5 text-primary" />
                                                        <span className="font-medium">{selectedFile.name}</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={resetFileInput}
                                                        disabled={isLoading || isUploading}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    <p>Type: {getFileType(selectedFile.type)}</p>
                                                    <p>Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                        )}

                                        {isUploading && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                                                <ValidationLoader text="Uploading file..." />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {error && <p className="text-sm text-destructive">{error}</p>}

                                <div className="flex gap-4">
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !isFormValid || isUploading}
                                        className="flex-1"
                                    >
                                        {isLoading ? (
                                            <ButtonLoader text={isUploading ? "Uploading..." : "Adding Paper"} />
                                        ) : (
                                            "Upload Question Paper"
                                        )}
                                    </Button>
                                    <Button asChild variant="outline" type="button" disabled={isLoading || isUploading}>
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
