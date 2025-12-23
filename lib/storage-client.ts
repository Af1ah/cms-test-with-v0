// Client-safe storage utilities - NO Node.js dependencies
// This file can be safely imported in client components

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Validate file before upload (client-safe)
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

// Storage service class for client-side compatibility
export class StorageService {
  static validateFile = validateFile
}
