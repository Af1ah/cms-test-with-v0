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
import { mkdir } from 'fs/promises'

// Helper to create SSE message
function createSSEMessage(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

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
    const streamProgress = formData.get('stream_progress') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'File must be a ZIP archive' }, { status: 400 })
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is 500MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB` 
      }, { status: 400 })
    }

    // If streaming progress, set up SSE
    if (streamProgress) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await processUpload(controller, encoder, file, programTypeId, user.id, tempDir)
          } catch (error) {
            controller.enqueue(encoder.encode(createSSEMessage({
              type: 'error',
              error: error instanceof Error ? error.message : 'Upload failed'
            })))
          } finally {
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }

    // Non-streaming mode (original behavior)
    const result = await processUploadSync(file, programTypeId, user.id, tempDir)
    return NextResponse.json(result)

  } catch (error) {
    cleanupTempFiles(tempDir)
    console.error('❌ Bulk upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process bulk upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Streaming progress version
async function processUpload(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  file: File,
  programTypeId: string,
  userId: number,
  tempDir: string
) {
  const send = (data: any) => {
    controller.enqueue(encoder.encode(createSSEMessage(data)))
  }

  try {
    // Create temp directory
    send({ type: 'status', message: 'Creating temporary directory...' })
    await mkdir(tempDir, { recursive: true })

    // Convert file to buffer
    send({ type: 'status', message: 'Reading ZIP file...' })
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Extract ZIP file
    send({ type: 'status', message: 'Extracting ZIP file...' })
    await extractZipFile(buffer, tempDir)

    // Find CSV file
    send({ type: 'status', message: 'Looking for CSV file...' })
    const csvPath = findCSVFile(tempDir)
    
    if (!csvPath) {
      cleanupTempFiles(tempDir)
      send({ type: 'error', error: 'No CSV file found in ZIP archive' })
      return
    }

    // Parse CSV
    send({ type: 'status', message: 'Parsing CSV file...' })
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const csvRows = parseCSV(csvContent)
    
    send({ type: 'status', message: `Found ${csvRows.length} entries in CSV` })

    // Find PDF files
    send({ type: 'status', message: 'Scanning for PDF files...' })
    const pdfMap = findPDFFiles(tempDir)
    send({ type: 'status', message: `Found ${pdfMap.size} PDF files` })

    // Match PDFs to CSV
    const papers = await matchPDFsToCSV(csvRows, pdfMap)
    
    // Process papers
    const result: BulkUploadResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      successfulPapers: [],
    }

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'papers')
    await mkdir(uploadsDir, { recursive: true })

    const total = papers.length
    
    for (let i = 0; i < papers.length; i++) {
      const paper = papers[i]
      const current = i + 1
      
      try {
        send({
          type: 'progress',
          current,
          total,
          file: `${paper.qpCode} - ${paper.subjectName}`,
          status: 'processing',
          counts: { success: result.success, failed: result.failed, skipped: result.skipped }
        })

        // Skip if no PDF found
        if (!paper.pdfPath) {
          result.skipped++
          result.errors.push({
            file: `${paper.qpCode} - ${paper.subjectName}`,
            error: 'PDF file not found',
          })
          send({
            type: 'skip',
            current,
            total,
            file: `${paper.qpCode} - ${paper.subjectName}`,
            error: 'PDF file not found',
            counts: { success: result.success, failed: result.failed, skipped: result.skipped }
          })
          continue
        }

        // Validate PDF file exists
        if (!fs.existsSync(paper.pdfPath)) {
          result.skipped++
          result.errors.push({
            file: `${paper.qpCode} - ${paper.subjectName}`,
            error: 'PDF file does not exist',
          })
          send({
            type: 'skip',
            current,
            total,
            file: `${paper.qpCode} - ${paper.subjectName}`,
            error: 'PDF file does not exist',
            counts: { success: result.success, failed: result.failed, skipped: result.skipped }
          })
          continue
        }

        // Validate file size (max 50MB per file)
        const stats = fs.statSync(paper.pdfPath)
        if (stats.size > 50 * 1024 * 1024) {
          result.skipped++
          result.errors.push({
            file: `${paper.qpCode} - ${paper.subjectName}`,
            error: `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max 50MB)`,
          })
          send({
            type: 'skip',
            current,
            total,
            file: `${paper.qpCode} - ${paper.subjectName}`,
            error: 'File too large',
            counts: { success: result.success, failed: result.failed, skipped: result.skipped }
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
        const fileUrl = `/uploads/papers/${newFilename}`

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
          // Delete the copied file since we're skipping
          fs.unlinkSync(destPath)
          send({
            type: 'skip',
            current,
            total,
            file: `${paper.qpCode} - ${paper.subjectName}`,
            error: 'Already exists',
            counts: { success: result.success, failed: result.failed, skipped: result.skipped }
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
            userId,
          ]
        )

        result.success++
        result.successfulPapers.push({
          qpCode: paper.qpCode,
          subjectName: paper.subjectName,
        })

        send({
          type: 'success',
          current,
          total,
          file: `${paper.qpCode} - ${paper.subjectName}`,
          counts: { success: result.success, failed: result.failed, skipped: result.skipped }
        })
      } catch (error) {
        result.failed++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push({
          file: `${paper.qpCode} - ${paper.subjectName}`,
          error: errorMsg,
        })
        send({
          type: 'error',
          current,
          total,
          file: `${paper.qpCode} - ${paper.subjectName}`,
          error: errorMsg,
          counts: { success: result.success, failed: result.failed, skipped: result.skipped }
        })
      }
    }

    // Cleanup
    cleanupTempFiles(tempDir)

    // Send final result
    send({
      type: 'complete',
      counts: { success: result.success, failed: result.failed, skipped: result.skipped },
      errors: result.errors,
      successfulPapers: result.successfulPapers
    })
  } catch (error) {
    cleanupTempFiles(tempDir)
    send({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Synchronous version (no streaming)
async function processUploadSync(
  file: File,
  programTypeId: string,
  userId: number,
  tempDir: string
): Promise<BulkUploadResult> {
  // Create temp directory
  await mkdir(tempDir, { recursive: true })

  // Convert file to buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Extract ZIP file
  console.log('📦 Extracting ZIP file...')
  await extractZipFile(buffer, tempDir)

  // Find CSV file
  const csvPath = findCSVFile(tempDir)
  
  if (!csvPath) {
    cleanupTempFiles(tempDir)
    throw new Error('No CSV file found in ZIP archive')
  }

  // Parse CSV
  console.log('📄 Parsing CSV file...')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const csvRows = parseCSV(csvContent)
  console.log(`Found ${csvRows.length} entries in CSV`)

  // Find PDF files
  console.log('🔍 Finding PDF files...')
  const pdfMap = findPDFFiles(tempDir)
  console.log(`Found ${pdfMap.size} PDF files`)

  // Match PDFs to CSV
  const papers = await matchPDFsToCSV(csvRows, pdfMap)

  // Process papers
  const result: BulkUploadResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    successfulPapers: [],
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'papers')
  await mkdir(uploadsDir, { recursive: true })

  for (const paper of papers) {
    try {
      if (!paper.pdfPath || !fs.existsSync(paper.pdfPath)) {
        result.skipped++
        result.errors.push({
          file: `${paper.qpCode} - ${paper.subjectName}`,
          error: 'PDF file not found',
        })
        continue
      }

      const departmentId = await getOrCreateDepartment(paper.departmentPrefix)
      const subjectTypeId = await getOrCreateSubjectType(paper.subjectType)

      const originalFilename = path.basename(paper.pdfPath)
      const newFilename = `${Date.now()}-${originalFilename}`
      const destPath = path.join(uploadsDir, newFilename)
      
      fs.copyFileSync(paper.pdfPath, destPath)
      const fileUrl = `/uploads/papers/${newFilename}`

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
        fs.unlinkSync(destPath)
        continue
      }

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
          userId,
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

  cleanupTempFiles(tempDir)
  console.log(`\n📊 Results: ${result.success} success, ${result.failed} failed, ${result.skipped} skipped`)

  return result
}

// Helper function to find CSV file recursively
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
