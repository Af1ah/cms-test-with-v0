import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, createToken, setSessionCookieOnResponse, getUserCount } from '@/lib/auth'
import { initializeDatabase } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await initializeDatabase()

    const body = await request.json()
    const { email, password, name, accessKey } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if this is the first user (allow without access key)
    const userCount = await getUserCount()
    const isFirstUser = userCount === 0

    if (!isFirstUser) {
      // Require access key for additional admins
      const validAccessKey = process.env.ADMIN_ACCESS_KEY
      if (!validAccessKey) {
        return NextResponse.json(
          { error: 'Admin registration is disabled. Contact the administrator.' },
          { status: 403 }
        )
      }
      if (!accessKey || accessKey !== validAccessKey) {
        return NextResponse.json(
          { error: 'Valid access key is required to create additional admin accounts' },
          { status: 403 }
        )
      }
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create user
    const user = await createUser(email, password, name)
    console.log('✅ User created successfully:', email)

    // Create JWT token
    const token = await createToken(user)

    // Create response
    const response = NextResponse.json({
      success: true,
      message: isFirstUser 
        ? 'Admin account created successfully!' 
        : 'Additional admin account created successfully!',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 })

    // Set the session cookie on the response
    return setSessionCookieOnResponse(response, token)
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    )
  }
}
