# Supabase Setup Instructions

Your app is currently using a **placeholder Supabase URL** that doesn't exist. To enable real database functionality, you need to create a real Supabase project.

## Steps to Set Up Supabase

### 1. Create a Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub, Google, or email

### 2. Create a New Project
1. Click "New Project"
2. Choose your organization
3. Fill in project details:
   - **Name**: `POS Inventory System` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project"
5. Wait for the project to be set up (takes 1-2 minutes)

### 3. Get Your Project Credentials
1. In your new project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijk.supabase.co`)
   - **anon public** key (the long JWT token)

### 4. Update Your Environment File
1. Open `.env` file in your project root
2. Replace the placeholder values:
   ```bash
   # Replace these with your real values
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

### 5. Set Up Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Run the SQL from `database-schema.sql` to create your tables
3. Or use the **Table Editor** to create tables manually

### 6. Configure Authentication (Optional)
1. Go to **Authentication** → **Settings**
2. Configure email templates, providers, etc.
3. For development, you can disable email confirmation

### 7. Test Your Setup
1. Restart your development server: `npm run dev`
2. Try registering a new user
3. Check the **Authentication** → **Users** tab in Supabase to see if users are being created

## Current Status

✅ **Mock Client**: Your app is currently using a mock Supabase client for development
❌ **Real Database**: No real database connection (placeholder URL detected)

## What Happens Next?

- **With Mock Client**: Registration appears to work, but data isn't saved anywhere
- **With Real Supabase**: Users will be saved to your actual database and you can manage them in the Supabase dashboard

## Need Help?

- 📖 [Supabase Documentation](https://supabase.com/docs)
- 🎥 [Supabase Quickstart Video](https://supabase.com/docs/guides/getting-started)
- 💬 [Supabase Discord Community](https://discord.supabase.com)
