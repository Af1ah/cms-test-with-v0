import { NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

interface SubjectType {
  id: number
  name: string
  created_at: string
}

export async function GET() {
  try {
    await initializeDatabase()
    const types = await query<SubjectType>(
      "SELECT * FROM subject_types ORDER BY name ASC"
    )
    return NextResponse.json(types)
  } catch (error) {
    console.error("Error fetching subject types:", error)
    return NextResponse.json(
      { error: "Failed to fetch subject types" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase()

    // Check if user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Subject type name is required" },
        { status: 400 }
      )
    }

    // Check if type already exists
    const existing = await query<SubjectType>(
      "SELECT * FROM subject_types WHERE LOWER(name) = LOWER($1)",
      [name.trim()]
    )

    if (existing.length > 0) {
      return NextResponse.json(existing[0])
    }

    const types = await query<SubjectType>(
      "INSERT INTO subject_types (name) VALUES ($1) RETURNING *",
      [name.trim()]
    )

    return NextResponse.json(types[0], { status: 201 })
  } catch (error) {
    console.error("Error creating subject type:", error)
    return NextResponse.json(
      { error: "Failed to create subject type" },
      { status: 500 }
    )
  }
}
