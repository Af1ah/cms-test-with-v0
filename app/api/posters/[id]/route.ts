import { NextRequest, NextResponse } from "next/server"
import { query, initializeDatabase } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { deleteFile } from "@/lib/storage"

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

// GET /api/posters/[id] - Get a single poster
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await initializeDatabase()

    const posters = await query<Poster>(
      "SELECT * FROM posters WHERE id = $1",
      [id]
    )

    if (posters.length === 0) {
      return NextResponse.json(
        { error: "Poster not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(posters[0])
  } catch (error) {
    console.error("Error fetching poster:", error)
    return NextResponse.json(
      { error: "Failed to fetch poster" },
      { status: 500 }
    )
  }
}

// PUT /api/posters/[id] - Update a poster
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

    const body = await request.json()
    const { title, description, image_url, category, featured } = body

    if (!title || !image_url) {
      return NextResponse.json(
        { error: "Title and image URL are required" },
        { status: 400 }
      )
    }

    const posters = await query<Poster>(
      `UPDATE posters 
       SET title = $1, description = $2, image_url = $3, category = $4, featured = $5, updated_at = NOW() 
       WHERE id = $6 
       RETURNING *`,
      [title, description || null, image_url, category || null, featured || false, id]
    )

    if (posters.length === 0) {
      return NextResponse.json(
        { error: "Poster not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(posters[0])
  } catch (error) {
    console.error("Error updating poster:", error)
    return NextResponse.json(
      { error: "Failed to update poster" },
      { status: 500 }
    )
  }
}

// DELETE /api/posters/[id] - Delete a poster
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

    // Get poster to delete its image file
    const posters = await query<Poster>(
      "SELECT * FROM posters WHERE id = $1",
      [id]
    )

    if (posters.length === 0) {
      return NextResponse.json(
        { error: "Poster not found" },
        { status: 404 }
      )
    }

    const poster = posters[0]

    // Delete the image file if it's a local file
    if (poster.image_url && poster.image_url.startsWith('/uploads/')) {
      try {
        await deleteFile(poster.image_url)
      } catch (err) {
        console.warn('Warning: Could not delete image file:', err)
      }
    }

    // Delete from database
    await query("DELETE FROM posters WHERE id = $1", [id])

    return NextResponse.json({ success: true, message: "Poster deleted" })
  } catch (error) {
    console.error("Error deleting poster:", error)
    return NextResponse.json(
      { error: "Failed to delete poster" },
      { status: 500 }
    )
  }
}
