# Supabase Storage Setup Guide for Poster Uploads

## Issue
You're getting a "row-level security policy" error because your Supabase storage bucket doesn't have the proper policies configured to allow authenticated users to upload files.

## ⚠️ Important Note
Storage policies **CANNOT** be created via SQL Editor due to permission restrictions. You **MUST** use the Supabase Dashboard UI.

## Solution Steps

### Step 1: Create Storage Bucket

1. **Run the SQL script first**:
   - Go to your Supabase Dashboard → SQL Editor
   - Run the script from `scripts/setup_storage_policies.sql`
   - This creates the "posters" bucket

### Step 2: Create Storage Policies via Dashboard

1. **Navigate to Storage Policies**:
   - Go to your Supabase Dashboard
   - Navigate to **Storage** → **Policies**

2. **Create Policy 1: Upload Policy**
   - Click **"New Policy"**
   - Select table: **storage.objects**
   - Policy name: `Allow authenticated users to upload posters`
   - Allowed operation: **INSERT**
   - Target roles: **authenticated**  
   - WITH CHECK expression: `bucket_id = 'posters'`
   - Click **Save**

3. **Create Policy 2: Public View Policy**
   - Click **"New Policy"**
   - Select table: **storage.objects**
   - Policy name: `Allow public to view posters`
   - Allowed operation: **SELECT**
   - Target roles: **public**
   - USING expression: `bucket_id = 'posters'`
   - Click **Save**

4. **Create Policy 3: Update Policy**
   - Click **"New Policy"**
   - Select table: **storage.objects**
   - Policy name: `Allow authenticated users to update posters`
   - Allowed operation: **UPDATE**
   - Target roles: **authenticated**
   - USING expression: `bucket_id = 'posters'`
   - WITH CHECK expression: `bucket_id = 'posters'`
   - Click **Save**

5. **Create Policy 4: Delete Policy**
   - Click **"New Policy"**
   - Select table: **storage.objects**
   - Policy name: `Allow authenticated users to delete posters`
   - Allowed operation: **DELETE**
   - Target roles: **authenticated**
   - USING expression: `bucket_id = 'posters'`
   - Click **Save**

### Step 3: Verify Setup

1. **Check bucket exists**:
   - Go to **Storage** → **Buckets**
   - Verify "posters" bucket is listed and marked as **Public**

2. **Check policies**:
   - Go to **Storage** → **Policies**  
   - You should see 4 policies for the `storage.objects` table

### Step 4: Test Upload

1. Restart your development server:
   \`\`\`bash
   pnpm run dev
   \`\`\`

2. Navigate to: `http://localhost:3001/admin/posters/new`

3. Try uploading an image file

## Troubleshooting

### Common Issues:
- **"Must be owner of table objects"**: Use Dashboard UI, not SQL Editor for policies
- **Bucket not found**: Run the SQL script first to create the bucket  
- **Not authenticated**: Ensure you're logged in to your admin panel
- **Upload still fails**: Double-check all 4 policies are created correctly

### Verification Commands:
After setup, you can verify in SQL Editor:
\`\`\`sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'posters';

-- Check policies exist  
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
\`\`\`

## Environment Variables
Ensure these are set in your `.env.local`:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

After completing these steps via the **Dashboard UI**, your file upload functionality should work correctly!
