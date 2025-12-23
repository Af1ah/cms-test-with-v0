-- ============================================================================
-- QUICK FIX FOR POSTER UPLOAD ISSUE
-- Ensures category column exists and fixes schema cache issues
-- ============================================================================

-- First, let's check the current structure and fix any missing columns
DO $$
BEGIN
    -- Ensure category column exists with correct type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posters' AND column_name = 'category'
    ) THEN
        ALTER TABLE posters ADD COLUMN category TEXT;
        RAISE NOTICE 'Added category column to posters table';
    ELSE
        -- Check if it's the wrong type and fix it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'posters' 
            AND column_name = 'category' 
            AND data_type != 'text' 
            AND data_type != 'character varying'
        ) THEN
            -- Convert to text type
            ALTER TABLE posters ALTER COLUMN category TYPE TEXT;
            RAISE NOTICE 'Fixed category column type to TEXT';
        END IF;
    END IF;

    -- Ensure featured column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posters' AND column_name = 'featured'
    ) THEN
        ALTER TABLE posters ADD COLUMN featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added featured column to posters table';
    END IF;

    -- Add other optional columns if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posters' AND column_name = 'price'
    ) THEN
        ALTER TABLE posters ADD COLUMN price DECIMAL(10,2);
        RAISE NOTICE 'Added price column to posters table';
    END IF;
END $$;

-- Refresh the schema cache by reloading the publication
SELECT pg_notify('pgrst', 'reload schema');

-- Force a schema refresh
NOTIFY pgrst, 'reload schema';

-- Verify the current table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'posters' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity,
    hasindexes,
    hastriggers
FROM pg_tables 
WHERE tablename = 'posters' 
AND schemaname = 'public';

-- Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'posters' 
AND schemaname = 'public'
ORDER BY policyname;

-- Final success message
SELECT 
    '✅ Schema fix completed! The category column should now work properly.' as status,
    'Try uploading a poster again.' as next_step;
