import { updateSession } from "@/lib/auth-middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Only run middleware on routes that need authentication
  matcher: [
    "/admin/:path*",
    "/api/auth/:path*",
    "/api/papers/:path*",
    "/api/upload/:path*",
    "/api/users/:path*",
  ],
}
