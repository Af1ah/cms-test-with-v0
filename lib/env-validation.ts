/**
 * Environment variable validation
 * Ensures all required environment variables are set and valid
 */

export interface EnvConfig {
  dbUser: string
  dbHost: string
  dbName: string
  dbPassword: string
  dbPort: number
  jwtSecret: string
  nodeEnv: string
  adminAccessKey?: string
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EnvValidationError'
  }
}

/**
 * Validates and returns environment configuration
 * Throws EnvValidationError if validation fails
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = []

  // Database configuration
  const dbUser = process.env.DB_USER
  const dbHost = process.env.DB_HOST
  const dbName = process.env.DB_NAME
  const dbPassword = process.env.DB_PASSWORD
  const dbPort = process.env.DB_PORT

  if (!dbUser) errors.push('DB_USER is required')
  if (!dbHost) errors.push('DB_HOST is required')
  if (!dbName) errors.push('DB_NAME is required')
  if (!dbPassword) errors.push('DB_PASSWORD is required')
  if (!dbPort) errors.push('DB_PORT is required')

  // JWT Secret validation
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required')
  } else if (jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long for security')
  } else if (jwtSecret === 'your-super-secret-jwt-key-min-32-chars-long') {
    errors.push('JWT_SECRET must be changed from the default value in production')
  }

  // Node environment
  const nodeEnv = process.env.NODE_ENV || 'development'

  if (errors.length > 0) {
    throw new EnvValidationError(
      `Environment validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
    )
  }

  return {
    dbUser: dbUser!,
    dbHost: dbHost!,
    dbName: dbName!,
    dbPassword: dbPassword!,
    dbPort: parseInt(dbPort!, 10),
    jwtSecret: jwtSecret!,
    nodeEnv,
    adminAccessKey: process.env.ADMIN_ACCESS_KEY,
  }
}

/**
 * Validates environment variables and logs warnings
 * Returns true if valid, false otherwise
 */
export function checkEnv(): boolean {
  try {
    validateEnv()
    console.log('✅ Environment variables validated successfully')
    return true
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error('❌ Environment validation failed:')
      console.error(error.message)
      return false
    }
    throw error
  }
}
