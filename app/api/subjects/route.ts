import { NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"

interface SubjectInfo {
  subject_code: string
  subject_name: string
}

// GET /api/subjects - Get subject name suggestions based on subject code
export async function GET(request: Request) {
  try {
    await initializeDatabase()

    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (!code) {
      // Return all unique subject codes and names
      const subjects = await query<SubjectInfo>(
        `SELECT DISTINCT subject_code, subject_name 
         FROM question_papers 
         ORDER BY subject_code ASC`
      )
      return NextResponse.json(subjects)
    }

    // Find subject name by exact code match
    const subjects = await query<SubjectInfo>(
      `SELECT DISTINCT subject_code, subject_name 
       FROM question_papers 
       WHERE UPPER(subject_code) = UPPER($1)
       LIMIT 1`,
      [code]
    )

    if (subjects.length > 0) {
      return NextResponse.json(subjects[0])
    }

    return NextResponse.json(null)
  } catch (error) {
    console.error("Error fetching subjects:", error)
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    )
  }
}
