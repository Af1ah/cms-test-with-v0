import AdmZip from 'adm-zip'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'
import { query } from './db'

export interface CSVRow {
  dateOfExam: string
  qpCode: string
  paperName: string
  totalScript: string
}

export interface ParsedPaper {
  qpCode: string
  subjectCode: string
  subjectName: string
  semester: number
  year: number
  subjectType: string
  departmentPrefix: string
  pdfPath?: string
}

export interface BulkUploadResult {
  success: number
  failed: number
  skipped: number
  errors: Array<{
    file: string
    error: string
  }>
  successfulPapers: Array<{
    qpCode: string
    subjectName: string
  }>
}

/**
 * Extract ZIP file to a temporary directory
 */
export async function extractZipFile(zipBuffer: Buffer, extractPath: string): Promise<void> {
  const zip = new AdmZip(zipBuffer)
  zip.extractAllTo(extractPath, true)
}

/**
 * Parse CSV file and return structured data
 */
export function parseCSV(csvContent: string): CSVRow[] {
  const records = parse(csvContent, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
    from_line: 4, // Skip header rows
  })

  const rows: CSVRow[] = []
  let currentDate = ''

  for (const record of records) {
    // Check if this is a date row
    if (record[0] && record[0].includes('-') && !record[1]) {
      currentDate = record[0]
      continue
    }

    // Skip empty rows
    if (!record[1] || !record[2]) {
      continue
    }

    rows.push({
      dateOfExam: currentDate || record[0] || '',
      qpCode: record[1]?.toString().trim() || '',
      paperName: record[2]?.toString().trim() || '',
      totalScript: record[3]?.toString().trim() || '',
    })
  }

  return rows
}

/**
 * Extract year from date string (e.g., "03-11-2025:\n2.00 PM" -> 2025)
 */
export function extractYear(dateString: string): number {
  const yearMatch = dateString.match(/\d{4}/)
  if (yearMatch) {
    return parseInt(yearMatch[0])
  }
  return new Date().getFullYear()
}

/**
 * Parse subject code and name from paper name
 * Format: "BBA3CJ201 - Domestic Logistic Management"
 */
export function extractSubjectInfo(paperName: string): {
  subjectCode: string
  subjectName: string
} {
  const parts = paperName.split(' - ')
  if (parts.length >= 2) {
    return {
      subjectCode: parts[0].trim(),
      subjectName: parts.slice(1).join(' - ').trim(),
    }
  }
  return {
    subjectCode: paperName.trim(),
    subjectName: paperName.trim(),
  }
}

/**
 * Extract semester from subject code (e.g., "BBA3CJ201" -> 3)
 */
export function extractSemester(subjectCode: string): number {
  const semesterMatch = subjectCode.match(/\d/)
  if (semesterMatch) {
    return parseInt(semesterMatch[0])
  }
  return 1
}

/**
 * Detect department from subject code prefix
 */
export function detectDepartmentPrefix(subjectCode: string): string {
  const prefix = subjectCode.match(/^[A-Z]+/)?.[0] || ''
  return prefix
}

/**
 * Map department prefix to department name
 */
const DEPARTMENT_MAP: Record<string, string> = {
  BBA: 'Business Administration',
  BCA: 'Computer Science',
  COM: 'Commerce',
  ELE: 'Electronics',
  ENG: 'English',
  MAL: 'Malayalam',
  ARA: 'Arabic',
  HIN: 'Hindi',
  JOU: 'Journalism',
  MAT: 'Mathematics',
  CSC: 'Computer Science',
}

/**
 * Get or create department by prefix
 */
export async function getOrCreateDepartment(prefix: string): Promise<number | null> {
  const departmentName = DEPARTMENT_MAP[prefix]
  
  if (!departmentName) {
    // Try to find by prefix if not in map
    const existing = await query<{ id: number }>(
      'SELECT id FROM departments WHERE name ILIKE $1',
      [`%${prefix}%`]
    )
    if (existing.length > 0) {
      return existing[0].id
    }
    return null
  }

  // Check if department exists
  let dept = await query<{ id: number }>('SELECT id FROM departments WHERE name = $1', [departmentName])
  
  if (dept.length === 0) {
    // Create new department
    dept = await query<{ id: number }>(
      'INSERT INTO departments (name) VALUES ($1) RETURNING id',
      [departmentName]
    )
  }

  return dept[0]?.id || null
}

/**
 * Extract subject type from subject code
 * CJ = Core/Major, MN = Minor, FM/FV/FS = Foundation courses
 */
export function extractSubjectTypeCode(subjectCode: string): string {
  const typeMatch = subjectCode.match(/[A-Z]{2}(?=\d{3})/)
  if (typeMatch) {
    return typeMatch[0]
  }
  return 'CJ' // Default to Core/Major
}

/**
 * Map subject type code to database subject type
 */
const SUBJECT_TYPE_MAP: Record<string, string> = {
  CJ: 'Major',
  MN: 'Minor',
  FM: 'Common Course',
  FV: 'Common Course',
  FS: 'Common Course',
}

/**
 * Get or create subject type
 */
export async function getOrCreateSubjectType(typeCode: string): Promise<number | null> {
  const typeName = SUBJECT_TYPE_MAP[typeCode] || 'Major'

  // Check if subject type exists
  let subjectType = await query<{ id: number }>('SELECT id FROM subject_types WHERE name = $1', [typeName])
  
  if (subjectType.length === 0) {
    // Create new subject type
    subjectType = await query<{ id: number }>(
      'INSERT INTO subject_types (name) VALUES ($1) RETURNING id',
      [typeName]
    )
  }

  return subjectType[0]?.id || null
}

/**
 * Find PDF files in directory that match QP codes
 */
export function findPDFFiles(directory: string): Map<string, string> {
  const pdfMap = new Map<string, string>()
  
  function scanDirectory(dir: string) {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath)
      } else if (item.toLowerCase().endsWith('.pdf')) {
        // Extract QP code from filename (e.g., "133750_1762152327189.pdf" -> "133750")
        const qpCodeMatch = item.match(/^(\d+)_/)
        if (qpCodeMatch) {
          const qpCode = qpCodeMatch[1]
          pdfMap.set(qpCode, fullPath)
        }
      }
    }
  }
  
  scanDirectory(directory)
  return pdfMap
}

/**
 * Match PDFs to CSV entries
 */
export async function matchPDFsToCSV(
  csvRows: CSVRow[],
  pdfMap: Map<string, string>
): Promise<ParsedPaper[]> {
  const papers: ParsedPaper[] = []

  for (const row of csvRows) {
    if (!row.qpCode) continue

    const { subjectCode, subjectName } = extractSubjectInfo(row.paperName)
    const semester = extractSemester(subjectCode)
    const year = extractYear(row.dateOfExam)
    const subjectTypeCode = extractSubjectTypeCode(subjectCode)
    const departmentPrefix = detectDepartmentPrefix(subjectCode)
    const pdfPath = pdfMap.get(row.qpCode)

    papers.push({
      qpCode: row.qpCode,
      subjectCode,
      subjectName,
      semester,
      year,
      subjectType: subjectTypeCode,
      departmentPrefix,
      pdfPath,
    })
  }

  return papers
}

/**
 * Clean up temporary files
 */
export function cleanupTempFiles(directory: string): void {
  if (fs.existsSync(directory)) {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}
