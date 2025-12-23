import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { query } from '@/lib/db'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Calendar, BookOpen, GraduationCap, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
    created_at: string
}

import { cache } from 'react'

const getPaper = cache(async (id: string): Promise<QuestionPaper | null> => {
    const papers = await query<QuestionPaper>(
        `SELECT qp.*, 
            d.name as department_name, 
            st.name as subject_type_name
     FROM question_papers qp
     LEFT JOIN departments d ON qp.department_id = d.id
     LEFT JOIN subject_types st ON qp.subject_type_id = st.id
     WHERE qp.id = $1`,
        [id]
    )
    return papers[0] || null
})

export async function generateMetadata(
    { params }: { params: { id: string } },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const paper = await getPaper(params.id)

    if (!paper) {
        return {
            title: 'Paper Not Found',
        }
    }

    const title = `${paper.subject_name} (${paper.subject_code}) - ${paper.year_of_examination} Sem ${paper.semester} | GC Tanur`
    const description = `Download Calicut University (UoC) ${paper.year_of_examination} ${paper.semester}th Semester ${paper.subject_type_name} question paper for ${paper.subject_name} (${paper.subject_code}). Part of FYUGP curriculum at Government College Tanur.`

    return {
        title,
        description,
        keywords: [
            "Calicut University",
            "UoC",
            "FYUGP",
            paper.subject_name,
            paper.subject_code,
            `Semester ${paper.semester}`,
            String(paper.year_of_examination),
            paper.department_name || "",
            paper.subject_type_name || "",
            "Question Paper",
            "GC Tanur"
        ].filter(Boolean),
        openGraph: {
            title,
            description,
            type: 'website',
        }
    }
}

export default async function PaperPage({ params }: { params: { id: string } }) {
    const paper = await getPaper(params.id)

    if (!paper) {
        notFound()
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "DigitalDocument",
        "name": `${paper.subject_name} Question Paper (${paper.year_of_examination})`,
        "description": `Previous year question paper for ${paper.subject_name} (${paper.subject_code}), ${paper.semester}th Semester.`,
        "educationalLevel": `Semester ${paper.semester}`,
        "about": paper.subject_name,
        "identifier": paper.subject_code,
        "genre": "Question Paper",
        "publisher": {
            "@type": "EducationalOrganization",
            "name": "Government College Tanur"
        },
        "provider": {
            "@type": "EducationalOrganization",
            "name": "Calicut University"
        }
    }

    return (
        <div className="min-h-screen bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />
            <main className="container mx-auto px-4 py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Search
                </Link>

                <div className="max-w-4xl mx-auto">
                    <Card className="overflow-hidden border-slate-200 shadow-lg">
                        <div className="bg-primary/5 border-b p-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                            {paper.subject_type_name || 'Question Paper'}
                                        </Badge>
                                        <Badge variant="outline" className="font-mono">
                                            {paper.subject_code}
                                        </Badge>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                                        {paper.subject_name}
                                    </h1>
                                    <p className="text-lg text-muted-foreground">
                                        Calicut University • {paper.department_name} • FYUGP
                                    </p>
                                </div>
                                <Button asChild size="lg" className="h-14 px-8 shadow-md">
                                    <a href={`/api/download/${paper.id}`}>
                                        <Download className="h-5 w-5 mr-3" />
                                        Download PDF
                                    </a>
                                </Button>
                            </div>
                        </div>

                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border shadow-sm text-primary">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Year</p>
                                        <p className="font-bold text-slate-900">{paper.year_of_examination}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border shadow-sm text-primary">
                                        <GraduationCap className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Semester</p>
                                        <p className="font-bold text-slate-900">Semester {paper.semester}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border shadow-sm text-primary">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-0.5">File Format</p>
                                        <p className="font-bold text-slate-900 uppercase">{paper.file_type}</p>
                                    </div>
                                </div>
                            </div>

                            {paper.description && (
                                <div className="prose prose-slate max-w-none">
                                    <h3 className="text-xl font-bold mb-4">Description</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {paper.description}
                                    </p>
                                </div>
                            )}

                            <div className="mt-12 p-6 rounded-2xl bg-slate-900 text-slate-300">
                                <h4 className="font-bold text-white mb-2">About this Repository</h4>
                                <p className="text-sm leading-relaxed">
                                    This question paper is part of the Government College Tanur (GC Tanur) digital repository. We provide free access to previous year question papers to help students of Calicut University in their academic preparation.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
