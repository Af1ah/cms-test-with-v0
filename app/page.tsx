import { Header } from "@/components/header"
import SearchClient from "./search-client"
import { query, initializeDatabase } from "@/lib/db"

export const dynamic = 'force-dynamic'

interface QuestionPaper {
  id: number
  subject_name: string
  subject_code: string
  paper_code: string | null
  year_of_examination: number
  semester: number
  description: string | null
  file_url: string
  file_type: string
  department_name: string | null
  subject_type_name: string | null
}

interface Department {
  id: number
  name: string
}

interface SubjectType {
  id: number
  name: string
}

export default async function HomePage() {
  await initializeDatabase()

  // Fetch recent papers
  const recentPapers = await query<QuestionPaper>(
    `SELECT qp.*, 
            d.name as department_name, 
            st.name as subject_type_name
     FROM question_papers qp
     LEFT JOIN departments d ON qp.department_id = d.id
     LEFT JOIN subject_types st ON qp.subject_type_id = st.id
     ORDER BY qp.created_at DESC
     LIMIT 10`
  )

  // Fetch departments and subject types for filters
  const departments = await query<Department>("SELECT * FROM departments ORDER BY name")
  const subjectTypes = await query<SubjectType>("SELECT * FROM subject_types ORDER BY name")

  // Get unique years from existing papers
  const yearsResult = await query<{ year_of_examination: number }>(
    "SELECT DISTINCT year_of_examination FROM question_papers ORDER BY year_of_examination DESC"
  )
  const years = yearsResult.map(r => r.year_of_examination)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SearchClient
        initialPapers={recentPapers}
        departments={departments}
        subjectTypes={subjectTypes}
        years={years}
      />
    </div>
  )
}
