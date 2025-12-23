-- ============================================================================
-- TEST POSTER INSERT - Debug Upload Issues
-- Run this to test if poster insertion works
-- ============================================================================

-- Test basic poster insertion
DO $$
DECLARE
    test_user_id UUID;
    result_id UUID;
BEGIN
    -- Get a test user ID (you can replace with a real user ID)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '❌ No users found in auth.users table';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Testing with user ID: %', test_user_id;
    
    -- Try to insert a test poster
    INSERT INTO posters (
        title,
        description,
        image_url,
        category,
        user_id
    ) VALUES (
        'Test Poster',
        'This is a test poster to verify the schema',
        'https://example.com/test-image.jpg',
        'test',
        test_user_id
    ) RETURNING id INTO result_id;
    
    RAISE NOTICE '✅ Test poster created successfully with ID: %', result_id;
    
    -- Clean up test data
    DELETE FROM posters WHERE id = result_id;
    RAISE NOTICE '🧹 Test poster cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test failed: %', SQLERRM;
    RAISE NOTICE '💡 Error details: %', SQLSTATE;
END $$;

-- Show the exact column structure for debugging
SELECT 
    'Column: ' || column_name || 
    ', Type: ' || data_type || 
    ', Nullable: ' || is_nullable ||
    ', Default: ' || COALESCE(column_default, 'NULL') as column_info
FROM information_schema.columns 
WHERE table_name = 'posters' 
AND table_schema = 'public'
ORDER BY ordinal_position;
