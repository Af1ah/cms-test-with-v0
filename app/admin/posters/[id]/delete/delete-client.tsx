"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ButtonLoader } from "@/components/loading/loading-states"
import { useGlobalLoading } from "@/hooks/use-global-loading"
import { AdminHeader } from "@/components/admin-header"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import Image from "next/image"
import { deletePoster } from "@/lib/actions/poster-actions"

interface DeletePosterClientProps {
  poster: any
  posterId: string
}

export default function DeletePosterClient({ poster, posterId }: DeletePosterClientProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { setLoading } = useGlobalLoading()

  const handleDelete = () => {
    startTransition(async () => {
      setLoading('crud', true)
      setError(null)

      try {
        console.log('Client: Attempting to delete poster with ID:', posterId)
        
        // Use Server Action for deletion
        await deletePoster(posterId)
        
        console.log('Client: Delete successful, redirecting...')
        
        // Add a small delay to show success feedback
        await new Promise(resolve => setTimeout(resolve, 1000))
        router.push("/admin/posters")
      } catch (error: unknown) {
        console.error('Client: Handle delete error:', error)
        setError(error instanceof Error ? error.message : "An error occurred")
      } finally {
        setLoading('crud', false)
      }
    })
  }

  if (!poster) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-muted-foreground">Poster not found</h2>
          <Button asChild>
            <Link href="/admin/posters">← Back to Posters</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader title="Admin Dashboard" />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/posters">← Back to Posters</Link>
              </Button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Delete Poster</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Are you sure you want to delete this poster?</p>
          </div>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive text-lg sm:text-xl">Confirm Deletion</CardTitle>
              <CardDescription className="text-sm">This action cannot be undone. The poster will be permanently removed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 bg-muted rounded-lg">
                <div className="relative w-24 h-32 flex-shrink-0 mx-auto sm:mx-0">
                  <Image
                    src={poster.image_url || "/placeholder.svg"}
                    alt={poster.title}
                    fill
                    className="object-cover rounded-md"
                    sizes="96px"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{poster.title}</h3>
                  {poster.description && <p className="text-muted-foreground mb-2 text-sm sm:text-base">{poster.description}</p>}
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Added {new Date(poster.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm animate-in slide-in-from-top-2 duration-300">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button 
                  onClick={handleDelete} 
                  variant="destructive" 
                  disabled={isPending} 
                  className="flex-1 order-2 sm:order-1"
                >
                  {isPending ? (
                    <ButtonLoader text="Deleting" />
                  ) : (
                    "Delete Poster"
                  )}
                </Button>
                <Button asChild variant="outline" className="flex-1 bg-transparent order-1 sm:order-2" disabled={isPending}>
                  <Link href="/admin/posters">Cancel</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
