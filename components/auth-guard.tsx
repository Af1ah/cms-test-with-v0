"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { AuthLoader } from "@/components/loading/loading-states"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({ children, redirectTo = "/admin/login", fallback }: AuthGuardProps) {
  const { user, loading, isValidating } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isValidating && !user) {
      console.log("[v0] User not authenticated, redirecting to:", redirectTo)
      router.push(redirectTo)
    }
  }, [user, loading, isValidating, router, redirectTo])

  if (loading || isValidating) {
    return fallback || <AuthLoader text="Checking authentication..." />
  }

  if (!user) {
    return fallback || <AuthLoader text="Redirecting to login..." />
  }

  return <>{children}</>
}
