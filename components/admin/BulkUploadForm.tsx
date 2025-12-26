'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileArchive, CheckCircle2, XCircle, AlertCircle, Download, Loader2 } from 'lucide-react'
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

interface ProgressUpdate {
    type: 'status' | 'progress' | 'success' | 'error' | 'skip' | 'complete'
    message?: string
    current?: number
    total?: number
    file?: string
    error?: string
    counts?: {
        success: number
        failed: number
        skipped: number
    }
    errors?: Array<{ file: string; error: string }>
    successfulPapers?: Array<{ qpCode: string; subjectName: string }>
}

export default function BulkUploadForm({ programTypes }: BulkUploadFormProps) {
    const [file, setFile] = useState<File | null>(null)
    const [programTypeId, setProgramTypeId] = useState<string>('')
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<BulkUploadResult | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentFile, setCurrentFile] = useState<string>('')
    const [statusMessage, setStatusMessage] = useState<string>('')
    const [counts, setCounts] = useState({ success: 0, failed: 0, skipped: 0 })
    const eventSourceRef = useRef<EventSource | null>(null)

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
        setProgress(0)
        setCurrentFile('')
        setStatusMessage('Preparing upload...')
        setCounts({ success: 0, failed: 0, skipped: 0 })

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('program_type_id', programTypeId)
            formData.append('stream_progress', 'true')

            // Use fetch with streaming
            const response = await fetch('/api/admin/bulk-upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Upload failed')
            }

            // Check if response is SSE
            const contentType = response.headers.get('content-type')
            if (contentType?.includes('text/event-stream')) {
                // Handle SSE stream
                const reader = response.body?.getReader()
                const decoder = new TextDecoder()

                if (!reader) {
                    throw new Error('Failed to get response reader')
                }

                let buffer = ''
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n\n')
                    buffer = lines.pop() || ''

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data: ProgressUpdate = JSON.parse(line.slice(6))
                            handleProgressUpdate(data)
                        }
                    }
                }
            } else {
                // Fallback to JSON response
                const data = await response.json()
                setResult(data)
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Upload failed')
            setUploading(false)
        }
    }

    const handleProgressUpdate = (data: ProgressUpdate) => {
        switch (data.type) {
            case 'status':
                setStatusMessage(data.message || '')
                break

            case 'progress':
                if (data.current && data.total) {
                    setProgress((data.current / data.total) * 100)
                    setCurrentFile(data.file || '')
                    setStatusMessage(`Processing ${data.current}/${data.total}...`)
                }
                if (data.counts) {
                    setCounts(data.counts)
                }
                break

            case 'success':
                if (data.current && data.total) {
                    setProgress((data.current / data.total) * 100)
                }
                if (data.counts) {
                    setCounts(data.counts)
                }
                setStatusMessage(`✅ ${data.file}`)
                break

            case 'error':
                if (data.current && data.total) {
                    setProgress((data.current / data.total) * 100)
                }
                if (data.counts) {
                    setCounts(data.counts)
                }
                setStatusMessage(`❌ ${data.file}: ${data.error}`)
                break

            case 'skip':
                if (data.current && data.total) {
                    setProgress((data.current / data.total) * 100)
                }
                if (data.counts) {
                    setCounts(data.counts)
                }
                setStatusMessage(`⏭️ ${data.file}: ${data.error}`)
                break

            case 'complete':
                setProgress(100)
                setStatusMessage('Upload complete!')
                setUploading(false)
                if (data.counts && data.errors !== undefined && data.successfulPapers !== undefined) {
                    setResult({
                        success: data.counts.success,
                        failed: data.counts.failed,
                        skipped: data.counts.skipped,
                        errors: data.errors,
                        successfulPapers: data.successfulPapers,
                    })
                }
                break
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
                                                ZIP file should contain PDFs and a CSV mapping file (max 500MB)
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
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                        <div className="mt-6 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-medium">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="w-full" />
                            </div>

                            {/* Current Status */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="font-mono text-xs">{statusMessage}</span>
                                </div>

                                {currentFile && (
                                    <p className="text-sm text-muted-foreground truncate">
                                        Current: {currentFile}
                                    </p>
                                )}

                                {/* Running Counts */}
                                <div className="flex gap-4 text-xs pt-2 border-t">
                                    <span className="text-green-600">✓ {counts.success}</span>
                                    <span className="text-red-600">✗ {counts.failed}</span>
                                    <span className="text-yellow-600">⏭ {counts.skipped}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Successful</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{result.success}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Papers uploaded successfully
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                                <XCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{result.failed}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Papers failed to upload
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Skipped</CardTitle>
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{result.skipped}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Papers skipped (duplicates, missing files)
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Successfully Uploaded Papers */}
                    {result.successfulPapers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-green-600">✅ Successfully Uploaded Papers</CardTitle>
                                        <CardDescription>
                                            {result.successfulPapers.length} paper{result.successfulPapers.length !== 1 ? 's' : ''} uploaded and ready for download
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-96 overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[100px]">QP Code</TableHead>
                                                <TableHead>Subject Name</TableHead>
                                                <TableHead className="w-[80px]">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.successfulPapers.map((paper, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-mono text-sm">{paper.qpCode}</TableCell>
                                                    <TableCell className="font-medium">{paper.subjectName}</TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Success
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Errors & Skipped Files */}
                    {result.errors.length > 0 && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-red-600">❌ Errors & Skipped Files</CardTitle>
                                        <CardDescription>
                                            {result.errors.length} paper{result.errors.length !== 1 ? 's' : ''} could not be uploaded
                                        </CardDescription>
                                    </div>
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
                                                <TableHead>Reason</TableHead>
                                                <TableHead className="w-[100px]">Type</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.errors.map((error, index) => {
                                                const isSkipped = error.error.includes('already exists') ||
                                                    error.error.includes('not found') ||
                                                    error.error.includes('too large')
                                                const isFailed = !isSkipped

                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{error.file}</TableCell>
                                                        <TableCell className={isFailed ? "text-red-600" : "text-yellow-600"}>
                                                            {error.error}
                                                        </TableCell>
                                                        <TableCell>
                                                            {isSkipped ? (
                                                                <span className="inline-flex items-center gap-1 text-yellow-600 text-sm">
                                                                    <AlertCircle className="h-4 w-4" />
                                                                    Skipped
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-red-600 text-sm">
                                                                    <XCircle className="h-4 w-4" />
                                                                    Failed
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Success Message */}
                    {result.success > 0 && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Upload Complete!</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Successfully uploaded {result.success} question paper{result.success !== 1 ? 's' : ''}.
                                {result.errors.length > 0 && (
                                    <> {result.errors.length} paper{result.errors.length !== 1 ? 's' : ''} could not be uploaded (see details above).</>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* No Success Message */}
                    {result.success === 0 && result.errors.length > 0 && (
                        <Alert className="border-red-200 bg-red-50">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <AlertTitle className="text-red-800">Upload Failed</AlertTitle>
                            <AlertDescription className="text-red-700">
                                No papers were uploaded successfully. Please check the errors above and try again.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            )}
        </div>
    )
}
