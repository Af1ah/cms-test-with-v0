import { NextRequest, NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { deleteFile } from "@/lib/storage"

interface QuestionPaper {
  id: number
  subject_name: string
  subject_code: string
  paper_code: string | null
  year_of_examination: number
  semester: number
  subject_type_id: number | null
  department_id: number | null
  description: string | null
  file_url: string
  file_type: string
  original_filename: string | null
  created_by: number | null
  created_at: string
  department_name?: string
  subject_type_name?: string
}

// GET /api/papers/[id] - Get a single paper
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await initializeDatabase()

    const papers = await query<QuestionPaper>(
      `SELECT qp.*, 
              d.name as department_name, 
              st.name as subject_type_name
       FROM question_papers qp
       LEFT JOIN departments d ON qp.department_id = d.id
       LEFT JOIN subject_types st ON qp.subject_type_id = st.id
       WHERE qp.id = $1`,
      [id]
    )

    if (papers.length === 0) {
      return NextResponse.json(
        { error: "Paper not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(papers[0])
  } catch (error) {
    console.error("Error fetching paper:", error)
    return NextResponse.json(
      { error: "Failed to fetch paper" },
      { status: 500 }
    )
  }
}

// PUT /api/papers/[id] - Update a paper
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await initializeDatabase()

    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get existing paper to check ownership
    const existingPapers = await query<QuestionPaper>(
      "SELECT * FROM question_papers WHERE id = $1",
      [id]
    )

    if (existingPapers.length === 0) {
      return NextResponse.json(
        { error: "Paper not found" },
        { status: 404 }
      )
    }

    const existingPaper = existingPapers[0]

    // Only creator or admin can update
    if (user.role !== 'admin' && existingPaper.created_by !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to edit this paper" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      subject_name, 
      subject_code, 
      paper_code,
      year_of_examination,
      semester,
      subject_type_id,
      department_id,
      description, 
      file_url,
      file_type,
      original_filename
    } = body

    if (!subject_name || !subject_code || !year_of_examination || !semester || !file_url) {
      return NextResponse.json(
        { error: "Subject name, code, year, semester, and file are required" },
        { status: 400 }
      )
    }

    const papers = await query<QuestionPaper>(
      `UPDATE question_papers 
       SET subject_name = $1, subject_code = $2, paper_code = $3, 
           year_of_examination = $4, semester = $5, subject_type_id = $6, 
           department_id = $7, description = $8, file_url = $9, 
           file_type = $10, original_filename = $11, updated_at = NOW() 
       WHERE id = $12 
       RETURNING *`,
      [
        subject_name, subject_code, paper_code || null,
        year_of_examination, semester, subject_type_id || null,
        department_id || null, description || null, file_url,
        file_type, original_filename || null, id
      ]
    )

    if (papers.length === 0) {
      return NextResponse.json(
        { error: "Paper not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(papers[0])
  } catch (error) {
    console.error("Error updating paper:", error)
    return NextResponse.json(
      { error: "Failed to update paper" },
      { status: 500 }
    )
  }
}

// DELETE /api/papers/[id] - Delete a paper
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await initializeDatabase()

    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get paper to delete its file
    const papers = await query<QuestionPaper>(
      "SELECT * FROM question_papers WHERE id = $1",
      [id]
    )

    if (papers.length === 0) {
      return NextResponse.json(
        { error: "Paper not found" },
        { status: 404 }
      )
    }

    const paper = papers[0]

    // Only creator or admin can delete
    if (user.role !== 'admin' && paper.created_by !== user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this paper" },
        { status: 403 }
      )
    }

    // Delete the file if it's a local file
    if (paper.file_url && paper.file_url.startsWith('/uploads/')) {
      try {
        await deleteFile(paper.file_url)
      } catch (err) {
        console.warn('Warning: Could not delete file:', err)
      }
    }

    // Delete from database
    await query("DELETE FROM question_papers WHERE id = $1", [id])

    return NextResponse.json({ success: true, message: "Paper deleted" })
  } catch (error) {
    console.error("Error deleting paper:", error)
    return NextResponse.json(
      { error: "Failed to delete paper" },
      { status: 500 }
    )
  }
}
