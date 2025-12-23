import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, FileText, Users, Download } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <GraduationCap className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">About GC Tanur Question Papers</h1>
            <p className="text-muted-foreground text-lg text-pretty">
              A digital repository for examination resources at Government College Tanur
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                  <h2 className="text-2xl font-semibold">Our Purpose</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  This platform serves as a centralized repository for previous year question papers
                  from all departments at Government College Tanur. Our goal is to help students
                  prepare better for their examinations by providing easy access to past papers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-8 w-8 text-primary" />
                  <h2 className="text-2xl font-semibold">For Students</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Students can browse and download question papers without any registration or login.
                  Search by subject name, code, year, semester, or department to quickly find
                  the papers you need for your exam preparation.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-12">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <Download className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-semibold">Departments Covered</h2>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                {[
                  "Computer Science",
                  "Commerce",
                  "Electronics",
                  "Malayalam",
                  "English"
                ].map((dept) => (
                  <div key={dept} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="font-medium">{dept}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4 text-primary">For Teachers</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Faculty members can log in to upload new question papers, helping to build
                a comprehensive collection of examination resources. Each upload includes
                subject details, year, semester, and department information for easy searchability.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
