-- Database Migration Script for GC Tanur Question Paper Repository
-- Run this script to create the required tables in PostgreSQL

-- Drop old tables if they exist (clearing old data)
DROP TABLE IF EXISTS posters CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
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

-- Create question_papers table
CREATE TABLE IF NOT EXISTS question_papers (
    id SERIAL PRIMARY KEY,
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(100) NOT NULL,
    paper_code VARCHAR(100),
    year_of_examination INTEGER NOT NULL,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 10),
    subject_type_id INTEGER REFERENCES subject_types(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    original_filename VARCHAR(255),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_papers_subject_name ON question_papers(subject_name);
CREATE INDEX IF NOT EXISTS idx_papers_subject_code ON question_papers(subject_code);
CREATE INDEX IF NOT EXISTS idx_papers_year ON question_papers(year_of_examination);
CREATE INDEX IF NOT EXISTS idx_papers_semester ON question_papers(semester);
CREATE INDEX IF NOT EXISTS idx_papers_department ON question_papers(department_id);
CREATE INDEX IF NOT EXISTS idx_papers_subject_type ON question_papers(subject_type_id);
CREATE INDEX IF NOT EXISTS idx_papers_created_at ON question_papers(created_at DESC);

-- Full text search index for subject name (for autocomplete)
CREATE INDEX IF NOT EXISTS idx_papers_subject_name_trgm ON question_papers USING gin(subject_name gin_trgm_ops);

-- Usage:
-- psql -U postgres -d qnbank -f scripts/database_migration.sql
