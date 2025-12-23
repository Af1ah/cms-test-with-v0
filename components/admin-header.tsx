"use client"

import { Button } from "@/components/ui/button"
import { ButtonLoader } from "@/components/loading/loading-states"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { useState } from "react"

interface AdminHeaderProps {
  title?: string
}

export function AdminHeader({ title = "Admin Dashboard" }: AdminHeaderProps) {
  const { user, signOut, isSigningOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <nav className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo/Title - Always visible */}
          <Link 
            href="/admin/dashboard" 
            className="text-base sm:text-lg md:text-2xl font-bold text-primary truncate hover:text-primary/80 transition-colors flex-shrink-0"
          >
            <span className="hidden sm:inline">{title}</span>
            <span className="sm:hidden">Admin</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-2 md:gap-4">
            {user && (
              <>
                <span className="text-xs md:text-sm text-muted-foreground truncate max-w-[120px] md:max-w-[200px] lg:max-w-none">
                  Welcome, {user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={signOut} 
                  disabled={isSigningOut}
                  className="whitespace-nowrap text-xs sm:text-sm"
                >
                  {isSigningOut ? (
                    <ButtonLoader text="Signing out" />
                  ) : (
                    "Sign Out"
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            {user && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
                aria-label="Toggle menu"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && user && (
          <div className="sm:hidden border-t mt-3 pt-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-3">
              <span className="text-sm text-muted-foreground truncate">
                Welcome, {user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  signOut()
                  setIsMobileMenuOpen(false)
                }} 
                disabled={isSigningOut}
                className="justify-center"
              >
                {isSigningOut ? (
                  <ButtonLoader text="Signing out" />
                ) : (
                  "Sign Out"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
