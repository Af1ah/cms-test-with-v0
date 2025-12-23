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

  // Check if user is authenticated
  let isAuthenticated = false
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      isAuthenticated = true
    } catch {
      // Token is invalid or expired - don't log unless debugging
      // This is expected behavior for unauthenticated requests
    }
  }

  // Protect admin routes (except login, signup, and setup)
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")
  const isAuthPage = request.nextUrl.pathname.startsWith("/admin/login") || 
                     request.nextUrl.pathname.startsWith("/admin/signup") ||
                     request.nextUrl.pathname.startsWith("/admin/setup")

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

  // Redirect authenticated users away from login/signup pages
  if (isAuthPage && isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = "/admin/dashboard"
    return NextResponse.redirect(url)
  }

  return response
}
