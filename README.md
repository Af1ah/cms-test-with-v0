# Poster Gallery Website

A modern poster gallery website with admin authentication and CMS system built with Next.js and Supabase.

## Features

- **Public Gallery**: Browse beautiful poster collections with category filtering
- **Admin Authentication**: Secure email/password login system
- **Content Management**: Full CRUD operations for poster management
- **Responsive Design**: Modern, mobile-first design with smooth animations
- **Database Integration**: Supabase backend with Row Level Security

## Database Setup

The following scripts have been created to set up your database:

1. `005_setup_new_database.sql` - Creates the posters table with RLS policies
2. `006_seed_fresh_data.sql` - Adds sample poster data
3. `008_add_user_id_column.sql` - Adds user ownership tracking
4. `009_final_setup_verification.sql` - Verifies the setup

## Admin Access

- Navigate to `/admin/login` to access the admin panel
- Create an admin account via `/admin/signup`
- Manage posters through the admin dashboard at `/admin/dashboard`

## API Endpoints

- `GET /api/posters` - Fetch all posters (with optional category filtering)
- `POST /api/posters` - Create new poster (authenticated)
- `GET /api/posters/[id]` - Get specific poster
- `PUT /api/posters/[id]` - Update poster (authenticated, owner only)
- `DELETE /api/posters/[id]` - Delete poster (authenticated, owner only)

## Environment Variables

The following environment variables are automatically configured through the Supabase integration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Additional Postgres connection variables

## Getting Started

1. Ensure Supabase integration is connected
2. Run the database setup scripts in order
3. Visit the homepage to see the poster gallery
4. Create an admin account to start managing content

## 🚀 Performance Optimization

This project has been heavily optimized for performance, accessibility, and SEO.

### Testing Performance Properly
To see the **true performance** of the application (as it would be in production), avoid running Lighthouse in development mode (`npm run dev`). Instead, use a production build:

1. **Build the project**:
   ```bash
   npm run build
   ```
2. **Start in production mode**:
   ```bash
   npm run start
   ```
3. Open `http://localhost:3000` in a **Guest/Incognito window**.
4. Run the Lighthouse audit.

### Key Optimizations Implemented:
- **Incremental Static Regeneration (ISR)**: The home page is cached and revalidated in the background.
- **Database Connection Pooling**: Optimized DB queries with lock-based initialization.
- **Parallel Fetching**: Reduced waterfall delays by parallelizing server-side data requests.
- **Image Optimization**: Fully utilized `next/image` with proper prioritization and quality settings.
- **TBT Reduction**: Eliminated artificial transition delays and reduced main-thread blocking scripts.
