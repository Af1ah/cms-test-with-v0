import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary">
            PosterGallery
          </Link>
          <p className="text-muted-foreground mt-2">Admin Portal</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Account Created!</CardTitle>
            <CardDescription>Check your email to confirm your account</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You&apos;ve successfully created your admin account. Please check your email to confirm your account
              before signing in.
            </p>
            <div className="mt-6 text-center">
              <Link href="/admin/login" className="text-primary underline underline-offset-4">
                Return to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
