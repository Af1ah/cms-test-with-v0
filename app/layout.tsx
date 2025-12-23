import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/hooks/use-auth"
import { GlobalLoadingProvider } from "@/hooks/use-global-loading"
import { NavigationLoader } from "@/components/page-transition"
import { ErrorBoundary } from "@/components/error-boundary"
import { PerformanceMonitor } from "@/components/performance-monitor"
import "./globals.css"

export const metadata: Metadata = {
  title: "PosterGallery - Admin CMS",
  description: "Content Management System for PosterGallery",
  generator: "v0.app",
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/fonts/geist-sans-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/geist-mono-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://vercel.live" />
        {/* Viewport optimization for better mobile performance */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ErrorBoundary>
          <GlobalLoadingProvider>
            <AuthProvider>
              <Suspense fallback={null}>
                <PerformanceMonitor />
              </Suspense>
              <Suspense fallback={null}>
                <NavigationLoader />
              </Suspense>
              <main id="main-content" className="relative">
                <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
              </main>
            </AuthProvider>
          </GlobalLoadingProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
