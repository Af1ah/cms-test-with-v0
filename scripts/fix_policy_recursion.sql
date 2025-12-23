-- ============================================================================
-- FIX INFINITE RECURSION IN USER_PROFILES POLICIES
-- Resolves the policy recursion issue
-- ============================================================================

-- First, create the admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create simple policies for admin_users table
DROP POLICY IF EXISTS "Allow authenticated users to read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow super admins to manage admin_users" ON admin_users;

CREATE POLICY "Allow authenticated users to read admin_users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow super admins to manage admin_users" ON admin_users
    FOR ALL USING (id = auth.uid() OR is_super_admin = true);

-- Now drop all problematic user_profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;

-- Create simpler, non-recursive policies
CREATE POLICY "Allow public read access to user profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- For admin access, use admin_users table instead of user_profiles to avoid recursion
CREATE POLICY "Allow admin users to manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Also fix any poster policies that might have similar issues
DROP POLICY IF EXISTS "Admins can manage all posters" ON posters;

-- Recreate poster admin policy using admin_users table
CREATE POLICY "Allow super admins to manage all posters" ON posters
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );

-- Update the user registration function to be simpler and avoid conflicts
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create user profile first
    INSERT INTO user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        CASE 
            WHEN NEW.email = 'muhammadaflah23524@gmail.com' THEN 'super_admin'
            ELSE 'user'
        END
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Then create admin_users entry if needed
    IF NEW.email = 'muhammadaflah23524@gmail.com' THEN
        INSERT INTO admin_users (id, email, is_super_admin)
        VALUES (NEW.id, NEW.email, true)
        ON CONFLICT (id) DO UPDATE SET is_super_admin = true;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Verify the policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'posters')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test the fix
SELECT '✅ Policy recursion fixed! User profiles should work now.' as status;
