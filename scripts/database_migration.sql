-- Database Migration Script for GC Tanur Question Paper Repository
-- Run this script to create the required tables in PostgreSQL

-- Drop old tables if they exist (clearing old data)
DROP TABLE IF EXISTS posters CASCADE;

-- Enable UUID extension for secure file references
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default departments
INSERT INTO departments (name) VALUES 
    ('Computer Science'),
    ('Commerce'),
    ('Electronics'),
    ('Malayalam'),
    ('English')
ON CONFLICT (name) DO NOTHING;

-- Create subject_types table
CREATE TABLE IF NOT EXISTS subject_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subject types
INSERT INTO subject_types (name) VALUES 
    ('Major'),
    ('Minor'),
    ('Open Course'),
    ('Common Course')
ON CONFLICT (name) DO NOTHING;

-- Create program_types table
CREATE TABLE IF NOT EXISTS program_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default program types
INSERT INTO program_types (name) VALUES 
    ('CBCSS-UG'),
    ('FYUGP'),
    ('Integrated PG')
ON CONFLICT (name) DO NOTHING;

-- Create question_papers table with secure file reference
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
    -- Secure file reference (UUID-based filename, no path exposure)
    file_url TEXT NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    original_filename VARCHAR(255),
    -- Audit fields
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for security tracking
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_table VARCHAR(100),
    target_id INTEGER,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_papers_subject_name ON question_papers(subject_name);
CREATE INDEX IF NOT EXISTS idx_papers_subject_code ON question_papers(subject_code);
CREATE INDEX IF NOT EXISTS idx_papers_year ON question_papers(year_of_examination);
CREATE INDEX IF NOT EXISTS idx_papers_semester ON question_papers(semester);
CREATE INDEX IF NOT EXISTS idx_papers_department ON question_papers(department_id);
CREATE INDEX IF NOT EXISTS idx_papers_subject_type ON question_papers(subject_type_id);
CREATE INDEX IF NOT EXISTS idx_papers_program_type ON question_papers(program_type_id);
CREATE INDEX IF NOT EXISTS idx_papers_created_at ON question_papers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_papers_created_by ON question_papers(created_by);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- Full text search index for subject name (for autocomplete)
CREATE INDEX IF NOT EXISTS idx_papers_subject_name_trgm ON question_papers USING gin(subject_name gin_trgm_ops);

-- ============================================================
-- ROLE-BASED ACCESS CONTROL (RLS) - Optional for PostgreSQL
-- ============================================================
-- Uncomment below to enable row-level security

-- ALTER TABLE question_papers ENABLE ROW LEVEL SECURITY;

-- -- Public can read all papers
-- CREATE POLICY papers_read_all ON question_papers
--     FOR SELECT USING (true);

-- -- Only authenticated users can insert
-- CREATE POLICY papers_insert_auth ON question_papers
--     FOR INSERT WITH CHECK (created_by IS NOT NULL);

-- -- Users can update/delete only their own papers (unless admin)
-- CREATE POLICY papers_modify_own ON question_papers
--     FOR UPDATE USING (
--         created_by = current_setting('app.current_user_id')::INTEGER
--         OR current_setting('app.current_user_role') = 'admin'
--     );

-- CREATE POLICY papers_delete_own ON question_papers
--     FOR DELETE USING (
--         created_by = current_setting('app.current_user_id')::INTEGER
--         OR current_setting('app.current_user_role') = 'admin'
--     );

-- ============================================================
-- Usage:
-- psql -U postgres -d qnbank -f scripts/database_migration.sql
-- ============================================================
