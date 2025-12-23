"use client"

import React from "react"

import { StorageService } from "@/lib/storage-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ButtonLoader, ValidationLoader } from "@/components/loading/loading-states"
import { useGlobalLoading } from "@/hooks/use-global-loading"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useCallback, useMemo, useRef } from "react"

export default function NewPosterPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [category, setCategory] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { setLoading } = useGlobalLoading()

  // Memoize form validation
  const isFormValid = useMemo(() => {
    return title.trim() !== "" && selectedFile !== null
  }, [title, selectedFile])

  // Handle file selection with validation
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoading('crud', true)
    setError(null)

    console.log("🚀 Form submission started")
    console.log("📝 Form data:", { title, description, category, hasFile: !!selectedFile })

    try {
      // Upload file first if selected
      let finalImageUrl = imageUrl
      if (selectedFile) {
        setIsUploading(true)
        console.log("📤 Uploading file:", selectedFile.name)
        finalImageUrl = await uploadFile(selectedFile)
        console.log("✅ File uploaded:", finalImageUrl)
        setIsUploading(false)
      }

      // Create poster via API
      const response = await fetch('/api/posters', {
        method: 'POST',
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
        console.log("💥 API error:", data)
        throw new Error(data.error || 'Failed to create poster')
      }

      const poster = await response.json()
      console.log("✅ Poster created successfully:", poster)

      // Add delay to show success feedback
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push("/admin/posters")
      router.refresh()
    } catch (error: unknown) {
      console.log("💥 Catch block error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
      setLoading('crud', false)
      setIsUploading(false)
    }
  }, [title, description, category, router, selectedFile, uploadFile, imageUrl, setLoading])

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
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Add New Poster</h1>
            <p className="text-muted-foreground">Create a new poster entry for your gallery</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Poster Details</CardTitle>
              <CardDescription>Fill in the information for your new poster</CardDescription>
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
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload an image file (JPEG, PNG, WebP, or GIF, max 10MB)
                      </p>
                    </div>

                    {/* Image Preview */}
                    {selectedFile && previewUrl && (
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-muted-foreground">Image Preview:</p>
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/50 rounded animate-fade-in">
                        <ValidationLoader text="Uploading image..." />
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
                      <ButtonLoader text={isUploading ? "Uploading & Adding" : "Adding Poster"} />
                    ) : (
                      "Add Poster"
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
