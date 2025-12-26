import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, verifyPassword, createToken, setSessionCookieOnResponse } from '@/lib/auth'
import { initializeDatabase, checkDatabaseHealth } from '@/lib/db'

// Simple in-memory rate limiting (for production, use Redis or similar)
const loginAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const attempt = loginAttempts.get(email)
  
  if (!attempt || now > attempt.resetTime) {
    loginAttempts.set(email, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return true
  }
  
  if (attempt.count >= 5) {
    return false // Too many attempts
  }
  
  attempt.count++
  return true
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  const startTime = Date.now()
  
  console.log(`[${requestId}] 🔐 Login request started`)

  try {
    // Set a timeout for the entire request (10 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 10000)
    })

    const loginPromise = async () => {
      // Ensure database is initialized
      await initializeDatabase()

      // Check database health
      const isHealthy = await checkDatabaseHealth()
      if (!isHealthy) {
        console.error(`[${requestId}] ❌ Database health check failed`)
        return NextResponse.json(
          { error: 'Database connection issue. Please try again.', code: 'DB_UNHEALTHY' },
          { status: 503 }
        )
      }

      const body = await request.json()
      const { email, password } = body

      // Validate input
      if (!email || !password) {
        console.log(`[${requestId}] ⚠️ Missing credentials`)
        return NextResponse.json(
          { error: 'Email and password are required', code: 'MISSING_CREDENTIALS' },
          { status: 400 }
        )
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        console.log(`[${requestId}] ⚠️ Invalid email format: ${email}`)
        return NextResponse.json(
          { error: 'Invalid email format', code: 'INVALID_EMAIL' },
          { status: 400 }
        )
      }

      // Check rate limiting
      if (!checkRateLimit(email)) {
        console.log(`[${requestId}] ⚠️ Rate limit exceeded for: ${email}`)
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again in a minute.', code: 'RATE_LIMIT' },
          { status: 429 }
        )
      }

      // Get user by email
      console.log(`[${requestId}] 🔍 Looking up user: ${email}`)
      const user = await getUserByEmail(email)
      if (!user) {
        console.log(`[${requestId}] ❌ User not found: ${email}`)
        return NextResponse.json(
          { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
          { status: 401 }
        )
      }

      // Verify password
      console.log(`[${requestId}] 🔑 Verifying password for: ${email}`)
      const isValid = await verifyPassword(password, user.password_hash)
      if (!isValid) {
        console.log(`[${requestId}] ❌ Invalid password for: ${email}`)
        return NextResponse.json(
          { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
          { status: 401 }
        )
      }

      // Create JWT token
      console.log(`[${requestId}] 🎫 Creating token for: ${email}`)
      const token = await createToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at
      })

      const duration = Date.now() - startTime
      console.log(`[${requestId}] ✅ User logged in successfully: ${email} (${duration}ms)`)

      // Create response with user data
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      })

      // Set the session cookie on the response
      return setSessionCookieOnResponse(response, token)
    }

    // Race between login and timeout
    return await Promise.race([loginPromise(), timeoutPromise])
    
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] ❌ Login error (${duration}ms):`, error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'REQUEST_TIMEOUT') {
        return NextResponse.json(
          { error: 'Login request timed out. Please try again.', code: 'TIMEOUT' },
          { status: 504 }
        )
      }
      
      if (error.message.includes('Database')) {
        return NextResponse.json(
          { error: 'Database error. Please try again.', code: 'DB_ERROR' },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
