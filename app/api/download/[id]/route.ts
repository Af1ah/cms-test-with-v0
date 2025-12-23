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

    // Build file path
    const fileName = path.basename(paper.file_url)
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'papers', fileName)

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(filePath)

    // Determine content type
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    const contentType = contentTypes[paper.file_type] || 'application/octet-stream'

    // Generate download filename
    const downloadFilename = paper.original_filename || 
      `${paper.subject_code}_${paper.subject_name}.${paper.file_type}`

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadFilename)}"; filename*=UTF-8''${encodeURIComponent(downloadFilename)}`,
        'Content-Length': fileBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error("Error downloading paper:", error)
    return NextResponse.json(
      { error: "Failed to download paper" },
      { status: 500 }
    )
  }
}
