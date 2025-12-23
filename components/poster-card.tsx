"use client"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface Poster {
  id: string
  title: string
  description?: string
  image_url: string
  category?: string
  created_at: string
}

interface PosterCardProps {
  poster: Poster
  priority?: boolean
  preloadOnHover?: boolean
}

export function PosterCard({ poster, priority = false, preloadOnHover = false }: PosterCardProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  const handleImageClick = () => {
    setIsPopupOpen(true)
  }

  const handleClosePopup = () => {
    setIsPopupOpen(false)
  }

  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPopupOpen && e.key === 'Escape') {
        handleClosePopup()
      }
    }

    if (isPopupOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isPopupOpen])

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardContent className="p-0" >
          <div className="relative aspect-[3/4] overflow-hidden">
            <Image
              src={poster.image_url || "/placeholder.svg"}
              alt={poster.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              quality={85}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              loading={priority ? "eager" : "lazy"}
            />

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

            {/* Overlay content - Better mobile touch targets */}
            <div className="absolute inset-0 p-3 md:p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={handleImageClick}>
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 md:p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="font-semibold text-foreground text-balance text-sm md:text-base">{poster.title}</h3>
                {poster.description && (
                  <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">{poster.description}</p>
                )}
                {poster.category && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {poster.category}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Popup Modal - Enhanced mobile responsiveness with proper container */}
      {isPopupOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          style={{ zIndex: 9999 }}
          onClick={handleClosePopup}
        >
          {/* Main modal container with safe padding */}
          <div className="relative w-full h-full max-w-7xl max-h-screen mx-auto p-4 sm:p-6 lg:p-8">
            
            {/* Close button - Properly contained with transparent background */}
            <button
              onClick={handleClosePopup}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 hover:bg-white/20 text-white rounded-full p-2.5 sm:p-3 transition-colors backdrop-blur-sm z-50 touch-manipulation shadow-lg bg-transparent border border-white/30 hover:border-white/50"
              aria-label="Close popup"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
            
            {/* Image container - Better mobile sizing and centering */}
            <div className="flex items-center justify-center h-full">
              <div 
                className="relative w-full h-full max-w-4xl max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-10rem)] bg-black/30 rounded-lg overflow-hidden shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={poster.image_url || "/placeholder.svg"}
                  alt={poster.title}
                  fill
                  className="object-contain"
                  quality={95}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 80vw"
                  priority
                />
              </div>
            </div>

            {/* Image info - Enhanced mobile layout with proper containment */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 lg:bottom-8 lg:left-8 lg:right-8">
              <div className="bg-black/85 text-white rounded-lg p-4 sm:p-5 max-w-2xl mx-auto backdrop-blur-md shadow-xl border border-white/10">
                <h3 className="font-semibold text-base sm:text-lg lg:text-xl mb-2 line-clamp-2">
                  {poster.title}
                </h3>
                {poster.description && (
                  <p className="text-sm sm:text-base text-gray-200 mb-3 line-clamp-3 sm:line-clamp-4">
                    {poster.description}
                  </p>
                )}
                {poster.category && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-white border-white/50 hover:bg-white/10 text-xs sm:text-sm">
                      {poster.category}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
