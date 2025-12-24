"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, BookOpen } from "lucide-react"

interface QuestionPaper {
    id: number
    subject_name: string
    subject_code: string
    paper_code: string | null
    year_of_examination: number
    semester: number
    description: string | null
    file_type: string
    department_name?: string | null
    subject_type_name?: string | null
    program_type_name?: string | null
    created_at?: string
}

interface PaperCardProps {
    paper: QuestionPaper
}

export function PaperCard({ paper }: PaperCardProps) {
    const isNew = paper.created_at ? (new Date().getTime() - new Date(paper.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000 : false

    return (
        <Card className="group relative overflow-hidden bg-slate-50/50 border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
            {isNew && (
                <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-primary text-[10px] px-2 py-0 h-5 border-none shadow-sm rounded-full">
                        NEW
                    </Badge>
                </div>
            )}

            <CardContent className="p-4 flex items-center gap-4">
                {/* Left: File Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg border border-slate-100 flex-shrink-0 shadow-sm">
                    <FileText className="h-6 w-6 text-primary/70" />
                </div>

                {/* Center & Right Wrapper */}
                <div className="flex flex-1 min-w-0 justify-between items-center">
                    {/* Center: Typography & Hierarchy */}
                    <div className="flex-1 min-w-0 pr-4">
                        <Link href={`/papers/${paper.id}`}>
                            <h3 className="font-bold text-base sm:text-lg text-slate-900 truncate group-hover:text-primary transition-colors cursor-pointer">
                                {paper.subject_name}
                            </h3>
                        </Link>
                        <p className="text-xs sm:text-sm text-slate-500 line-clamp-1 mb-0.5">
                            <span className="font-semibold text-slate-700">{paper.subject_code}</span>
                            {paper.paper_code && ` • ${paper.paper_code}`}
                            {paper.department_name && ` • ${paper.department_name}`}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-slate-400">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded italic">
                                {paper.year_of_examination} • Sem {paper.semester}
                            </span>
                            {paper.subject_type_name && (
                                <span className="text-primary/60 font-bold uppercase tracking-tighter">
                                    {paper.subject_type_name}
                                </span>
                            )}
                            {paper.program_type_name && (
                                <span className="text-emerald-600/70 font-bold uppercase tracking-tighter">
                                    {paper.program_type_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                            title="View Details"
                        >
                            <Link href={`/papers/${paper.id}`}>
                                <BookOpen className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all border border-transparent hover:border-primary/20"
                            title={`Download ${paper.file_type.toUpperCase()}`}
                        >
                            <a href={`/api/download/${paper.id}`}>
                                <Download className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

