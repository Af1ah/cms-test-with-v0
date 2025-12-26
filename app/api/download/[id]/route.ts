import { NextRequest, NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface QuestionPaper {
  id: number
  file_url: string
  file_type: string
  original_filename: string | null
  subject_name: string
  subject_code: string
}

// GET /api/download/[id] - Download a paper (NO AUTH REQUIRED)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await initializeDatabase()

    const papers = await query<QuestionPaper>(
      "SELECT id, file_url, file_type, original_filename, subject_name, subject_code FROM question_papers WHERE id = $1",
      [id]
    )

    if (papers.length === 0) {
      return NextResponse.json(
        { error: "Paper not found" },
        { status: 404 }
      )
    }

    const paper = papers[0]

    // Build file path - handle both old and new file structures
    const fileName = path.basename(paper.file_url)
    
    // Try new path first (/public/uploads/papers/)
    let filePath = path.join(process.cwd(), 'public', 'uploads', 'papers', fileName)
    
    // If not found, try old path (/public/uploads/)
    if (!existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'public', 'uploads', fileName)
      console.log(`📁 Trying old path: ${filePath}`)
    }
    
    // If still not found, try the exact path from database
    if (!existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'public', paper.file_url)
      console.log(`📁 Trying database path: ${filePath}`)
    }

    if (!existsSync(filePath)) {
      console.error(`❌ File not found for paper ${id}:`)
      console.error(`   Database URL: ${paper.file_url}`)
      console.error(`   Tried paths:`)
      console.error(`   - ${path.join(process.cwd(), 'public', 'uploads', 'papers', fileName)}`)
      console.error(`   - ${path.join(process.cwd(), 'public', 'uploads', fileName)}`)
      console.error(`   - ${path.join(process.cwd(), 'public', paper.file_url)}`)
      
      return NextResponse.json(
        { error: "File not found on server. Please contact administrator." },
        { status: 404 }
      )
    }

    console.log(`✅ Found file: ${filePath}`)

    // Read file
    const fileBuffer = await readFile(filePath)

    // Determine content type
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    const contentType = contentTypes[paper.file_type.toLowerCase()] || 'application/octet-stream'

    // Generate download filename
    const downloadFilename = paper.original_filename || 
      `${paper.subject_code}_${paper.subject_name}.${paper.file_type}`

    // Sanitize filename for the attachment header
    const sanitizedFilename = downloadFilename.replace(/[/\\?%*:|"<>/]/g, '_')

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"; filename*=UTF-8''${encodeURIComponent(downloadFilename)}`,
        'Content-Length': fileBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
  } catch (error) {
    console.error("Error downloading paper:", error)
    return NextResponse.json(
      { error: "Failed to download paper", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
