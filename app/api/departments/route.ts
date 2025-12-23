import { NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

interface Department {
  id: number
  name: string
  created_at: string
}

export async function GET() {
  try {
    await initializeDatabase()
    const departments = await query<Department>(
      "SELECT * FROM departments ORDER BY name ASC"
    )
    return NextResponse.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json(
      { error: "Failed to fetch departments" },
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
        { error: "Department name is required" },
        { status: 400 }
      )
    }

    // Check if department already exists
    const existing = await query<Department>(
      "SELECT * FROM departments WHERE LOWER(name) = LOWER($1)",
      [name.trim()]
    )

    if (existing.length > 0) {
      return NextResponse.json(existing[0])
    }

    const departments = await query<Department>(
      "INSERT INTO departments (name) VALUES ($1) RETURNING *",
      [name.trim()]
    )

    return NextResponse.json(departments[0], { status: 201 })
  } catch (error) {
    console.error("Error creating department:", error)
    return NextResponse.json(
      { error: "Failed to create department" },
      { status: 500 }
    )
  }
}
