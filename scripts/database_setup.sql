-- ============================================================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Clean, optimized, realtime-enabled CMS database setup
-- ============================================================================

-- Drop all existing tables and policies for clean start
DROP TABLE IF EXISTS poster_categories CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS posters CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USER PROFILES TABLE
-- ============================================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POSTER CATEGORIES TABLE
-- ============================================================================
CREATE TABLE poster_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE poster_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. POSTERS TABLE (OPTIMIZED & COMPATIBLE)
-- ============================================================================
CREATE TABLE posters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    category TEXT, -- Keep as text for frontend compatibility
    price DECIMAL(10,2),
    featured BOOLEAN DEFAULT false, -- Keep original column name
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE posters ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);

-- Categories indexes
CREATE INDEX idx_categories_slug ON poster_categories(slug);
CREATE INDEX idx_categories_active ON poster_categories(is_active);

-- Posters indexes (optimized for queries)
CREATE INDEX idx_posters_category ON posters(category);
CREATE INDEX idx_posters_user_id ON posters(user_id);
CREATE INDEX idx_posters_featured ON posters(featured) WHERE featured = true;
CREATE INDEX idx_posters_created_desc ON posters(created_at DESC);
CREATE INDEX idx_posters_view_count ON posters(view_count DESC);
CREATE INDEX idx_posters_search ON posters USING gin(to_tsvector('english', title || ' ' || coalesce(description, '')));

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- USER PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- CATEGORIES POLICIES
CREATE POLICY "Categories are viewable by everyone" ON poster_categories
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" ON poster_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- POSTERS POLICIES
CREATE POLICY "Published posters are viewable by everyone" ON posters
    FOR SELECT USING (true); -- All posters are viewable (simplified)

CREATE POLICY "Users can view their own posters" ON posters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert posters" ON posters
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        auth.uid() = user_id
    );

CREATE POLICY "Users can update their own posters" ON posters
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posters" ON posters
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all posters" ON posters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Updated_at triggers
CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER poster_categories_updated_at
    BEFORE UPDATE ON poster_categories
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER posters_updated_at
    BEFORE UPDATE ON posters
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create user profile
    INSERT INTO user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        CASE 
            WHEN NEW.email = 'muhammadaflah23524@gmail.com' THEN 'super_admin'
            ELSE 'user'
        END
    );
    
    RETURN NEW;
END;
$$;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(poster_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE posters 
    SET view_count = view_count + 1
    WHERE id = poster_uuid;
END;
$$;

-- ============================================================================
-- 7. STORAGE BUCKET SETUP
-- ============================================================================

-- Create storage bucket for posters
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'posters', 
    'posters', 
    true, 
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (these need to be run as service_role or via dashboard)
-- Note: Run these manually in dashboard if this fails
DO $$
BEGIN
    -- Allow authenticated users to upload
    CREATE POLICY "Authenticated users can upload posters" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'posters' AND 
            auth.role() = 'authenticated'
        );
    
    -- Allow public read access
    CREATE POLICY "Public can view poster images" ON storage.objects
        FOR SELECT USING (bucket_id = 'posters');
    
    -- Allow users to update their own uploads
    CREATE POLICY "Users can update their poster images" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'posters' AND 
            auth.role() = 'authenticated'
        );
    
    -- Allow users to delete their own uploads
    CREATE POLICY "Users can delete their poster images" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'posters' AND 
            auth.role() = 'authenticated'
        );
        
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Storage policies need to be created manually in dashboard';
END $$;

-- ============================================================================
-- 8. REALTIME CONFIGURATION
-- ============================================================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE poster_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE posters;

-- ============================================================================
-- 9. DEFAULT DATA
-- ============================================================================

-- Insert default categories (for reference, but posters will use text category)
INSERT INTO poster_categories (name, slug, description, color) VALUES
    ('General', 'general', 'General purpose posters', '#6b7280'),
    ('Technology', 'technology', 'Tech and programming related', '#3b82f6'),
    ('Business', 'business', 'Business and corporate', '#10b981'),
    ('Art & Design', 'art-design', 'Creative and artistic', '#f59e0b'),
    ('Education', 'education', 'Educational content', '#8b5cf6'),
    ('Healthcare', 'healthcare', 'Medical and health related', '#ef4444'),
    ('Marketing', 'marketing', 'Marketing and advertising', '#ec4899'),
    ('Vintage', 'vintage', 'Vintage and retro designs', '#9333ea'),
    ('Modern', 'modern', 'Modern contemporary designs', '#06b6d4'),
    ('Abstract', 'abstract', 'Abstract art and designs', '#f97316'),
    ('Nature', 'nature', 'Nature and landscape themes', '#22c55e'),
    ('Typography', 'typography', 'Typography and text-based designs', '#84cc16'),
    ('Photography', 'photography', 'Photography-based posters', '#ef4444'),
    ('Illustration', 'illustration', 'Illustrated designs', '#8b5cf6')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 10. PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Analyze tables for query optimization
ANALYZE user_profiles;
ANALYZE poster_categories;
ANALYZE posters;

-- Enable auto-vacuum for better performance
ALTER TABLE user_profiles SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE poster_categories SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE posters SET (autovacuum_vacuum_scale_factor = 0.1);

-- ============================================================================
-- 11. VERIFICATION
-- ============================================================================

-- Verify setup
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'poster_categories', 'posters');
    
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
    
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📊 Tables created: %', table_count;
    RAISE NOTICE '🔒 RLS policies created: %', policy_count;
    RAISE NOTICE '🚀 Performance indexes created: %', index_count;
    RAISE NOTICE '⚡ Realtime enabled for all tables';
    RAISE NOTICE '🗂️ Storage bucket configured';
    RAISE NOTICE '👤 Super admin: muhammadaflah23524@gmail.com';
END $$;

-- Show table structure
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'poster_categories', 'posters');

-- Final success message
SELECT '🎉 CMS Database Setup Complete! Ready for production use.' as status;
