import { NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

interface QuestionPaper {
  id: number
  subject_name: string
  subject_code: string
  paper_code: string | null
  year_of_examination: number
  semester: number
  subject_type_id: number | null
  program_type_id: number | null
  department_id: number | null
  description: string | null
  file_url: string
  file_type: string
  original_filename: string | null
  created_by: number | null
  created_at: string
  // Joined fields
  department_name?: string
  subject_type_name?: string
  program_type_name?: string
}

export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get("subject")
    const subjectCode = searchParams.get("subject_code")
    const year = searchParams.get("year")
    const semester = searchParams.get("semester")
    const departmentId = searchParams.get("department_id")
    const subjectTypeId = searchParams.get("subject_type_id")
    const programTypeId = searchParams.get("program_type_id")
    const limit = searchParams.get("limit")

    let sql = `
      SELECT qp.*, 
             d.name as department_name, 
             st.name as subject_type_name,
             pt.name as program_type_name
      FROM question_papers qp
      LEFT JOIN departments d ON qp.department_id = d.id
      LEFT JOIN subject_types st ON qp.subject_type_id = st.id
      LEFT JOIN program_types pt ON qp.program_type_id = pt.id
    `
    const params: unknown[] = []
    const conditions: string[] = []

    if (subject) {
      conditions.push(`qp.subject_name ILIKE $${params.length + 1}`)
      params.push(`%${subject}%`)
    }

    if (subjectCode) {
      conditions.push(`qp.subject_code ILIKE $${params.length + 1}`)
      params.push(`%${subjectCode}%`)
    }

    if (year) {
      conditions.push(`qp.year_of_examination = $${params.length + 1}`)
      params.push(parseInt(year))
    }

    if (semester) {
      conditions.push(`qp.semester = $${params.length + 1}`)
      params.push(parseInt(semester))
    }

    if (departmentId) {
      conditions.push(`qp.department_id = $${params.length + 1}`)
      params.push(parseInt(departmentId))
    }

    if (subjectTypeId) {
      conditions.push(`qp.subject_type_id = $${params.length + 1}`)
      params.push(parseInt(subjectTypeId))
    }

    if (programTypeId) {
      conditions.push(`qp.program_type_id = $${params.length + 1}`)
      params.push(parseInt(programTypeId))
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ")
    }

    sql += " ORDER BY qp.created_at DESC"

    if (limit) {
      sql += ` LIMIT $${params.length + 1}`
      params.push(parseInt(limit))
    }

    const papers = await query<QuestionPaper>(sql, params)
    return NextResponse.json(papers)
  } catch (error) {
    console.error("Error fetching papers:", error)
    return NextResponse.json(
      { error: "Failed to fetch papers" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  console.log("🚀 POST /api/papers - Starting request")

  try {

    // Check if user is authenticated
    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ Unauthorized - no user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 Request body:", body)

    const { 
      subject_name, 
      subject_code, 
      paper_code,
      year_of_examination,
      semester,
      subject_type_id,
      program_type_id,
      department_id,
      description, 
      file_url,
      file_type,
      original_filename
    } = body

    // Validate required fields
    if (!subject_name || !subject_code || !year_of_examination || !semester || !file_url || !file_type) {
      return NextResponse.json(
        { error: "Subject name, code, year, semester, and file are required" },
        { status: 400 }
      )
    }

    // Validate semester range
    if (semester < 1 || semester > 10) {
      return NextResponse.json(
        { error: "Semester must be between 1 and 10" },
        { status: 400 }
      )
    }

    const papers = await query<QuestionPaper>(
      `INSERT INTO question_papers (
        subject_name, subject_code, paper_code, year_of_examination, 
        semester, subject_type_id, program_type_id, department_id, description, 
        file_url, file_type, original_filename, created_by
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [
        subject_name, 
        subject_code, 
        paper_code || null, 
        year_of_examination,
        semester,
        subject_type_id || null,
        program_type_id || null, 
        department_id || null, 
        description || null, 
        file_url, 
        file_type,
        original_filename || null,
        user.id
      ]
    )

    console.log("✅ Paper created successfully:", papers[0])
    return NextResponse.json(papers[0], { status: 201 })
  } catch (error: unknown) {
    console.log("💥 Unexpected error:", error)
    const err = error as Error
    return NextResponse.json(
      {
        error: "Failed to create paper",
        details: err.message,
      },
      { status: 500 }
    )
  }
}
