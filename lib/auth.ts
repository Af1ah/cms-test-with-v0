import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { query, checkDatabaseHealth } from './db'
import { validateEnv } from './env-validation'

// Validate environment on module load
let envConfig: ReturnType<typeof validateEnv> | null = null
try {
  envConfig = validateEnv()
} catch (error) {
  console.error('❌ Environment validation failed:', error)
}

const JWT_SECRET = new TextEncoder().encode(
  envConfig?.jwtSecret || process.env.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars-long'
)

const SALT_ROUNDS = 12
const TOKEN_EXPIRY = '24h'
const COOKIE_NAME = 'auth_token'

export interface User {
  id: number
  email: string
  name: string | null
  role: string
  created_at: string
}

export interface JWTPayload {
  userId: number
  email: string
  role: string
  iat: number
  exp: number
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT token management
export async function createToken(user: User): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET)

  return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  const timeout = 2000 // 2 seconds timeout for token verification
  
  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Token verification timeout')), timeout)
    })

    // Race between verification and timeout
    const { payload } = await Promise.race([
      jwtVerify(token, JWT_SECRET),
      timeoutPromise
    ])
    
    return payload as unknown as JWTPayload
  } catch (error) {
    // Don't log expected errors (expired tokens, invalid format)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    if (!errorMessage.includes('expired') && 
        !errorMessage.includes('invalid') && 
        !errorMessage.includes('timeout')) {
      console.error('❌ Token verification failed:', error)
    }
    return null
  }
}

// Cookie options helper
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  }
}

// Session cookie management - For use in Server Components
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, getCookieOptions())
}

// Set cookie on NextResponse - For use in API Routes
export function setSessionCookieOnResponse(response: NextResponse, token: string): NextResponse {
  response.cookies.set(COOKIE_NAME, token, getCookieOptions())
  return response
}

export async function getSessionCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(COOKIE_NAME)
    return cookie?.value || null
  } catch (error) {
    // Cookies might not be available in some contexts
    return null
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Clear cookie on NextResponse - For use in API Routes
export function clearSessionCookieOnResponse(response: NextResponse): NextResponse {
  response.cookies.delete(COOKIE_NAME)
  return response
}

// Get current user from session
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = await getSessionCookie()
    if (!token) {
      return null
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return null
    }

    // Add timeout for database query
    const timeout = 5000 // 5 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('User query timeout')), timeout)
    })

    const users = await Promise.race([
      query<User>(
        'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
        [payload.userId]
      ),
      timeoutPromise
    ])

    return users[0] || null
  } catch (error) {
    console.error('❌ Error getting current user:', error)
    return null
  }
}

// User database operations
export async function createUser(
  email: string,
  password: string,
  name?: string,
  role: string = 'teacher'
): Promise<User> {
  const passwordHash = await hashPassword(password)
  
  const users = await query<User>(
    `INSERT INTO users (email, password_hash, name, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, email, name, role, created_at`,
    [email, passwordHash, name || null, role]
  )

  return users[0]
}

export async function getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  try {
    // Check database health before querying
    const isHealthy = await checkDatabaseHealth()
    if (!isHealthy) {
      throw new Error('Database connection is not healthy')
    }

    const users = await query<User & { password_hash: string }>(
      'SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = $1',
      [email]
    )
    return users[0] || null
  } catch (error) {
    console.error('❌ Error getting user by email:', error)
    throw error
  }
}

export async function getUserCount(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*) as count FROM users')
  return parseInt(result[0]?.count || '0')
}

// Authentication helper for API routes
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export { COOKIE_NAME }
