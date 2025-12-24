import { Pool } from 'pg'

// Create a connection pool to PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || '',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '5432'),
})

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    return res.rows as T[]
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export async function getClient() {
  const client = await pool.connect()
  return client
}

let isInitialized = false
let initPromise: Promise<void> | null = null

// Initialize database tables
export async function initializeDatabase() {
  if (isInitialized) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      // Create users table
      await query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'admin',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Create departments table
      await query(`
        CREATE TABLE IF NOT EXISTS departments (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Insert default departments
      await query(`
        INSERT INTO departments (name) VALUES 
          ('Computer Science'),
          ('Commerce'),
          ('Electronics'),
          ('Malayalam'),
          ('English')
        ON CONFLICT (name) DO NOTHING
      `)

      // Create subject_types table
      await query(`
        CREATE TABLE IF NOT EXISTS subject_types (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Insert default subject types
      await query(`
        INSERT INTO subject_types (name) VALUES 
          ('Major'),
          ('Minor'),
          ('Open Course'),
          ('Common Course')
        ON CONFLICT (name) DO NOTHING
      `)

      // Create program_types table
      await query(`
        CREATE TABLE IF NOT EXISTS program_types (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Insert default program types
      await query(`
        INSERT INTO program_types (name) VALUES 
          ('CBCSS-UG'),
          ('FYUGP'),
          ('Integrated PG')
        ON CONFLICT (name) DO NOTHING
      `)

      // Create question_papers table
      await query(`
        CREATE TABLE IF NOT EXISTS question_papers (
          id SERIAL PRIMARY KEY,
          subject_name VARCHAR(255) NOT NULL,
          subject_code VARCHAR(100) NOT NULL,
          paper_code VARCHAR(100),
          year_of_examination INTEGER NOT NULL,
          semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 10),
          subject_type_id INTEGER REFERENCES subject_types(id) ON DELETE SET NULL,
          program_type_id INTEGER REFERENCES program_types(id) ON DELETE SET NULL,
          department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
          description TEXT,
          file_url TEXT NOT NULL,
          file_type VARCHAR(20) NOT NULL,
          original_filename VARCHAR(255),
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Create indexes for better search performance
      await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_papers_subject_name ON question_papers(subject_name)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_papers_subject_code ON question_papers(subject_code)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_papers_year ON question_papers(year_of_examination)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_papers_semester ON question_papers(semester)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_papers_department ON question_papers(department_id)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_papers_subject_type ON question_papers(subject_type_id)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_papers_program_type ON question_papers(program_type_id)`)
      await query(`CREATE INDEX IF NOT EXISTS idx_papers_created_at ON question_papers(created_at DESC)`)

      console.log('Database tables initialized successfully')
      isInitialized = true
    } catch (error) {
      console.error('Failed to initialize database:', error)
      throw error
    } finally {
      initPromise = null
    }
  })()

  return initPromise
}

export default pool
