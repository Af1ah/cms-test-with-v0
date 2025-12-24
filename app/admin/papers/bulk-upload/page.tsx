import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'
import BulkUploadForm from '@/components/admin/BulkUploadForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

interface ProgramType {
    id: number
    name: string
}

async function getProgramTypes(): Promise<ProgramType[]> {
    const programTypes = await query<ProgramType>('SELECT id, name FROM program_types ORDER BY name')
    return programTypes
}

export default async function BulkUploadPage() {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/admin/login')
    }

    if (user.role !== 'admin') {
        redirect('/')
    }

    const programTypes = await getProgramTypes()

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Bulk Upload</h1>
                <p className="text-muted-foreground">
                    Upload multiple question papers at once using a ZIP file
                </p>
            </div>

            <div className="space-y-6">
                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <InfoIcon className="h-5 w-5" />
                            How to Use Bulk Upload
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">ZIP File Structure:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li>A CSV file in the root directory (e.g., "Third Sem QP Details.csv")</li>
                                <li>PDF files organized in folders (e.g., MAJOR 1, MAJOR 2, etc.)</li>
                                <li>PDF files named with QP code prefix (e.g., "133750_timestamp.pdf")</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">CSV Format:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                <li>Column 1: Date of Exam (year will be extracted)</li>
                                <li>Column 2: QP Code</li>
                                <li>Column 3: Paper Name (format: "SUBJECT_CODE - Subject Name")</li>
                                <li>Column 4: Total Scripts (optional, will be ignored)</li>
                            </ul>
                        </div>

                        <Alert>
                            <AlertTitle>Automatic Field Detection</AlertTitle>
                            <AlertDescription className="text-sm space-y-1">
                                <p>The system will automatically detect:</p>
                                <ul className="list-disc list-inside ml-2 mt-2">
                                    <li>Semester from subject code</li>
                                    <li>Department from subject code prefix (BBA, BCA, COM, etc.)</li>
                                    <li>Subject type from subject code (CJ=Major, MN=Minor, FM/FV/FS=Common)</li>
                                    <li>Year from the date of exam column</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Upload Form */}
                <Suspense fallback={<div>Loading...</div>}>
                    <BulkUploadForm programTypes={programTypes} />
                </Suspense>
            </div>
        </div>
    )
}
