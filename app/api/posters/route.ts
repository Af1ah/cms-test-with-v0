import { NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

interface Poster {
  id: number
  title: string
  description: string | null
  category: string | null
  image_url: string
  created_by: number | null
  featured: boolean
  created_at: string
}

export async function GET(request: Request) {
  try {
    // Ensure database is initialized
    await initializeDatabase()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limit = searchParams.get("limit")
    const featured = searchParams.get("featured")

    let sql = "SELECT * FROM posters"
    const params: unknown[] = []
    const conditions: string[] = []

    if (category) {
      conditions.push(`category = $${params.length + 1}`)
      params.push(category)
    }

    if (featured === "true") {
      conditions.push(`featured = true`)
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ")
    }

    sql += " ORDER BY created_at DESC"

    if (limit) {
      sql += ` LIMIT $${params.length + 1}`
      params.push(parseInt(limit))
    }

    const posters = await query<Poster>(sql, params)
    return NextResponse.json(posters)
  } catch (error) {
    console.error("Error fetching posters:", error)
    return NextResponse.json(
      { error: "Failed to fetch posters" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  console.log("🚀 POST /api/posters - Starting request")

  try {
    // Ensure database is initialized
    await initializeDatabase()

    // Check if user is authenticated
    const user = await getCurrentUser()

    console.log("🔐 Auth check:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
    })

    if (!user) {
      console.log("❌ Unauthorized - no user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("📝 Request body:", body)

    const { title, description, image_url, category, featured } = body

    if (!title || !image_url) {
      console.log("❌ Missing required fields:", {
        hasTitle: !!title,
        hasImageUrl: !!image_url,
      })
      return NextResponse.json(
        { error: "Title and image URL are required" },
        { status: 400 }
      )
    }

    const posters = await query<Poster>(
      `INSERT INTO posters (title, description, image_url, category, featured, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [title, description || null, image_url, category || null, featured || false, user.id]
    )

    console.log("✅ Poster created successfully:", posters[0])
    return NextResponse.json(posters[0], { status: 201 })
  } catch (error: unknown) {
    console.log("💥 Unexpected error:", error)
    const err = error as Error
    return NextResponse.json(
      {
        error: "Failed to create poster",
        details: err.message,
      },
      { status: 500 }
    )
  }
}
