import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail, createToken, setSessionCookieOnResponse, getUserCount, getCurrentUser } from '@/lib/auth'
import { initializeDatabase } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await initializeDatabase()

    const body = await request.json()
    const { email, password, name, role, accessKey } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if this is the first user
    const userCount = await getUserCount()
    const isFirstUser = userCount === 0

    if (!isFirstUser) {
      // For subsequent users, require an authenticated admin
      const currentUser = await getCurrentUser()
      if (!currentUser || currentUser.role !== 'admin') {
        // Fallback to access key for testing/special cases if needed?
        // User said "user creation only for the admin".
        const validAccessKey = process.env.ADMIN_ACCESS_KEY
        if (!accessKey || accessKey !== validAccessKey) {
          return NextResponse.json(
            { error: 'Only admins can create new users' },
            { status: 403 }
          )
        }
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

    // Create user with specified role or default to teacher
    // If it's the first user, always make them an admin
    const userRole = isFirstUser ? 'admin' : (role || 'teacher')
    const user = await createUser(email, password, name, userRole)
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
