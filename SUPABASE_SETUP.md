# Supabase Setup Guide

## Step 1: Install Supabase Package

✅ Already installed: `@supabase/supabase-js`

## Step 2: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - Name: `vouchfor` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to you
4. Wait for project to be created (~2 minutes)

## Step 3: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 4: Set Up Environment Variables

1. Create a `.env.local` file in the root of your project (same level as `package.json`)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Replace `your-project-url-here` and `your-anon-key-here` with your actual values from Step 3.

## Step 5: Create the Database Table

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

This will create:
- The `vendors` table with all required columns
- Indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp updates

## Step 6: Verify Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see the `vendors` table
3. Check that all columns are present

## Step 7: Test the Integration

1. Start your dev server: `npm run dev`
2. Fill out the OfferSetupForm
3. Click "Save Program Rules"
4. Check your Supabase `vendors` table - you should see a new row!

## Troubleshooting

- **"Missing Supabase environment variables"**: Make sure `.env.local` exists and has the correct variable names (must start with `VITE_`)
- **"Failed to save"**: Check browser console for errors. Make sure RLS policies are set up correctly.
- **Can't see data**: Check that you're looking at the right project in Supabase dashboard.




