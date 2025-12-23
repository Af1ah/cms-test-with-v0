import { clearSessionCookie } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST() {
  await clearSessionCookie()
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"))
}
