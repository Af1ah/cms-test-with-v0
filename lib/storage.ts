import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'posters')
const PUBLIC_PATH = '/uploads/posters'

// Allowed file types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export interface UploadResult {
  path: string
  publicUrl: string
  fileName: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// Generate unique filename
function generateFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase()
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11)
  return `${timestamp}-${random}${ext}`
}

// Validate file before upload
export function validateFile(file: File): ValidationResult {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, WebP, or GIF)'
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB'
    }
  }

  return { isValid: true }
}

// Upload file to local storage
export async function uploadFile(file: File, customFileName?: string): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  // Ensure upload directory exists
  await ensureUploadDir()

  // Generate filename
  const fileName = customFileName || generateFileName(file.name)
  const filePath = path.join(UPLOAD_DIR, fileName)

  // Convert File to Buffer and save
  const bytes = await file.arrayBuffer()
  const uint8Array = new Uint8Array(bytes)
  await writeFile(filePath, uint8Array)

  console.log('✅ File uploaded successfully:', fileName)

  return {
    path: filePath,
    publicUrl: `${PUBLIC_PATH}/${fileName}`,
    fileName
  }
}

// Delete file from local storage
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Extract filename from URL
    const fileName = path.basename(fileUrl)
    const filePath = path.join(UPLOAD_DIR, fileName)

    if (existsSync(filePath)) {
      await unlink(filePath)
      console.log('✅ File deleted successfully:', fileName)
    }
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}

// Extract filename from public URL
export function extractFileNameFromUrl(url: string): string | null {
  try {
    if (url.startsWith(PUBLIC_PATH)) {
      return path.basename(url)
    }
    const urlObj = new URL(url, 'http://localhost')
    return path.basename(urlObj.pathname)
  } catch {
    return null
  }
}

// Get public URL for a filename
export function getPublicUrl(fileName: string): string {
  return `${PUBLIC_PATH}/${fileName}`
}

// Storage service class for compatibility
export class StorageService {
  static validateFile = validateFile
  static uploadFile = uploadFile
  static deleteFile = deleteFile
  static extractPathFromUrl = extractFileNameFromUrl
  static getPublicUrl = getPublicUrl
}
