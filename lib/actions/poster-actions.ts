'use server'

import { query, initializeDatabase } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { deleteFile } from "@/lib/storage"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

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

export async function deletePoster(posterId: string) {
  // Ensure database is initialized
  await initializeDatabase()

  // Verify authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    console.log('Server Action: Attempting to delete poster with ID:', posterId)
    
    // First check if the poster exists
    const posterCheck = await query<Poster>(
      "SELECT * FROM posters WHERE id = $1",
      [posterId]
    )

    if (posterCheck.length === 0) {
      throw new Error('Poster not found')
    }

    const poster = posterCheck[0]
    console.log('Server Action: Poster found:', poster)

    // Delete the image file if it's a local file
    if (poster.image_url && poster.image_url.startsWith('/uploads/')) {
      try {
        await deleteFile(poster.image_url)
      } catch (err) {
        console.warn('Warning: Could not delete image file:', err)
      }
    }

    // Now attempt to delete from database
    await query("DELETE FROM posters WHERE id = $1", [posterId])

    console.log('Server Action: Delete successful')
    
    // Revalidate the cache for both gallery and admin pages
    revalidatePath('/gallery')
    revalidatePath('/admin/posters')
    
    return { success: true, message: 'Poster deleted successfully' }
  } catch (error) {
    console.error('Server Action: Handle delete error:', error)
    throw error instanceof Error ? error : new Error('An unexpected error occurred')
  }
}

export async function createPoster(formData: FormData) {
  // Ensure database is initialized
  await initializeDatabase()

  // Verify authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const image_url = formData.get('image_url') as string
    const featured = formData.get('featured') === 'true'

    if (!title || !image_url) {
      throw new Error('Title and image URL are required')
    }

    const posters = await query<Poster>(
      `INSERT INTO posters (title, description, category, image_url, featured, created_by, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [title, description || null, category || null, image_url, featured, user.id]
    )

    console.log('Server Action: Poster created successfully:', posters[0])
    
    // Revalidate the cache
    revalidatePath('/gallery')
    revalidatePath('/admin/posters')
    
    return { success: true, message: 'Poster created successfully', data: posters[0] }
  } catch (error) {
    console.error('Server Action: Create poster error:', error)
    throw error instanceof Error ? error : new Error('An unexpected error occurred')
  }
}

export async function updatePoster(posterId: string, formData: FormData) {
  // Ensure database is initialized
  await initializeDatabase()

  // Verify authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const image_url = formData.get('image_url') as string
    const featured = formData.get('featured') === 'true'

    if (!title || !image_url) {
      throw new Error('Title and image URL are required')
    }

    const posters = await query<Poster>(
      `UPDATE posters 
       SET title = $1, description = $2, category = $3, image_url = $4, featured = $5, updated_at = NOW() 
       WHERE id = $6 
       RETURNING *`,
      [title, description || null, category || null, image_url, featured, posterId]
    )

    if (posters.length === 0) {
      throw new Error('Poster not found')
    }

    console.log('Server Action: Poster updated successfully:', posters[0])
    
    // Revalidate the cache
    revalidatePath('/gallery')
    revalidatePath('/admin/posters')
    revalidatePath(`/admin/posters/${posterId}`)
    
    return { success: true, message: 'Poster updated successfully', data: posters[0] }
  } catch (error) {
    console.error('Server Action: Update poster error:', error)
    throw error instanceof Error ? error : new Error('An unexpected error occurred')
  }
}
