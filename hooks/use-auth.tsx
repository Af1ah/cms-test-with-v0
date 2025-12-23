"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"

interface User {
    id: number
    email: string
    name?: string
    role: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    isSigningOut: boolean
    signOut: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isSigningOut, setIsSigningOut] = useState(false)
    const router = useRouter()

    const fetchUser = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/me')
            if (response.ok) {
                const data = await response.json()
                setUser(data.user)
            } else {
                setUser(null)
            }
        } catch (error) {
            console.error("[Auth] Failed to fetch user:", error)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUser()
    }, [fetchUser])

    const signOut = useCallback(async () => {
        try {
            setIsSigningOut(true)
            const response = await fetch('/api/auth/logout', { method: 'POST' })
            if (response.ok) {
                setUser(null)
                localStorage.removeItem("admin_remember")
                router.push("/")
                router.refresh()
            }
        } catch (error) {
            console.error("[Auth] Sign out error:", error)
        } finally {
            setIsSigningOut(false)
        }
    }, [router])

    const refreshUser = useCallback(async () => {
        setLoading(true)
        await fetchUser()
    }, [fetchUser])

    const value = useMemo(() => ({
        user,
        loading,
        isSigningOut,
        signOut,
        refreshUser,
    }), [user, loading, isSigningOut, signOut, refreshUser])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
