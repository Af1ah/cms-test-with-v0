import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'
import {
  extractZipFile,
  parseCSV,
  matchPDFsToCSV,
  findPDFFiles,
  cleanupTempFiles,
  getOrCreateDepartment,
  getOrCreateSubjectType,
  BulkUploadResult,
} from '@/lib/bulk-upload'
import fs from 'fs'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

export async function POST(request: Request) {
  const tempDir = path.join(process.cwd(), 'temp', `upload-${Date.now()}`)
  
  try {
    // Check if user is authenticated and is admin
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const programTypeId = formData.get('program_type_id') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'File must be a ZIP archive' }, { status: 400 })
    }

    // Create temp directory
    await mkdir(tempDir, { recursive: true })

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Extract ZIP file
    console.log('📦 Extracting ZIP file...')
    await extractZipFile(buffer, tempDir)

    // Find CSV file recursively
    function findCSVFile(dir: string): string | null {
      const items = fs.readdirSync(dir)
      
      // First check current directory
      for (const item of items) {
        if (item.toLowerCase().endsWith('.csv')) {
          return path.join(dir, item)
        }
      }
      
      // Then check subdirectories
      for (const item of items) {
        const fullPath = path.join(dir, item)
        if (fs.statSync(fullPath).isDirectory()) {
          const found = findCSVFile(fullPath)
          if (found) return found
        }
      }
      
      return null
    }
    
    const csvPath = findCSVFile(tempDir)
    
    if (!csvPath) {
      cleanupTempFiles(tempDir)
      return NextResponse.json(
        { error: 'No CSV file found in ZIP archive' },
        { status: 400 }
      )
    }

    // Parse CSV
    console.log('📄 Parsing CSV file...')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const csvRows = parseCSV(csvContent)

    console.log(`Found ${csvRows.length} entries in CSV`)

    // Log extracted directory structure
    function logDirectoryStructure(dir: string, prefix = '') {
      const items = fs.readdirSync(dir)
      for (const item of items) {
        const fullPath = path.join(dir, item)
        if (fs.statSync(fullPath).isDirectory()) {
          console.log(`${prefix}📁 ${item}/`)
        }
      }
    }
    console.log('📂 Extracted structure:')
    logDirectoryStructure(tempDir, '  ')

    // Find all PDF files
    console.log('🔍 Finding PDF files...')
    const pdfMap = findPDFFiles(tempDir)
    console.log(`Found ${pdfMap.size} PDF files`)

    // Match PDFs to CSV entries
    const papers = await matchPDFsToCSV(csvRows, pdfMap)

    // Process each paper
    const result: BulkUploadResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      successfulPapers: [],
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    for (const paper of papers) {
      try {
        // Skip if no PDF found
        if (!paper.pdfPath) {
          result.skipped++
          result.errors.push({
            file: `${paper.qpCode} - ${paper.subjectName}`,
            error: 'PDF file not found',
          })
          continue
        }

        // Get or create department
        const departmentId = await getOrCreateDepartment(paper.departmentPrefix)
        
        // Get or create subject type
        const subjectTypeId = await getOrCreateSubjectType(paper.subjectType)

        // Copy PDF to uploads directory
        const originalFilename = path.basename(paper.pdfPath)
        const newFilename = `${Date.now()}-${originalFilename}`
        const destPath = path.join(uploadsDir, newFilename)
        
        fs.copyFileSync(paper.pdfPath, destPath)
        const fileUrl = `/uploads/${newFilename}`

        // Check if paper already exists
        const existing = await query(
          'SELECT id FROM question_papers WHERE paper_code = $1 AND year_of_examination = $2',
          [paper.qpCode, paper.year]
        )

        if (existing.length > 0) {
          result.skipped++
          result.errors.push({
            file: `${paper.qpCode} - ${paper.subjectName}`,
            error: 'Paper already exists in database',
          })
          continue
        }

        // Insert into database
        await query(
          `INSERT INTO question_papers (
            subject_name, subject_code, paper_code, year_of_examination,
            semester, subject_type_id, program_type_id, department_id,
            file_url, file_type, original_filename, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            paper.subjectName,
            paper.subjectCode,
            paper.qpCode,
            paper.year,
            paper.semester,
            subjectTypeId,
            programTypeId ? parseInt(programTypeId) : null,
            departmentId,
            fileUrl,
            'application/pdf',
            originalFilename,
            user.id,
          ]
        )

        result.success++
        result.successfulPapers.push({
          qpCode: paper.qpCode,
          subjectName: paper.subjectName,
        })

        console.log(`✅ Uploaded: ${paper.qpCode} - ${paper.subjectName}`)
      } catch (error) {
        result.failed++
        result.errors.push({
          file: `${paper.qpCode} - ${paper.subjectName}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        console.error(`❌ Failed to upload ${paper.qpCode}:`, error)
      }
    }

    // Cleanup temp files
    cleanupTempFiles(tempDir)

    console.log(`\n📊 Results: ${result.success} success, ${result.failed} failed, ${result.skipped} skipped`)

    return NextResponse.json(result)
  } catch (error) {
    // Cleanup on error
    cleanupTempFiles(tempDir)
    
    console.error('Bulk upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process bulk upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
