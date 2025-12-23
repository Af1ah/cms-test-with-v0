"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useCallback, useState } from "react"

interface AdminHeaderProps {
  title?: string
}

export function AdminHeader({ title = "Admin Dashboard" }: AdminHeaderProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }, [signOut, router])

  const isAdmin = user?.role === "admin"

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-xl md:text-2xl font-bold text-primary">
              <GraduationCap className="h-7 w-7" />
              <span className="hidden sm:inline">GC Tanur</span>
            </Link>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium text-sm sm:text-base">{title}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/papers">Papers</Link>
            </Button>
            {isAdmin && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/users">Users</Link>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? "..." : "Logout"}
            </Button>
          </div>
        </nav>
      </div>
    </header>
  )
}
