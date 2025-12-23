import { writeFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'papers')
const PUBLIC_PATH = '/uploads/papers'

// Allowed file types for question papers
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for documents

export interface UploadResult {
  path: string
  publicUrl: string
  fileName: string
  fileType: string
  originalName: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Get file extension from MIME type
function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  }
  return extensions[mimeType] || ''
}

// Get readable file type
function getFileType(mimeType: string): string {
  const types: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
  }
  return types[mimeType] || 'unknown'
}

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// Generate unique filename
function generateFileName(originalName: string, mimeType: string): string {
  const ext = getFileExtension(mimeType) || path.extname(originalName).toLowerCase()
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
      error: 'Please select a valid document file (PDF, DOC, or DOCX)'
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'File size must be less than 50MB'
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
  const fileName = customFileName || generateFileName(file.name, file.type)
  const filePath = path.join(UPLOAD_DIR, fileName)

  // Convert File to Buffer and save
  const bytes = await file.arrayBuffer()
  const uint8Array = new Uint8Array(bytes)
  await writeFile(filePath, uint8Array)

  console.log('✅ File uploaded successfully:', fileName)

  return {
    path: filePath,
    publicUrl: `${PUBLIC_PATH}/${fileName}`,
    fileName,
    fileType: getFileType(file.type),
    originalName: file.name
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
