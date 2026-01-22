import { writeFile, unlink, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

// Secure storage directory (outside web root)
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(process.cwd(), 'uploads')
const UPLOAD_DIR = path.join(STORAGE_PATH, 'papers')

// Allowed file types for question papers
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for documents

export interface UploadResult {
  fileId: string      // UUID - the only identifier exposed externally
  fileType: string
  originalName: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface FileInfo {
  buffer: Buffer
  mimeType: string
  originalName: string
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

// Get MIME type from file extension
function getMimeType(fileType: string): string {
  const mimes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  return mimes[fileType.toLowerCase()] || 'application/octet-stream'
}

// Ensure upload directory exists with proper permissions
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true, mode: 0o750 })
  }
}

// Generate secure UUID filename (no information leakage)
function generateSecureFileName(mimeType: string): string {
  const uuid = crypto.randomUUID()
  const ext = getFileExtension(mimeType)
  return `${uuid}${ext}`
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

// Upload file to secure storage (returns only UUID, no path exposure)
export async function uploadFile(file: File): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  // Ensure upload directory exists
  await ensureUploadDir()

  // Generate secure filename with UUID
  const fileName = generateSecureFileName(file.type)
  const filePath = path.join(UPLOAD_DIR, fileName)

  // Convert File to Buffer and save
  const bytes = await file.arrayBuffer()
  const uint8Array = new Uint8Array(bytes)
  await writeFile(filePath, uint8Array, { mode: 0o640 }) // Owner read/write, group read

  console.log('✅ File uploaded securely:', fileName)

  // Return only the UUID-based file ID (no path exposure)
  return {
    fileId: fileName, // This is the UUID.ext format
    fileType: getFileType(file.type),
    originalName: file.name
  }
}

// Read file from secure storage (for API-based serving)
export async function readSecureFile(fileId: string): Promise<FileInfo | null> {
  try {
    // Sanitize filename to prevent path traversal attacks
    const sanitizedFileId = path.basename(fileId)
    const filePath = path.join(UPLOAD_DIR, sanitizedFileId)

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error('❌ File not found:', sanitizedFileId)
      return null
    }

    // Read file
    const buffer = await readFile(filePath)
    
    // Determine MIME type from extension
    const ext = path.extname(sanitizedFileId).slice(1)
    const mimeType = getMimeType(ext)

    return {
      buffer,
      mimeType,
      originalName: sanitizedFileId
    }
  } catch (error) {
    console.error('❌ Error reading file:', error)
    return null
  }
}

// Delete file from secure storage
export async function deleteFile(fileId: string): Promise<void> {
  try {
    // Sanitize filename to prevent path traversal attacks
    const sanitizedFileId = path.basename(fileId)
    const filePath = path.join(UPLOAD_DIR, sanitizedFileId)

    if (existsSync(filePath)) {
      await unlink(filePath)
      console.log('✅ File deleted securely:', sanitizedFileId)
    }
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}

// Check if file exists
export function fileExists(fileId: string): boolean {
  const sanitizedFileId = path.basename(fileId)
  const filePath = path.join(UPLOAD_DIR, sanitizedFileId)
  return existsSync(filePath)
}

// Storage service class for compatibility
export class StorageService {
  static validateFile = validateFile
  static uploadFile = uploadFile
  static deleteFile = deleteFile
  static readSecureFile = readSecureFile
  static fileExists = fileExists
}
