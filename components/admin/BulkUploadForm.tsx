'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileArchive, CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ProgramType {
    id: number
    name: string
}

interface BulkUploadResult {
    success: number
    failed: number
    skipped: number
    errors: Array<{
        file: string
        error: string
    }>
    successfulPapers: Array<{
        qpCode: string
        subjectName: string
    }>
}

interface BulkUploadFormProps {
    programTypes: ProgramType[]
}

export default function BulkUploadForm({ programTypes }: BulkUploadFormProps) {
    const [file, setFile] = useState<File | null>(null)
    const [programTypeId, setProgramTypeId] = useState<string>('')
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<BulkUploadResult | null>(null)
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0]
            if (droppedFile.name.endsWith('.zip')) {
                setFile(droppedFile)
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!file) {
            alert('Please select a ZIP file')
            return
        }

        if (!programTypeId) {
            alert('Please select a program type')
            return
        }

        setUploading(true)
        setResult(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('program_type_id', programTypeId)

            const response = await fetch('/api/admin/bulk-upload', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            setResult(data)
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const downloadErrorReport = () => {
        if (!result) return

        const csvContent = [
            'File,Error',
            ...result.errors.map(e => `"${e.file}","${e.error}"`),
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bulk-upload-errors-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Upload Question Papers</CardTitle>
                    <CardDescription>
                        Upload a ZIP file containing question papers and a CSV mapping file
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Upload */}
                        <div className="space-y-2">
                            <Label>ZIP File</Label>
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted-foreground/25 hover:border-primary/50'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                {file ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <FileArchive className="h-8 w-8 text-primary" />
                                        <div className="text-left">
                                            <p className="font-medium">{file.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setFile(null)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Drag and drop your ZIP file here, or click to browse
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                ZIP file should contain PDFs and a CSV mapping file
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            accept=".zip"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            Select File
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Program Type Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="program-type">Program Type</Label>
                            <Select value={programTypeId} onValueChange={setProgramTypeId}>
                                <SelectTrigger id="program-type">
                                    <SelectValue placeholder="Select program type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {programTypes.map((pt) => (
                                        <SelectItem key={pt.id} value={pt.id.toString()}>
                                            {pt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Upload Button */}
                        <Button type="submit" disabled={!file || !programTypeId || uploading} className="w-full">
                            {uploading ? (
                                <>
                                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Papers
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Progress */}
                    {uploading && (
                        <div className="mt-6 space-y-2">
                            <Progress value={undefined} className="w-full" />
                            <p className="text-sm text-center text-muted-foreground">
                                Processing files... This may take a few minutes.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Successful</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{result.success}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                                <XCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{result.failed}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Skipped</CardTitle>
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{result.skipped}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Errors */}
                    {result.errors.length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Errors & Skipped Files</CardTitle>
                                    <Button variant="outline" size="sm" onClick={downloadErrorReport}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download Report
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-96 overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>File</TableHead>
                                                <TableHead>Error</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.errors.map((error, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{error.file}</TableCell>
                                                    <TableCell className="text-red-600">{error.error}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Success Message */}
                    {result.success > 0 && (
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Upload Complete!</AlertTitle>
                            <AlertDescription>
                                Successfully uploaded {result.success} question paper{result.success !== 1 ? 's' : ''}.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    )
}
