import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { uploadFile, validateFile } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only authenticated users can upload
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to upload files' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Upload file to secure storage
    const result = await uploadFile(file)

    // Return only file ID (UUID), never expose system paths
    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      fileType: result.fileType,
      // Note: No path or publicUrl exposed - files served via /api/download only
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
