# Admin User Setup Instructions

## Automatic Admin User Setup

The system is now configured to automatically grant super admin privileges to the email: `muhammadaflah23524@gmail.com`

## Admin Access Key

For unauthorized access to the admin panel, you can use the access key: **235245**

- Access admin routes directly by adding `?key=235245` to any admin URL
- Example: `http://localhost:3000/admin/dashboard?key=235245`
- The key is valid for 24 hours and will be stored in a secure cookie

## Steps to Create the Admin User:

1. **Setup Environment**
   - Ensure your `.env.local` file contains your Supabase credentials
   - The admin access key (235245) is already configured

2. **Run the Database Script**
   - Execute `scripts/database_setup.sql` in your Supabase SQL editor to set up the complete optimized database system

3. **Create the Admin Account**
   - Navigate to `/admin/signup` in your browser (or use `?key=235245` for direct access)
   - Use the following credentials:
     - **Email**: `muhammadaflah23524@gmail.com`
     - **Password**: `Aflah@123`

4. **Automatic Privileges**
   - The system will automatically detect this email and grant super admin privileges
   - Super admins can manage all posters (not just their own)
   - Super admins can manage other admin users

## Admin Features:

- **Super Admin Privileges**: Can manage all posters regardless of owner
- **User Management**: Can view and manage other admin users through the new user_profiles system
- **Full CMS Access**: Complete control over the poster gallery content
- **Category Management**: Can create and manage poster categories
- **Analytics**: Access to view counts and download statistics
- **Realtime Updates**: Live updates across all admin interfaces

## Database Structure:

The new optimized database includes:
- **user_profiles**: Enhanced user management with role-based access
- **poster_categories**: Organized categorization system
- **posters**: Main content table with advanced features and analytics
- **Realtime enabled**: All tables support live updates
- **Performance optimized**: Strategic indexing and query optimization

## Security Notes:

- The admin system uses Row Level Security (RLS) policies
- Super admin status is automatically assigned based on email
- All admin actions are logged and tracked
- Regular users can only manage their own posters

## Access Points:

- **Admin Login**: `/admin/login`
- **Admin Dashboard**: `/admin/dashboard`
- **Poster Management**: `/admin/posters`
- **User Management**: Available in admin dashboard

The admin user will be automatically configured with super admin privileges upon first signup with the specified email address.
