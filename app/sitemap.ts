import { MetadataRoute } from 'next'
import { query } from '@/lib/db'

interface QuestionPaper {
  id: number
  updated_at: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gctanur.edu.in'

  // Fetch all papers to create dynamic routes
  const papers = await query<QuestionPaper>(
    'SELECT id, updated_at FROM question_papers'
  )

  const paperUrls = papers.map((paper) => ({
    url: `${baseUrl}/papers/${paper.id}`,
    lastModified: new Date(paper.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...paperUrls,
  ]
}
