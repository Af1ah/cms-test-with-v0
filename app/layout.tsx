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
  title: "GC Tanur - Question Paper Repository",
  description: "Download previous year question papers from GC Tanur (Government College Tanur). Access question papers from all departments including Computer Science, Commerce, Electronics, Malayalam, and English.",
  keywords: [
    "GC Tanur",
    "Government College Tanur",
    "question papers",
    "previous year papers",
    "exam papers",
    "university question papers",
    "Computer Science papers",
    "Commerce papers",
    "semester exams",
    "Kerala University"
  ],
  authors: [{ name: "GC Tanur" }],
  creator: "GC Tanur",
  publisher: "Government College Tanur",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://gctanur.edu.in/papers",
    siteName: "GC Tanur Question Papers",
    title: "GC Tanur - Question Paper Repository",
    description: "Access and download previous year question papers from Government College Tanur. Free resource for students.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GC Tanur Question Papers",
    description: "Download previous year question papers from all departments at GC Tanur.",
  },
  alternates: {
    canonical: "https://gctanur.edu.in/papers",
  },
  category: "Education",
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
        {/* DNS prefetch */}
        <link rel="dns-prefetch" href="https://vercel.live" />
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* Theme color */}
        <meta name="theme-color" content="#4f46e5" />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              name: "Government College Tanur",
              alternateName: "GC Tanur",
              description: "Question Paper Repository - Download previous year exam papers",
              url: "https://gctanur.edu.in",
              sameAs: [],
              address: {
                "@type": "PostalAddress",
                addressLocality: "Tanur",
                addressRegion: "Kerala",
                addressCountry: "IN"
              },
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "general"
              }
            })
          }}
        />
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
