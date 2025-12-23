"use client"

import { useEffect, useState, useCallback } from "react"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Users, UserPlus, Mail, Shield, AlertCircle } from "lucide-react"
import { ButtonLoader } from "@/components/loading/loading-states"

interface User {
    id: number
    email: string
    name: string | null
    role: string
    created_at: string
}

export default function UserManagementPage() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // New user form state
    const [newEmail, setNewEmail] = useState("")
    const [newName, setNewName] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [newRole, setNewRole] = useState("teacher")

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch("/api/users")
            if (response.ok) {
                const data = await response.json()
                setUsers(data)
            } else {
                setError("Failed to load users")
            }
        } catch (err) {
            setError("An error occurred while fetching users")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!authLoading) {
            if (!currentUser || currentUser.role !== "admin") {
                router.push("/admin/papers")
                return
            }
            fetchUsers()
        }
    }, [currentUser, authLoading, router, fetchUsers])

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newEmail,
                    name: newName,
                    password: newPassword,
                    role: newRole,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setNewEmail("")
                setNewName("")
                setNewPassword("")
                setNewRole("teacher")
                fetchUsers()
            } else {
                setError(data.error || "Failed to create user")
            }
        } catch (err) {
            setError("An error occurred during user creation")
        } finally {
            setIsCreating(false)
        }
    }

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <AdminHeader title="User Management" />

            <main className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Create User Form */}
                    <div className="w-full md:w-1/3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                    <UserPlus className="h-5 w-5" />
                                    Add New User
                                </CardTitle>
                                <CardDescription>Create a new teacher or admin account</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="teacher@example.com"
                                            required
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Min 8 characters"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select value={newRole} onValueChange={setNewRole}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="teacher">Teacher</SelectItem>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 mt-0.5" />
                                            {error}
                                        </div>
                                    )}

                                    <Button type="submit" className="w-full" disabled={isCreating}>
                                        {isCreating ? <ButtonLoader text="Creating..." /> : "Create User"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* User List */}
                    <div className="w-full md:w-2/3">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            System Users
                                        </CardTitle>
                                        <CardDescription>Manage existing users and permissions</CardDescription>
                                    </div>
                                    <Badge variant="outline">{users.length} Total</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {users.map((u) => (
                                        <div
                                            key={u.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${u.role === 'admin' ? 'bg-primary/10' : 'bg-muted'}`}>
                                                    {u.role === 'admin' ? (
                                                        <Shield className="h-5 w-5 text-primary" />
                                                    ) : (
                                                        <Users className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{u.name || "Unnamed User"}</div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {u.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                                    {u.role}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    Joined {new Date(u.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {users.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No users found.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
