// Client-safe storage utilities - NO Node.js dependencies
// This file can be safely imported in client components

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Get readable file type from MIME type
export function getFileType(mimeType: string): string {
  const types: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX'
  }
  return types[mimeType] || 'Unknown'
}

// Validate file before upload (client-safe)
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

// Storage service class for client-side compatibility
export class StorageService {
  static validateFile = validateFile
  static getFileType = getFileType
}
