import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { readSecureFile } from "@/lib/storage"

interface QuestionPaper {
  id: number
  file_url: string
  file_type: string
  original_filename: string | null
  subject_name: string
  subject_code: string
}

// GET /api/download/[id] - Download a paper (NO AUTH REQUIRED for public read)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Validate ID is a number
    const paperId = parseInt(id)
    if (isNaN(paperId)) {
      return NextResponse.json(
        { error: "Invalid paper ID" },
        { status: 400 }
      )
    }

    const papers = await query<QuestionPaper>(
      "SELECT id, file_url, file_type, original_filename, subject_name, subject_code FROM question_papers WHERE id = $1",
      [paperId]
    )

    if (papers.length === 0) {
      return NextResponse.json(
        { error: "Paper not found" },
        { status: 404 }
      )
    }

    const paper = papers[0]

    // Read file from secure storage (file_url contains the secure file ID)
    const fileInfo = await readSecureFile(paper.file_url)
    
    if (!fileInfo) {
      console.error(`❌ File not found for paper ${id}: ${paper.file_url}`)
      return NextResponse.json(
        { error: "File not found on server. Please contact administrator." },
        { status: 404 }
      )
    }

    // Determine content type
    const contentTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    const contentType = contentTypes[paper.file_type.toLowerCase()] || fileInfo.mimeType

    // Generate download filename from metadata (never expose internal file ID)
    const downloadFilename = paper.original_filename || 
      `${paper.subject_code}_${paper.subject_name}.${paper.file_type}`

    // Sanitize filename for the attachment header
    const sanitizedFilename = downloadFilename.replace(/[/\\?%*:|"<>/]/g, '_')

    return new NextResponse(new Uint8Array(fileInfo.buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"; filename*=UTF-8''${encodeURIComponent(downloadFilename)}`,
        'Content-Length': fileInfo.buffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        // Security headers
        'X-Frame-Options': 'DENY',
        'X-Download-Options': 'noopen',
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
