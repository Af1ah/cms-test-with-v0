"use client"

import React from "react"

import { StorageService } from "@/lib/storage-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner, LoadingDots } from "@/components/ui/spinner"
import { FormSkeleton } from "@/components/loading/form-skeletons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"

interface EditPosterPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPosterPage({ params }: EditPosterPageProps) {
  const { id } = await params
  return <EditPosterClient id={id} />
}

function EditPosterClient({ id }: { id: string }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [category, setCategory] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [imagePreviewLoading, setImagePreviewLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Memoize form validation
  const isFormValid = useMemo(() => {
    return title.trim() !== "" && (imageUrl.trim() !== "" || selectedFile !== null)
  }, [title, imageUrl, selectedFile])

  // Simple URL validation
  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch {
      return false
    }
  }

  const loadPoster = useCallback(async () => {
    setIsLoadingData(true)
    setError(null)

    try {
      const response = await fetch(`/api/posters/${id}`)
      if (!response.ok) {
        throw new Error('Failed to load poster')
      }
      const poster = await response.json()

      setTitle(poster.title)
      setDescription(poster.description || "")
      setImageUrl(poster.image_url)
      setCategory(poster.category || "")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to load poster")
    } finally {
      setIsLoadingData(false)
    }
  }, [id])

  useEffect(() => {
    loadPoster()
  }, [loadPoster])

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      setError(null)
      return
    }

    // Validate file
    const validation = StorageService.validateFile(file)
    if (!validation.isValid) {
      setError(validation.error || "Invalid file")
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Cleanup previous object URL
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Handle file upload
  const uploadFile = useCallback(async (file: File): Promise<string> => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      return data.publicUrl
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let finalImageUrl = imageUrl

      // If a new file is selected, upload it first
      if (selectedFile) {
        finalImageUrl = await uploadFile(selectedFile)
      }

      const response = await fetch(`/api/posters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          image_url: finalImageUrl,
          category: category || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update poster')
      }

      router.push("/admin/posters")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [title, description, imageUrl, category, id, router, selectedFile, uploadFile])

  // Handle image URL change with preview loading (keeping for backward compatibility)
  const handleImageUrlChange = useCallback((url: string) => {
    setImageUrl(url)
    if (url && isValidUrl(url)) {
      setImagePreviewLoading(true)
      // Preload image to check if it's valid
      const img = new Image()
      img.onload = () => setImagePreviewLoading(false)
      img.onerror = () => setImagePreviewLoading(false)
      img.src = url
    }
  }, [])

  // Reset file input
  const resetFileInput = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [previewUrl])

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link href="/admin/dashboard" className="text-2xl font-bold text-primary">
                Admin Dashboard
              </Link>
              <Button asChild variant="outline" size="sm" disabled>
                <span>← Back to Posters</span>
              </Button>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <FormSkeleton />
        </main>
      </div>
    )
  }

  if (error && !title) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <Link href="/admin/dashboard" className="text-2xl font-bold text-primary">
                Admin Dashboard
              </Link>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/posters">← Back to Posters</Link>
              </Button>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4 text-destructive">Error Loading Poster</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={loadPoster}>Try Again</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="text-2xl font-bold text-primary">
              Admin Dashboard
            </Link>
            <Button asChild variant="outline" size="sm" disabled={isLoading}>
              <Link href="/admin/posters">← Back to Posters</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Edit Poster</h1>
            <p className="text-muted-foreground">Update the poster information</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Poster Details</CardTitle>
              <CardDescription>Update the information for your poster</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="Enter poster title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isLoading}
                    className="transition-all duration-200"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter poster description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={isLoading}
                    className="transition-all duration-200"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="image">Poster Image *</Label>
                  <div className="space-y-4">
                    {/* Current Image Display */}
                    {imageUrl && !selectedFile && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Current Image:</p>
                        <div className="relative aspect-[3/4] w-48 bg-background rounded overflow-hidden">
                          <img
                            src={imageUrl}
                            alt="Current poster"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const errorDiv = e.currentTarget.nextElementSibling as HTMLElement
                              if (errorDiv) {
                                errorDiv.style.display = 'flex'
                                errorDiv.textContent = 'Failed to load current image'
                              }
                            }}
                          />
                          <div className="absolute inset-0 items-center justify-center text-sm text-muted-foreground bg-muted hidden">
                            Failed to load current image
                          </div>
                        </div>
                      </div>
                    )}

                    {/* File Input */}
                    <div className="space-y-2">
                      <Input
                        ref={fileInputRef}
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isLoading || isUploading}
                        className="transition-all duration-200"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload a new image file (JPEG, PNG, WebP, or GIF, max 10MB). Leave empty to keep current image.
                      </p>
                    </div>

                    {/* New Image Preview */}
                    {selectedFile && previewUrl && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-muted-foreground">New Image Preview:</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={resetFileInput}
                            disabled={isLoading || isUploading}
                            className="text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="relative aspect-[3/4] w-48 bg-background rounded overflow-hidden">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <p>File: {selectedFile.name}</p>
                          <p>Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                    )}

                    {/* Upload Status */}
                    {isUploading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                        <Spinner size="sm" />
                        <span>Uploading image...</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                    <SelectTrigger className="transition-all duration-200">
                      <SelectValue placeholder="Select a category (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vintage">Vintage</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="abstract">Abstract</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                      <SelectItem value="typography">Typography</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="illustration">Illustration</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isLoading || !isFormValid || isUploading}
                    className="flex-1 transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" variant="white" />
                        <span>{isUploading ? "Uploading & Updating" : "Updating Poster"}</span>
                        <LoadingDots />
                      </div>
                    ) : (
                      "Update Poster"
                    )}
                  </Button>
                  <Button asChild variant="outline" type="button" disabled={isLoading || isUploading}>
                    <Link href="/admin/posters">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
