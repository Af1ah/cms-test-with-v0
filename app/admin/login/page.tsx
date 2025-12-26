"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLoader, ValidationLoader, ButtonLoader } from "@/components/loading/loading-states"
import { useGlobalLoading } from "@/hooks/use-global-loading"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useCallback, useMemo, useEffect } from "react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [loginAttemptInProgress, setLoginAttemptInProgress] = useState(false)
  const router = useRouter()
  const { setLoading } = useGlobalLoading()

  // Memoize validation state
  const isFormValid = useMemo(() => {
    return email.trim() !== "" && password.trim() !== "" && email.includes("@")
  }, [email, password])

  // Initialize component
  useEffect(() => {
    const timer = setTimeout(() => setIsInitializing(false), 100)
    return () => clearTimeout(timer)
  }, [])

  // Validate form in real-time with debounce
  useEffect(() => {
    if (email || password) {
      setIsValidating(true)
      const timer = setTimeout(() => setIsValidating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [email, password])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent multiple simultaneous login attempts
    if (loginAttemptInProgress) {
      console.log("[Auth] Login already in progress, ignoring duplicate request")
      return
    }

    setLoginAttemptInProgress(true)
    setIsLoading(true)
    setLoading('auth', true)
    setError(null)

    const requestTimeout = 15000 // 15 seconds client-side timeout
    const abortController = new AbortController()

    try {
      console.log("[Auth] Attempting login for:", email)

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          abortController.abort()
          reject(new Error('CLIENT_TIMEOUT'))
        }, requestTimeout)
      })

      // Create fetch promise
      const fetchPromise = fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: abortController.signal,
      })

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise])
      const data = await response.json()

      if (!response.ok) {
        // Handle specific error codes
        const errorCode = data.code || 'UNKNOWN'
        let errorMessage = data.error || 'Login failed'

        switch (errorCode) {
          case 'RATE_LIMIT':
            errorMessage = '⏱️ Too many attempts. Please wait a minute and try again.'
            break
          case 'DB_UNHEALTHY':
          case 'DB_ERROR':
            errorMessage = '🔌 Database connection issue. Please try again in a moment.'
            break
          case 'TIMEOUT':
            errorMessage = '⏰ Request timed out. Please check your connection and try again.'
            break
          case 'INVALID_CREDENTIALS':
            errorMessage = '❌ Invalid email or password. Please check your credentials.'
            break
          default:
            errorMessage = data.error || 'Login failed. Please try again.'
        }

        throw new Error(errorMessage)
      }

      console.log("[Auth] Login successful for:", data.user?.email)

      if (rememberMe) {
        localStorage.setItem("admin_remember", "true")
      } else {
        localStorage.removeItem("admin_remember")
      }

      // Add a small delay to show success state
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push("/admin/dashboard")
      router.refresh()
    } catch (error: unknown) {
      console.log("[Auth] Login failed:", error)

      let errorMessage = "An error occurred"

      if (error instanceof Error) {
        if (error.message === 'CLIENT_TIMEOUT') {
          errorMessage = '⏰ Login is taking too long. Please check your connection and try again.'
        } else if (error.name === 'AbortError') {
          errorMessage = '⏰ Request timed out. Please try again.'
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
      setLoading('auth', false)
      setLoginAttemptInProgress(false)
    }
  }, [email, password, rememberMe, router, setLoading, loginAttemptInProgress])

  // Show loading state on initial load
  if (isInitializing) {
    return <AuthLoader text="Loading login form..." />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
            PosterGallery
          </Link>
          <p className="text-muted-foreground mt-2">Admin Portal</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="transition-all duration-200 focus:ring-2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="transition-all duration-200 focus:ring-2"
                  />
                </div>

                {/* Real-time validation feedback */}
                {isValidating && !isFormValid && (email || password) && (
                  <div className="flex items-center gap-2">
                    <ValidationLoader text="Validating..." />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Keep me signed in
                  </Label>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm animate-in slide-in-from-top-2 duration-300">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full transition-all duration-200"
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <ButtonLoader text="Signing in" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm space-y-2">
                <div>
                  <Link href="/" className="text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors">
                    ← Back to Gallery
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
