import { NextResponse } from "next/server"
import { query } from "@/lib/db"

interface ProgramType {
  id: number
  name: string
  created_at: string
}

// GET all program types
export async function GET() {
  try {
    const programTypes = await query<ProgramType>(
      "SELECT * FROM program_types ORDER BY name ASC"
    )
    return NextResponse.json(programTypes)
  } catch (error) {
    console.error("Error fetching program types:", error)
    return NextResponse.json(
      { error: "Failed to fetch program types" },
      { status: 500 }
    )
  }
}

// POST - Create new program type
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Program type name is required" },
        { status: 400 }
      )
    }

    // Check if program type already exists
    const existing = await query<ProgramType>(
      "SELECT * FROM program_types WHERE LOWER(name) = LOWER($1)",
      [name.trim()]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Program type already exists" },
        { status: 409 }
      )
    }

    // Create new program type
    const newProgramType = await query<ProgramType>(
      "INSERT INTO program_types (name) VALUES ($1) RETURNING *",
      [name.trim()]
    )

    return NextResponse.json(newProgramType[0], { status: 201 })
  } catch (error) {
    console.error("Error creating program type:", error)
    return NextResponse.json(
      { error: "Failed to create program type" },
      { status: 500 }
    )
  }
}
