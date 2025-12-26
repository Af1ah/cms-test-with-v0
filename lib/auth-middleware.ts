import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars-long'
)

const COOKIE_NAME = 'auth_token'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  // Get auth token from cookie
  const token = request.cookies.get(COOKIE_NAME)?.value

  // Check if user is authenticated and get their role
  let isAuthenticated = false
  let userRole = ''
  if (token) {
    try {
      // Add timeout for JWT verification (2 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('JWT verification timeout')), 2000)
      })
      
      const verifyPromise = jwtVerify(token, JWT_SECRET)
      
      const { payload } = await Promise.race([verifyPromise, timeoutPromise])
      isAuthenticated = true
      userRole = (payload.role as string) || ''
    } catch (error) {
      // Token is invalid, expired, or verification timed out
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn('⚠️ JWT verification timeout in middleware')
      }
    }
  }

  // Protect admin routes
  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith("/admin")
  const isAuthPage = pathname.startsWith("/admin/login") || 
                     pathname.startsWith("/admin/signup") ||
                     pathname.startsWith("/admin/setup")
  
  // Dashboard and User management are Admin-only
  const isAdminOnlyRoute = pathname.startsWith("/admin/dashboard") || 
                           pathname.startsWith("/admin/users")

  if (isAdminRoute && !isAuthPage && !isAuthenticated) {
    // Also check for access key fallback
    const accessKey = request.nextUrl.searchParams.get("key") || 
                      request.cookies.get("admin_access_key")?.value
    const validAccessKey = process.env.ADMIN_ACCESS_KEY

    if (validAccessKey && accessKey === validAccessKey) {
      // Valid access key, allow access and set cookie
      response.cookies.set("admin_access_key", accessKey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
      })
      return response
    }

    // Not authenticated, redirect to login
    const url = request.nextUrl.clone()
    url.pathname = "/admin/login"
    return NextResponse.redirect(url)
  }

  // Redirect teachers away from admin-only routes
  if (isAuthenticated && userRole === 'teacher' && isAdminOnlyRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin/papers"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/signup pages
  if (isAuthPage && isAuthenticated) {
    const url = request.nextUrl.clone()
    // Teachers go to papers, Admins go to dashboard
    url.pathname = userRole === 'admin' ? "/admin/dashboard" : "/admin/papers"
    return NextResponse.redirect(url)
  }

  return response
}
