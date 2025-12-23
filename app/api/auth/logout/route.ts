import { NextResponse } from 'next/server'
import { clearSessionCookieOnResponse } from '@/lib/auth'

export async function POST() {
  try {
    // Create a response that redirects to home
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    })
    
    // Clear the session cookie
    return clearSessionCookieOnResponse(response)
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
